# Agent Instructions

- This is a dependency-free static HTML5 Canvas game; do not introduce a framework, bundler, package manifest, or generated build output without an explicit requirement.
- `index.html` is the browser entrypoint and defines the fixed `800x600` canvas; it loads all game logic from the root `game.js`.
- Keep gameplay changes in `game.js` unless the change is specifically to the document shell, canvas, favicon, or inline page styles in `index.html`.
- To run it locally, open `index.html` in a browser or run `npx serve .` and visit `http://localhost:3000`.
- There is no configured build, test, lint, formatter, typecheck, or CI workflow; verify changes by loading the game in a browser and exercising the affected controls and gameplay path.
- The game uses browser globals (`window`, `document`, `requestAnimationFrame`, and Canvas 2D); code is plain ES6+ JavaScript loaded directly by the browser, not a module.
