/*
 * Inkling logic: everything that can be tested without a screen.
 * Works in the browser (window.InklingLogic) and in Node (require).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InklingLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SEED = 20261022;
  var MIN_PER_DAY = 1;
  var MAX_PER_DAY = 3;
  var TIMER_CHOICES = [5, 10, 15, 20, 30];
  var STORAGE_KEY = 'inkling.settings.v1';

  // ---------- small helpers ----------

  function mod(a, n) { return ((a % n) + n) % n; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }

  // Small seeded random generator, so the order is the same on every device.
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleInPlace(arr, rnd) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /*
   * A fixed order for the prompts that mixes the themes: each "round" takes one
   * prompt from every theme that still has some, in a random theme order, and
   * never starts a round with the theme that ended the last one.
   * Returns an array of indexes into the prompts list.
   */
  function varietyOrder(prompts, seed) {
    var rnd = mulberry32(seed == null ? SEED : seed);
    var groups = {};
    var themeNames = [];
    prompts.forEach(function (p, i) {
      if (!groups[p[0]]) { groups[p[0]] = []; themeNames.push(p[0]); }
      groups[p[0]].push(i);
    });
    themeNames.forEach(function (t) { shuffleInPlace(groups[t], rnd); });

    var order = [];
    var lastTheme = null;
    while (order.length < prompts.length) {
      var round = themeNames.filter(function (t) { return groups[t].length > 0; });
      shuffleInPlace(round, rnd);
      if (round.length > 1 && round[0] === lastTheme) {
        var k = 1 + Math.floor(rnd() * (round.length - 1));
        var tmp = round[0]; round[0] = round[k]; round[k] = tmp;
      }
      for (var r = 0; r < round.length; r++) {
        order.push(groups[round[r]].pop());
        lastTheme = round[r];
      }
    }
    return order;
  }

  // ---------- times ----------

  function parseTime(str) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(str == null ? '' : str).trim());
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }

  function formatTime(mins) { return pad2(Math.floor(mins / 60)) + ':' + pad2(mins % 60); }

  function defaultTimes(perDay) {
    var table = {
      1: [19 * 60],
      2: [12 * 60 + 30, 19 * 60],
      3: [9 * 60, 13 * 60, 19 * 60]
    };
    return (table[perDay] || table[1]).map(formatTime);
  }

  // ---------- settings ----------

  function defaultSettings() {
    return {
      seen: false,
      perDay: 1,
      times: defaultTimes(1),
      timer: 'suggested',
      skip: null,            // { key: '20000:0', n: 2 } for the current prompt only
      remindersAdded: false,
      remindersStale: false
    };
  }

  /* Turns whatever was stored (possibly old, partial or damaged) into valid settings. */
  function normalizeSettings(raw) {
    var s = defaultSettings();
    if (!raw || typeof raw !== 'object') return s;

    s.seen = raw.seen === true;
    var pd = parseInt(raw.perDay, 10);
    s.perDay = (pd >= MIN_PER_DAY && pd <= MAX_PER_DAY) ? pd : 1;

    var times = Array.isArray(raw.times) ? raw.times.map(parseTime) : [];
    var ok = times.length === s.perDay && times.every(function (t) { return t !== null; });
    if (ok) {
      times.sort(function (a, b) { return a - b; });
      for (var i = 1; i < times.length; i++) if (times[i] === times[i - 1]) ok = false;
    }
    s.times = ok ? times.map(formatTime) : defaultTimes(s.perDay);

    var t = raw.timer;
    s.timer = (t === 'suggested' || TIMER_CHOICES.indexOf(+t) !== -1) ? (t === 'suggested' ? t : +t) : 'suggested';

    if (raw.skip && typeof raw.skip.key === 'string' && raw.skip.n > 0 && raw.skip.n < 1000) {
      s.skip = { key: raw.skip.key, n: Math.floor(raw.skip.n) };
    }
    s.remindersAdded = raw.remindersAdded === true;
    s.remindersStale = raw.remindersStale === true;
    return s;
  }

  /* Returns an error message if these times can't be used, otherwise null. */
  function validateTimes(times) {
    var parsed = times.map(parseTime);
    if (parsed.some(function (t) { return t === null; })) return 'Please enter every time.';
    var sorted = parsed.slice().sort(function (a, b) { return a - b; });
    for (var i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1]) return 'Each drawing needs its own time.';
    }
    return null;
  }

  // ---------- which prompt is it? ----------

  function dayNumber(date) {
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  /* The slot that is "current": the latest time today that has already passed.
     Before the first time of the day, yesterday's last slot is still current. */
  function currentSlot(settings, now) {
    var mins = now.getHours() * 60 + now.getMinutes();
    var times = settings.times.map(parseTime);
    var idx = -1;
    for (var i = 0; i < times.length; i++) if (times[i] <= mins) idx = i;
    var day = dayNumber(now);
    var fromYesterday = false;
    if (idx === -1) { day -= 1; idx = times.length - 1; fromYesterday = true; }
    return {
      dayNum: day,
      slotIdx: idx,
      key: day + ':' + idx,
      startMinutes: times[idx],
      fromYesterday: fromYesterday
    };
  }

  function nextSlot(settings, now) {
    var mins = now.getHours() * 60 + now.getMinutes();
    var times = settings.times.map(parseTime);
    for (var i = 0; i < times.length; i++) {
      if (times[i] > mins) return { minutes: times[i], tomorrow: false, slotIdx: i };
    }
    return { minutes: times[0], tomorrow: true, slotIdx: 0 };
  }

  function nextText(settings, now) {
    var n = nextSlot(settings, now);
    return 'Next prompt ' + (n.tomorrow ? 'tomorrow at ' : 'at ') + formatTime(n.minutes);
  }

  /* A step that doesn't share a factor with the number of prompts,
     so "another one" always lands somewhere new. */
  function strideFor(n) {
    var s = 13;
    while (gcd(s, n) !== 1) s++;
    return s;
  }

  function promptIndex(order, perDay, slot, skips) {
    var n = order.length;
    var base = slot.dayNum * perDay + slot.slotIdx;
    return order[mod(base + (skips || 0) * strideFor(n), n)];
  }

  function skipsFor(settings, slot) {
    return settings.skip && settings.skip.key === slot.key ? settings.skip.n : 0;
  }

  // ---------- timer ----------

  function timerMinutes(settings, promptMinutes) {
    if (settings.timer === 'suggested') return Math.max(1, promptMinutes || 10);
    return settings.timer;
  }

  function formatMMSS(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    return pad2(Math.floor(total / 60)) + ':' + pad2(total % 60);
  }

  // ---------- calendar file (.ics) ----------

  function icsEscape(s) {
    return String(s)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function utf8Len(ch) {
    var c = ch.codePointAt(0);
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  /* Lines in a calendar file may be at most 75 bytes; longer ones continue on
     the next line, which starts with a single space. */
  function foldLine(line) {
    var out = [];
    var cur = '';
    var bytes = 0;
    for (var ch of line) {
      var b = utf8Len(ch);
      var limit = out.length === 0 ? 75 : 74;
      if (bytes + b > limit) { out.push(cur); cur = ''; bytes = 0; }
      cur += ch;
      bytes += b;
    }
    out.push(cur);
    return out.join('\r\n ');
  }

  function icsDate(d) { return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()); }

  function icsStamp(d) {
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate()) + 'T' +
      pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + pad2(d.getUTCSeconds()) + 'Z';
  }

  /*
   * One repeating daily event per drawing slot, at "floating" local times so
   * they follow the phone's time zone. Each has a stable UID, so adding the
   * file again updates the same events in most calendar apps instead of
   * piling up copies.
   */
  function buildICS(settings, opts) {
    opts = opts || {};
    var now = opts.now || new Date();
    var url = opts.url || '';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Inkling//Drawing prompts//EN',
      'CALSCALE:GREGORIAN'
    ];
    settings.times.forEach(function (t, i) {
      var mins = parseTime(t);
      lines.push(
        'BEGIN:VEVENT',
        'UID:inkling-draw-' + (i + 1) + '@inkling.local',
        'DTSTAMP:' + icsStamp(now),
        'DTSTART:' + icsDate(now) + 'T' + pad2(Math.floor(mins / 60)) + pad2(mins % 60) + '00',
        'DURATION:PT15M',
        'RRULE:FREQ=DAILY',
        'SUMMARY:' + icsEscape('Time to draw (Inkling)'),
        'DESCRIPTION:' + icsEscape('Open Inkling for your next drawing prompt.' + (url ? ' ' + url : '')),
        url ? 'URL:' + url : null,
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:' + icsEscape('Time to draw'),
        'TRIGGER:PT0M',
        'END:VALARM',
        'END:VEVENT'
      );
    });
    lines.push('END:VCALENDAR');
    return lines.filter(Boolean).map(foldLine).join('\r\n') + '\r\n';
  }

  return {
    SEED: SEED,
    MAX_PER_DAY: MAX_PER_DAY,
    TIMER_CHOICES: TIMER_CHOICES,
    STORAGE_KEY: STORAGE_KEY,
    mulberry32: mulberry32,
    varietyOrder: varietyOrder,
    parseTime: parseTime,
    formatTime: formatTime,
    defaultTimes: defaultTimes,
    defaultSettings: defaultSettings,
    normalizeSettings: normalizeSettings,
    validateTimes: validateTimes,
    dayNumber: dayNumber,
    currentSlot: currentSlot,
    nextSlot: nextSlot,
    nextText: nextText,
    strideFor: strideFor,
    promptIndex: promptIndex,
    skipsFor: skipsFor,
    timerMinutes: timerMinutes,
    formatMMSS: formatMMSS,
    icsEscape: icsEscape,
    foldLine: foldLine,
    buildICS: buildICS
  };
});
