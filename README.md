# Inkling

One drawing prompt at a time, to answer on paper.

A small, quiet web app. It shows you a drawing prompt; you draw it in your own sketchbook. The app never sees your drawing. You choose how many drawings a day (1 to 3) and a time for each, and you can start an optional timer under each prompt.

- 84 original prompts across seven themes (Look closely, Limits, Invent, Remember, Pattern & texture, Mood, Small & quick).
- Its own count and times per day, separate from any other prompt app you use.
- Reminders come from your phone's calendar: Inkling makes a small calendar file you add once. There are no push notifications.
- Works offline, and can be installed on your phone's home screen.
- No accounts, no cookies, no analytics, no requests to other sites. Settings live in your browser's storage on your own device.

## Try it on your computer

It's plain HTML, CSS and JavaScript with no build step. From this folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000

## Put it on your phone (GitHub Pages)

1. Create a new public repository on GitHub, for example `inkling`.
2. Upload everything in this folder to it (the files, and the `icons` folder).
3. In the repository, go to Settings, then Pages. Under "Build and deployment", choose "Deploy from a branch", pick `main` and `/ (root)`, and save.
4. After a minute or two, your app is at `https://YOUR-USERNAME.github.io/inkling/`.
5. Open that link on your phone.
   - Android (Chrome): menu, then "Install app".
   - iPhone (Safari): Share, then "Add to Home Screen".

The app needs to be served over https to install and work offline; GitHub Pages does that for you.

## Changing the prompts

Prompts live in `prompts.js`, one per line:

```
['look', 'Draw the object nearest your left hand.', 10],
```

That is: theme, text, suggested minutes. Add as many as you like. The order is mixed for you, so themes alternate and prompts don't repeat until you've seen them all.

**After changing any file, change `VERSION` at the top of `sw.js`** (for example `inkling-v1` to `inkling-v2`). That is what tells phones to refresh their saved copy.

## How the daily prompt is chosen

The prompts are put in a fixed, theme-mixed order. Each day and drawing slot then moves along that list. A new prompt appears at each time you chose and stays until the next one, even if you reopen the app. "Not today, another one" picks a different prompt until the next one is due.

## Files

| File | What it does |
|---|---|
| `index.html` | The screens: welcome, setup, reminders, today's prompt, settings, about |
| `styles.css` | Look and feel (light and dark follow your phone) |
| `app.js` | Screens, settings, timer, reminders |
| `logic.js` | The rules: prompt order, which prompt is current, calendar file |
| `prompts.js` | The prompts and theme names |
| `sw.js` | Keeps a copy of the app so it works offline |
| `manifest.webmanifest` | Lets phones install it like an app |
| `icons/` | App icons |

## Notes

- Reminders are repeating daily events at fixed local times. If you change the times, delete the old "Time to draw (Inkling)" events from your calendar and add the new ones.
- The timer can't ring when the app is in the background. It buzzes your phone when time is up, if the app is open, and keeps the screen awake while it runs where the browser allows.
- Inkling was inspired by the idea behind Inward by Sandra's Apps, a separate app. No code or prompts are shared between them.
- There is no licence file. Add one if you want to share this with others.
