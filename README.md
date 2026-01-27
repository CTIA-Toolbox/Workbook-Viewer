# Correlation → KML Tool (PWA)

This is a client-only Progressive Web App (PWA) for converting Excel correlation workbooks to KML files. It works fully offline and is installable from GitHub Pages.

## Features
- Upload an Excel workbook and generate a KML file for mapping.
- Works offline after first load (PWA, service worker, manifest included).
- Installable on desktop and mobile ("Add to Home Screen").

## How to Deploy on GitHub Pages
1. Push all files in this folder to your GitHub repository (e.g., in a `Workbook Viewer` or `docs` folder).
2. In your repo settings, set GitHub Pages to serve from the root of this folder (or `/docs`).
3. Access your app at `https://<your-username>.github.io/<repo>/`.
4. The app will prompt for install and work offline.

## PWA Requirements
- `index.html` links to `manifest.json` and registers `service-worker.js`.
- All app shell files are listed in the service worker for offline caching.
- Manifest includes icons for installability.

## Customization
- Update `manifest.json` for your app name, icons, and theme color.
- Replace icons in the `icons/` folder for your brand.

## Development
- Edit `main.js`, `correlationReader.js`, and `styles.css` for logic and appearance.
- Test offline and installability by using Chrome DevTools > Lighthouse > PWA.

---

MIT License
