/* Inkling: screens, settings, timer and reminders. The rules live in logic.js. */
(function () {
  'use strict';

  var L = window.InklingLogic;
  var P = window.InklingPrompts;
  var ORDER = L.varietyOrder(P.PROMPTS, L.SEED);
  var SCREENS = ['welcome', 'setup', 'remind', 'today', 'settings', 'about'];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  // ---------- storage (settings only, on this device) ----------

  function load() {
    try {
      var raw = window.localStorage.getItem(L.STORAGE_KEY);
      return L.normalizeSettings(raw ? JSON.parse(raw) : null);
    } catch (e) {
      return L.defaultSettings();
    }
  }

  function save() {
    try { window.localStorage.setItem(L.STORAGE_KEY, JSON.stringify(settings)); } catch (e) { /* keep working in memory */ }
  }

  var settings = load();

  // ---------- routing ----------

  function route() {
    var name = (location.hash || '').replace('#', '');
    if (SCREENS.indexOf(name) === -1) name = 'today';

    if (!settings.seen) {
      if (name !== 'welcome' && name !== 'setup') name = 'welcome';
    } else if (name === 'setup') {
      location.replace('#today');
      return;
    }
    show(name);
  }

  function show(name) {
    SCREENS.forEach(function (s) { $('#s-' + s).hidden = (s !== name); });
    var screen = $('#s-' + name);

    if (name === 'setup') renderForm($('#setup-form'));
    if (name === 'settings') renderForm($('#settings-form'));
    if (name === 'today') renderToday();
    updateReminderUI();
    updateInstallUI();

    window.scrollTo(0, 0);
    var h = $('h1', screen);
    if (h) {
      h.setAttribute('tabindex', '-1');
      try { h.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }

  // ---------- settings form (used on setup and on settings) ----------

  function adaptTimes(oldTimes, n) {
    var times = oldTimes.slice(0, n);
    L.defaultTimes(n).forEach(function (d) {
      if (times.length < n && times.indexOf(d) === -1) times.push(d);
    });
    return times.sort();
  }

  function renderForm(container) {
    var p = container.id;
    var perDayChoices = '';
    for (var n = 1; n <= L.MAX_PER_DAY; n++) {
      perDayChoices += '<label class="choice"><input type="radio" name="' + p + '-perDay" value="' + n + '"' +
        (settings.perDay === n ? ' checked' : '') + '><span>' + n + '</span></label>';
    }

    var timeRows = '';
    settings.times.forEach(function (t, i) {
      timeRows += '<div class="time-row"><label for="' + p + '-time-' + i + '">Drawing ' + (i + 1) + '</label>' +
        '<input type="time" id="' + p + '-time-' + i + '" value="' + t + '" step="60" required></div>';
    });

    var timerOptions = '<option value="suggested">Suggested by each prompt</option>';
    L.TIMER_CHOICES.forEach(function (m) {
      timerOptions += '<option value="' + m + '">' + m + ' minutes</option>';
    });

    container.innerHTML =
      '<fieldset class="group"><legend>Drawings per day</legend>' +
      '<div class="choices">' + perDayChoices + '</div></fieldset>' +
      '<fieldset class="group"><legend>Time of each prompt</legend>' +
      '<div class="time-list">' + timeRows + '</div>' +
      '<p class="hint">At each time, a new prompt is waiting for you here in the app.</p>' +
      '<p class="error" role="alert" data-role="time-error"></p></fieldset>' +
      '<div class="group"><label class="legend-like" for="' + p + '-timer">Timer length</label>' +
      '<select id="' + p + '-timer">' + timerOptions + '</select>' +
      '<p class="hint">The timer is optional. You start it yourself, under each prompt.</p></div>';

    $('#' + p + '-timer').value = String(settings.timer);

    container.onchange = function (e) { onFormChange(container, e); };
    container.onsubmit = function (e) { e.preventDefault(); };
  }

  function onFormChange(container, e) {
    var p = container.id;
    var t = e.target;
    var errorEl = $('[data-role="time-error"]', container);

    if (t.name === p + '-perDay') {
      settings.perDay = parseInt(t.value, 10);
      settings.times = adaptTimes(settings.times, settings.perDay);
      settings.skip = null;
      timesChanged();
      renderForm(container);
      var checked = $('input[name="' + p + '-perDay"]:checked', container);
      if (checked) checked.focus();
      return;
    }

    if (/-time-\d+$/.test(t.id)) {
      var values = $$('input[type="time"]', container).map(function (el) { return el.value; });
      var err = L.validateTimes(values);
      errorEl.textContent = err || '';
      if (err) return;
      var sorted = values.slice().sort();
      var reordered = sorted.join() !== values.join();
      settings.times = sorted;
      timesChanged();
      if (reordered) renderForm(container);
      return;
    }

    if (t.id === p + '-timer') {
      settings.timer = t.value === 'suggested' ? 'suggested' : parseInt(t.value, 10);
      save();
    }
  }

  function timesChanged() {
    if (settings.remindersAdded) settings.remindersStale = true;
    save();
    updateReminderUI();
  }

  // ---------- today ----------

  function currentPrompt() {
    var slot = L.currentSlot(settings, new Date());
    var idx = L.promptIndex(ORDER, settings.perDay, slot, L.skipsFor(settings, slot));
    return { slot: slot, prompt: P.PROMPTS[idx], index: idx };
  }

  function renderToday() {
    var now = new Date();
    var cur = currentPrompt();
    var theme = cur.prompt[0];

    $('#theme-name').textContent = P.THEMES[theme] || theme;
    $('#theme-dot').className = 'dot t-' + theme;
    $('#prompt-text').textContent = cur.prompt[1];

    var meta = $('#prompt-meta');
    meta.textContent = '';
    var first = [];
    if (settings.perDay > 1) first.push('Drawing ' + (cur.slot.slotIdx + 1) + ' of ' + settings.perDay);
    first.push('about ' + cur.prompt[2] + ' min');
    var l1 = document.createElement('span');
    l1.className = 'line';
    l1.textContent = first.join(' · ').replace(/^./, function (c) { return c.toUpperCase(); });
    var l2 = document.createElement('span');
    l2.className = 'line';
    l2.textContent = L.nextText(settings, now);
    meta.appendChild(l1);
    meta.appendChild(l2);

    $('#timer-start').textContent = 'Start timer · ' + L.timerMinutes(settings, cur.prompt[2]) + ' min';
    renderTimer();
  }

  function skipPrompt() {
    var slot = L.currentSlot(settings, new Date());
    settings.skip = { key: slot.key, n: L.skipsFor(settings, slot) + 1 };
    save();
    stopTimer();
    // Let screen readers announce the new prompt.
    var card = $('.prompt-card');
    card.setAttribute('aria-live', 'polite');
    card.setAttribute('aria-atomic', 'true');
    renderToday();
  }

  // ---------- timer ----------

  var timer = { state: 'idle', endAt: 0, tick: null, wake: null };

  function renderTimer() {
    $('#timer-idle').hidden = timer.state !== 'idle';
    $('#timer-running').hidden = timer.state !== 'running';
    $('#timer-done').hidden = timer.state !== 'done';
    if (timer.state === 'running') $('#timer-clock').textContent = L.formatMMSS(timer.endAt - Date.now());
  }

  function startTimer() {
    var minutes = L.timerMinutes(settings, currentPrompt().prompt[2]);
    timer.endAt = Date.now() + minutes * 60000;
    timer.state = 'running';
    clearInterval(timer.tick);
    timer.tick = setInterval(tickTimer, 250);
    requestWake();
    renderTimer();
  }

  function tickTimer() {
    if (timer.state !== 'running') return;
    if (timer.endAt - Date.now() <= 0) finishTimer();
    else $('#timer-clock').textContent = L.formatMMSS(timer.endAt - Date.now());
  }

  function finishTimer() {
    clearInterval(timer.tick);
    timer.state = 'done';
    releaseWake();
    try { if (navigator.vibrate) navigator.vibrate([250, 120, 250]); } catch (e) { /* ignore */ }
    renderTimer();
  }

  function stopTimer() {
    clearInterval(timer.tick);
    timer.state = 'idle';
    releaseWake();
    renderTimer();
  }

  function requestWake() {
    try {
      if ('wakeLock' in navigator && !timer.wake) {
        navigator.wakeLock.request('screen').then(function (lock) {
          timer.wake = lock;
          lock.addEventListener('release', function () { if (timer.wake === lock) timer.wake = null; });
        }).catch(function () { /* not allowed right now: fine */ });
      }
    } catch (e) { /* ignore */ }
  }

  function releaseWake() {
    try { if (timer.wake) timer.wake.release(); } catch (e) { /* ignore */ }
    timer.wake = null;
  }

  // ---------- reminders (a calendar file made on this device) ----------

  function appUrl() { return location.href.split('#')[0]; }

  function addReminders() {
    var ics = L.buildICS(settings, { url: appUrl(), now: new Date() });
    var statusText = 'Your calendar file is ready. Open it to add the reminders. If it just saved, find it in your downloads.';
    try {
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      var href = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = href;
      a.download = 'inkling-reminders.ics';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(href); }, 15000);
    } catch (e) {
      statusText = 'Sorry, this browser couldn’t make the calendar file.';
      $$('[data-role="reminder-status"]').forEach(function (el) { el.textContent = statusText; });
      return;
    }
    settings.remindersAdded = true;
    settings.remindersStale = false;
    save();
    updateReminderUI();
    $$('[data-role="reminder-status"]').forEach(function (el) { el.textContent = statusText; });
  }

  function updateReminderUI() {
    $$('[data-role="stale-note"]').forEach(function (el) { el.hidden = !settings.remindersStale; });
    $$('[data-action="add-reminders"]').forEach(function (b) {
      b.textContent = settings.remindersStale ? 'Add the new reminders to my calendar' : 'Add reminders to my calendar';
    });
  }

  // ---------- install ----------

  var deferredInstall = null;

  function isStandalone() {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    } catch (e) { return false; }
  }

  function installHint() {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'To install: tap Share, then ‘Add to Home Screen’.';
    return 'To install: open your browser’s menu, then choose ‘Install app’ or ‘Add to Home screen’.';
  }

  function updateInstallUI() {
    var standalone = isStandalone();
    $$('[data-action="install"]').forEach(function (b) { b.hidden = !deferredInstall || standalone; });
    $$('[data-role="install-hint"]').forEach(function (h) {
      h.textContent = standalone ? 'Inkling is installed on this device.' : (deferredInstall ? '' : installHint());
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    updateInstallUI();
  });

  window.addEventListener('appinstalled', function () {
    deferredInstall = null;
    updateInstallUI();
  });

  function installApp() {
    if (!deferredInstall) return;
    var ev = deferredInstall;
    deferredInstall = null;
    updateInstallUI();
    ev.prompt();
  }

  // ---------- wiring ----------

  document.addEventListener('click', function (e) {
    var go = e.target.closest && e.target.closest('[data-go]');
    if (go) { location.hash = go.getAttribute('data-go'); return; }
    var act = e.target.closest && e.target.closest('[data-action]');
    if (act) {
      var name = act.getAttribute('data-action');
      if (name === 'add-reminders') addReminders();
      if (name === 'install') installApp();
    }
  });

  $('#setup-start').addEventListener('click', function () {
    settings.seen = true;
    save();
    location.hash = '#remind';
  });

  $('#setup-skip').addEventListener('click', function () {
    var fresh = L.defaultSettings();
    fresh.seen = true;
    settings = fresh;
    save();
    location.hash = '#remind';
  });

  $('#timer-start').addEventListener('click', startTimer);
  $('#timer-stop').addEventListener('click', stopTimer);
  $('#timer-reset').addEventListener('click', stopTimer);
  $('#skip').addEventListener('click', skipPrompt);

  window.addEventListener('hashchange', route);

  // A new prompt can arrive while the app is open, or while it was in the background.
  function refreshIfToday() {
    if (!$('#s-today').hidden && timer.state !== 'running') renderToday();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    if (timer.state === 'running') { tickTimer(); requestWake(); }
    refreshIfToday();
  });
  setInterval(refreshIfToday, 30000);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline copy just won't be kept */ });
    });
  }

  route();
})();
