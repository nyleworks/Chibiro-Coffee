/* Chibiro stamp card links: the one place they are written down. The main page (app.js) and the staff scanner
   (staff.js) both read them from here, so after a new Apps Script deployment only this file changes.
   api:   the public deployment ("Who has access: Anyone"). Looks up a card's stamps and deletes a card.
   staff: the staff deployment ("Who has access: Only myself"). The staff page that adds stamps. */
window.CHIBIRO_LINKS = {
  api: 'https://script.google.com/macros/s/AKfycbwR8Z7vlQEVyXehefGOcjkERVbE7l9H5FrJ0IwzMyVmkzl7V-aPuUicSdaz9dba1ZXx/exec',
  staff: 'https://script.google.com/macros/s/AKfycbzCwCftbNpsDwIqmo1EqXWAJ1WeKWnyd1YudxPhTHwZ08Os7h2pCUfgBEONVk77mDHw/exec'
};
