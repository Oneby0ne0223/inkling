/*
 * Inkling prompts.
 *
 * Each prompt is [theme, text, suggestedMinutes].
 * To add your own, append a line to PROMPTS (and a theme to THEMES if you
 * need a new one). Any number of prompts works; the order is mixed for you.
 * After editing, bump VERSION at the top of sw.js so phones pick up the change.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InklingPrompts = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var THEMES = {
    look: 'Look closely',
    limits: 'Limits',
    invent: 'Invent',
    remember: 'Remember',
    texture: 'Pattern & texture',
    mood: 'Mood',
    small: 'Small & quick'
  };

  var PROMPTS = [
    // ---- Look closely: draw what is in front of you ----
    ['look', 'Draw the object nearest your left hand. Spend as long looking as drawing.', 10],
    ['look', 'Draw one of your shoes from directly above.', 10],
    ['look', 'Find something with a handle. Draw only the shadow it casts.', 10],
    ['look', 'Draw what you can see through just one pane of the nearest window.', 15],
    ['look', 'Cut a fruit or vegetable in half and draw it, including the bits you would normally throw away.', 15],
    ['look', 'Draw your own hand holding something small.', 15],
    ['look', 'Draw the pile of things on the nearest flat surface. Don’t tidy first.', 15],
    ['look', 'Pick one leaf and draw it, veins and all.', 15],
    ['look', 'Draw the tallest thing you can see from where you’re sitting.', 10],
    ['look', 'Open a drawer, a cupboard or a bag and draw what’s inside.', 20],
    ['look', 'Pick one key and draw it much larger than life.', 10],
    ['look', 'Draw whatever is on the floor within arm’s reach.', 10],

    // ---- Limits: a rule to push against ----
    ['limits', 'Draw a mug without looking at the paper or lifting your pen.', 5],
    ['limits', 'Draw a chair using only straight lines.', 8],
    ['limits', 'Draw a face using exactly seven marks.', 5],
    ['limits', 'Use your non-dominant hand to draw the room around you.', 10],
    ['limits', 'Draw an animal using only triangles.', 10],
    ['limits', 'Draw a street in one continuous line, without lifting your pen.', 10],
    ['limits', 'Fill a page with one shape drawn thirty times. Make every one different.', 15],
    ['limits', 'Draw a tree using a ruler, or any straight edge, and not a single curve.', 10],
    ['limits', 'Draw someone you know in under two minutes.', 2],
    ['limits', 'Draw a landscape using only dots.', 15],
    ['limits', 'Draw your dinner twice: once with long lines, once with tiny ones.', 10],
    ['limits', 'Draw a house using only letters of the alphabet.', 10],

    // ---- Invent: make something up ----
    ['invent', 'Design a house for a snail who loves music.', 15],
    ['invent', 'Invent a vehicle for crossing a puddle the size of an ocean.', 15],
    ['invent', 'Draw a machine that makes Tuesdays slightly better.', 15],
    ['invent', 'Design a hat for a very tall bird.', 10],
    ['invent', 'Draw the shop window of a shop that only sells one thing.', 15],
    ['invent', 'Invent a tool for a job that doesn’t exist yet, and show it being used.', 15],
    ['invent', 'Draw a creature that lives in a teapot. What does it do all day?', 15],
    ['invent', 'Design a bench for the strangest place you can think of.', 10],
    ['invent', 'Draw a door that leads somewhere unexpected. Show a little of what’s behind it.', 15],
    ['invent', 'Invent a plant that grows something other than fruit.', 10],
    ['invent', 'Draw a lighthouse for a place that has no sea.', 15],
    ['invent', 'Design an umbrella for a rainy day on another planet.', 15],

    // ---- Remember: draw it from memory ----
    ['remember', 'Draw the front door of the first place you remember living in, from memory.', 15],
    ['remember', 'Draw a meal you ate recently, from memory. How much did you hold on to?', 10],
    ['remember', 'Draw the route from your front door to the nearest postbox, as a map, from memory.', 15],
    ['remember', 'Draw something you owned as a child.', 15],
    ['remember', 'Draw a room you’d like to go back to. Start with the furniture.', 20],
    ['remember', 'Draw the face of someone you saw today, from memory. It’s fine to get it wrong.', 10],
    ['remember', 'Draw the cup or glass you used first thing this morning, without checking.', 5],
    ['remember', 'Draw a place you’ve been on holiday, using only what you remember best.', 15],
    ['remember', 'Draw a present you were once given.', 10],
    ['remember', 'Draw a kitchen you remember well. Start with the thing you remember most.', 15],
    ['remember', 'Draw yesterday’s weather.', 5],
    ['remember', 'Draw the pattern of a floor or carpet you grew up with.', 15],

    // ---- Pattern & texture ----
    ['texture', 'Fill a small square with the texture of tree bark, using only short lines.', 10],
    ['texture', 'Draw a brick wall, but make every brick different.', 15],
    ['texture', 'Pick one simple shape and repeat it, turning each one a little, until the page is full.', 15],
    ['texture', 'Draw three kinds of water: still, rippling and rushing.', 10],
    ['texture', 'Show the texture of knitted wool without drawing every stitch.', 10],
    ['texture', 'Draw a patch of grass using three different kinds of mark.', 10],
    ['texture', 'Design a border for a page using only dots and dashes.', 10],
    ['texture', 'Draw the pattern on something you’re wearing, then change it into something new halfway across.', 15],
    ['texture', 'Pick a stone, a shell or a coin and draw its surface at twice the size.', 15],
    ['texture', 'Fill a page with scribbled tone, but leave one shape empty so it stands out.', 15],
    ['texture', 'Draw one animal with feathers, scales and fur all at once.', 15],
    ['texture', 'Draw a cloud, then draw it again as if it were made of fabric.', 10],

    // ---- Mood: draw how it feels ----
    ['mood', 'Draw today’s weather as a creature.', 10],
    ['mood', 'Draw how the day feels as a landscape.', 15],
    ['mood', 'Draw your mood as a room. Is the light on or off?', 15],
    ['mood', 'Draw a quick self-portrait that shows how you feel, not how you look.', 10],
    ['mood', 'Draw something that would make today a little better.', 10],
    ['mood', 'Draw a feeling as a shape, then give it a pair of shoes.', 10],
    ['mood', 'Draw your ideal quiet place.', 15],
    ['mood', 'Draw the sound of something nearby.', 10],
    ['mood', 'Draw a very small thing you’re looking forward to.', 10],
    ['mood', 'Draw a thank-you note without using any words.', 10],
    ['mood', 'Draw what “lighter” looks like.', 10],
    ['mood', 'Draw an animal that matches the way today went.', 10],

    // ---- Small & quick: tiny drawings, done in minutes ----
    ['small', 'Fill a page with twenty tiny drawings of everyday objects, each smaller than your thumbnail.', 10],
    ['small', 'Draw a pocket-sized map of one room.', 8],
    ['small', 'Draw ten different eyes.', 5],
    ['small', 'Draw a whole town no bigger than your palm.', 10],
    ['small', 'Draw a postage stamp for a country that doesn’t exist.', 10],
    ['small', 'Draw a tiny portrait of the last person you spoke to, no bigger than a stamp.', 5],
    ['small', 'Draw a row of five different trees, each one in only a few lines.', 5],
    ['small', 'Start a doodle in one corner of the page and let it grow along the edge.', 10],
    ['small', 'Draw three different houses in three minutes.', 3],
    ['small', 'Draw a tiny version of something enormous: a mountain, a whale, a cathedral.', 5],
    ['small', 'Draw your hands, both of them, doing nothing.', 5],
    ['small', 'Draw a calendar page for a day that hasn’t happened yet, using only pictures.', 10]
  ];

  return { THEMES: THEMES, PROMPTS: PROMPTS };
});
