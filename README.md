# Chibiro Coffee

Website for Chibiro Coffee, a home specialty coffee café in Taman Jaya, Likas, Kota Kinabalu (open Tue–Sun, 3:08 PM–12:08 AM).

A plain static site with no build step. Open `index.html`, or serve the folder with any static host such as GitHub Pages.

- `index.html`: page markup
- `styles.css`: styles
- `app.js`: menu, pixel cats and page behaviour
- `scene.js`: the animated pixel hero scene (sunset and night)
- `staff.html`, `staff.js`: the café phone's stamp card scanner (accepts only Chibiro card codes); `jsQR.js` reads QR codes on iPhones
- `qrcode.js`: draws a customer's card QR code
- `apps-script/Code.gs`: the stamp card backend (Google Apps Script bound to the Google Sheet)
- `assets/`: logo, favicon, icons and the two pixel fonts (`assets/fonts`, SIL Open Font License)

The page has a strict Content Security Policy (a meta tag in `index.html`): add any new outside service there, and keep scripts and styles in their own files (no inline `style=""` or `onclick`).
