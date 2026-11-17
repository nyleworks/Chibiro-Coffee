/* Chibiro staff scanner (staff.html).
   Reads a customer's stamp card QR with the camera and opens the staff page for that card. It only ever opens the
   staff link below, with a 22-character card code: any other QR code (a web link, a fake sign-in page) is ignored.
   Uses the phone's built-in QR reader where there is one (Android Chrome), otherwise jsQR.js (iPhone Safari). */
(function () {
  // The staff deployment's link. Keep it the same as STAMP_STAFF in app.js.
  var STAMP_STAFF = 'https://script.google.com/macros/s/AKfycbzCwCftbNpsDwIqmo1EqXWAJ1WeKWnyd1YudxPhTHwZ08Os7h2pCUfgBEONVk77mDHw/exec';
  var video = document.getElementById('cam'), canvas = document.getElementById('frame'), status = document.getElementById('status'), btn = document.getElementById('start');
  var stream = null, detector = null, timer = 0, busy = false, lastBad = '';

  // A card QR holds "<site address>#card=<code>". Only the code is taken; the address part is never opened.
  function cardCode(text) {
    var m = /^(?:[^#\s]*#(?:[^#\s]*&)?card=)?([A-Za-z0-9_-]{22})$/.exec(String(text || '').trim());
    return m ? m[1] : null;
  }
  function say(t, bad) { status.textContent = t; status.classList.toggle('is-bad', !!bad); }
  function stop() { clearTimeout(timer); if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; video.srcObject = null; btn.hidden = false; }
  function found(text) {
    var code = cardCode(text);
    if (!code) {
      if (text !== lastBad) { lastBad = text; say('That QR code isn\'t a Chibiro stamp card, so nothing was opened. Ask the customer to open their card on the Chibiro site.', true); }
      return false;
    }
    stop(); say('Card found. Opening the staff page…');
    location.href = STAMP_STAFF + '?card=' + encodeURIComponent(code);
    return true;
  }
  function loadJsQR() {
    return new Promise(function (ok, fail) {
      if (window.jsQR) return ok();
      var s = document.createElement('script'); s.src = 'jsQR.js'; s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    });
  }
  function read() {
    if (!stream) return Promise.resolve(null);
    if (detector) return detector.detect(video).then(function (codes) { return codes.length ? codes[0].rawValue : null; }, function () { return null; });
    var w = video.videoWidth, h = video.videoHeight; if (!w || !h) return Promise.resolve(null);
    var k = Math.min(1, 640 / Math.max(w, h)); canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
    var g = canvas.getContext('2d', { willReadFrequently: true }); g.drawImage(video, 0, 0, canvas.width, canvas.height);
    var img = g.getImageData(0, 0, canvas.width, canvas.height), r = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    return Promise.resolve(r ? r.data : null);
  }
  function loop() {
    if (!stream || busy) return; busy = true;
    read().then(function (text) { busy = false; if (text && found(text)) return; timer = setTimeout(loop, 150); });
  }
  btn.addEventListener('click', function () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say('This browser can\'t use the camera here. Open this page in Safari or Chrome.', true); return; }
    say('Starting the camera…'); btn.hidden = true;
    var ready = ('BarcodeDetector' in window ? window.BarcodeDetector.getSupportedFormats().then(function (f) { if (f.indexOf('qr_code') >= 0) detector = new window.BarcodeDetector({ formats: ['qr_code'] }); }, function () {}) : Promise.resolve())
      .then(function () { return detector ? null : loadJsQR(); });
    Promise.all([ready, navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })]).then(function (r) {
      stream = r[1]; video.srcObject = stream; return video.play();
    }).then(function () { say('Hold the customer\'s QR code in the box.'); loop(); }, function () {
      stop(); say('The camera didn\'t start. Allow camera access for this page, then tap Start camera again.', true);
    });
  });
  document.addEventListener('visibilitychange', function () { if (document.hidden && stream) { stop(); say('Camera paused. Tap Start camera to scan again.'); } });
})();
