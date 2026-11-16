(function () {
  var $ = function (id) { return document.getElementById(id); };
  var view = {   // the page itself scrolls
    scrollTo: function (o) { window.scrollTo(o); }
  };

  /* ---------- Menu: Drinks / Snacks pages, 4×4 cards per page (2×4 on phones) ---------- */
  // t: 'i' iced, 'h' hot. Merged from the café's menu screenshots with duplicates removed.
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  // each shelf holds categories; item = [name, description, price (null = ask), 'i' iced / 'h' hot, badge]
  var MENU = {
    drinks: [
      { cat: 'Signatures', items: [
        ['Strawberry Matcha Latte', 'Matcha + strawberry puree + milk', 16, 'i', 'Best Seller'], ['Strawberry Cloud Matcha', 'Matcha + strawberry puree + milk + cold foam', 18, 'i'],
        ['Tiramisu Latte', '', 20, 'i'], ['Mont Blanc', 'Orange cloud cream, orange americano', 16, 'i'], ['Sunset Americano', 'Orange juice and americano', 11, 'i'],
        ['Strawberricano', 'Strawberry and espresso', 11, 'i'], ['Espresso Tonic', '', 16, 'i'], ['Dirty Latte', 'Espresso over chilled special milk', 16, 'i'],
        ['Strawberry Spanish Latte', '', 16], ['Mango Cafe Latte', 'Mango milk and espresso', 14, 'i'], ['Chocolate Clouds', '3 types of chocolate with cloud on top', 16] ] },
      { cat: 'Iced Coffee', items: [
        ['Americano', '', 9, 'i'], ['Cafe Latte', 'White coffee', 11, 'i'], ['Spanish Latte', 'Cafe latte + condensed milk', 12, 'i'], ['Mocha', 'Choco + espresso + milk', 14, 'i'],
        ['Caramel Latte', 'Cafe latte + caramel syrup', 14, 'i'], ['Hazelnut Latte', 'Cafe latte + syrup', 14, 'i'], ['French Vanilla Latte', 'Cafe latte + syrup', 14, 'i'],
        ['Strawberry Cafe Latte', '', 14, 'i'], ['Blueberry Latte', '', 14, 'i'] ] },
      { cat: 'Hot Coffee', items: [
        ['Hot Americano', 'Black coffee', 8, 'h'], ['Hot Cafe Latte', 'White coffee', 10, 'h'], ['Hot Spanish Latte', '', 11, 'h'], ['Hot Mocha Latte', 'Choco + espresso + latte', 12, 'h'],
        ['Espresso', 'Double shot', 6, 'h'], ['Extra Shot Espresso', 'Add to any drink', 3] ] },
      { cat: 'Matcha & Taro', items: [
        ['Matcha Latte', 'Matcha + milk', 14, 'i'], ['Hot Matcha Latte', 'Matcha + steamed milk', 12, 'h'], ['Blueberry Matcha', '', 16, 'i'], ['Mango Matcha', '', 16, 'i'],
        ['Matcha Cream Taro', '', 16, 'i'], ['Taro Latte', '', 14, 'i'], ['Hot Taro Latte', '', 12, 'h'], ['Strawberry Cream Taro', '', 16, 'i'] ] },
      { cat: 'Chocolate', items: [
        ['Chocolate', 'Cocoa + sauce + milk', 12, 'i'], ['Hot Chocolate Latte', 'Cocoa powder + cocoa sauce + milk', 10, 'h'],
        ['Triple Chocolate', '3 types of chocolate + milk', 13, 'i'], ['Strawberry Chocolate', 'Cocoa + milk + strawberry puree', 14, 'i'] ] },
      { cat: 'Tea & Others', items: [
        ['Peach Zest Tea', 'Peach tea with lemon slices', 12], ['Passion Zest Tea', 'Passion fruit tea with lemon slices', 12], ['Plain Water', '', 0.5] ] }
    ],
    snacks: [
      { cat: 'Sweets', items: [
        ['Seasalt Chocolate Cookies', '', 2], ['Black Cookies', '', 2], ['Soft Cookies', '', null], ['Brownies', '', 5.5], ['Fuggy Brownies', '', 8.5],
        ['Banana Cake', '', 5], ['Lemon Pound Cake', '', 9] ] },
      { cat: 'Savoury', items: [
        ['Mee Siam', '', 3], ['Nasi Lemak Mini', '', 3], ['Laksa Peneng', '', 10], ['Meggie Cup', 'Cup noodles', 3.5], ['Meggie Bowl', '', null], ['Roasted Pumpkin Seeds', '', 4] ] },
      { cat: 'For the Cats', items: [['Cat Treats', 'Treat the café cats', 1.5], ['Cat Figurine', 'A little Chibiro to take home', 5]] }
    ]
  };
  var shelf = 'drinks', cat = { drinks: 0, snacks: 0 }, page = 0, small = window.matchMedia('(max-width: 767px)');
  function perPage() { return small.matches ? 8 : 16; }
  function rm(v) { return v == null ? 'Ask us' : 'RM ' + v.toFixed(2); }
  function renderMenu() {
    var group = MENU[shelf][cat[shelf]], list = group.items, n = perPage(), pages = Math.max(1, Math.ceil(list.length / n));
    page = Math.max(0, Math.min(pages - 1, page));
    $('tabs').innerHTML = '<div class="menu-shelves" role="group" aria-label="Menu">' + [['drinks', 'Drinks'], ['snacks', 'Snacks']].map(function (t) {
      return '<button class="cb-tab" type="button" aria-pressed="' + (t[0] === shelf) + '" aria-controls="menu" data-shelf="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div><div class="menu-cats" role="group" aria-label="' + (shelf === 'drinks' ? 'Drink' : 'Snack') + ' categories">' + MENU[shelf].map(function (g, i) {
      return '<button class="menu-cat" type="button" aria-pressed="' + (i === cat[shelf]) + '" data-cat="' + i + '">' + esc(g.cat) + ' <span class="menu-cat__n">' + g.items.length + '</span></button>';
    }).join('') + '</div>';
    var cards = list.slice(page * n, page * n + n).map(function (it) {
      var temp = it[3] === 'i' ? '<span class="cb-tag cb-tag--ice">Iced</span>' : it[3] === 'h' ? '<span class="cb-tag cb-tag--hot">Hot</span>' : '';
      return '<article class="cb-item' + (it[4] ? ' cb-item--featured' : '') + '"><div class="cb-item__head"><h3 class="cb-item__name">' + esc(it[0]) + '</h3>' +
        (it[4] ? '<span class="cb-tag cb-tag--berry">' + esc(it[4]) + '</span>' : '') + '</div>' +
        '<p class="cb-item__meta">' + esc(it[1] || group.cat) + '</p>' +
        '<div class="cb-item__foot"><span class="cb-item__price' + (it[2] == null ? ' is-ask' : '') + '">' + rm(it[2]) + '</span><span class="cb-item__opts">' + temp + '</span></div></article>';
    });
    var pager = pages > 1 ? '<nav class="menu-pager" aria-label="Menu pages"><button class="cb-btn cb-btn--plain menu-pager__btn" data-page="-1"' + (page ? '' : ' disabled') + ' aria-label="Previous page">&lt;</button>' +
      '<span class="menu-pager__dots">' + Array.apply(null, Array(pages)).map(function (_, i) {
        return '<button class="menu-pager__dot" data-goto="' + i + '" aria-label="Page ' + (i + 1) + '"' + (i === page ? ' aria-current="page"' : '') + '></button>';
      }).join('') + '</span><span class="menu-pager__count">' + (page + 1) + ' / ' + pages + '</span>' +
      '<button class="cb-btn cb-btn--plain menu-pager__btn" data-page="1"' + (page < pages - 1 ? '' : ' disabled') + ' aria-label="Next page">&gt;</button></nav>' : '';
    $('menu').innerHTML = '<div class="menu-grid">' + cards.join('') + '</div>' + pager;
  }
  // renderMenu rebuilds the buttons, so hand focus back to the same button (or its neighbour) when it had focus
  function refocus(had, sel, alt) {
    if (!had) return;
    var el = document.querySelector(sel);
    if ((!el || el.disabled) && alt) el = document.querySelector(alt);
    if (el && !el.disabled) el.focus();
  }
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-shelf],[data-cat]'); if (!b) return;
    var had = document.activeElement === b, sel = b.dataset.shelf ? '#tabs [data-shelf="' + b.dataset.shelf + '"]' : '#tabs [data-cat="' + b.dataset.cat + '"]';
    if (b.dataset.shelf) { if (b.dataset.shelf === shelf) return; shelf = b.dataset.shelf; } else cat[shelf] = +b.dataset.cat;
    page = 0; renderMenu(); refocus(had, sel);
  });
  $('menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-page],[data-goto]'); if (!b || b.disabled) return;
    var had = document.activeElement === b;
    page = b.dataset.goto != null ? +b.dataset.goto : page + +b.dataset.page; renderMenu();
    if (b.dataset.goto != null) refocus(had, '#menu [data-goto="' + page + '"]');
    else refocus(had, '#menu [data-page="' + b.dataset.page + '"]', '#menu [data-page="' + -b.dataset.page + '"]');
  });
  if (small.addEventListener) small.addEventListener('change', function () { page = 0; renderMenu(); });
  renderMenu();

  /* ---------- Perks (PRD 4.3, section 4) ---------- */
  var PERKS = ['Specialty Home-Brewed Coffee', 'Late-Night Hours until 12:08 AM', 'Free Wi-Fi', 'Indoor & Outdoor Seating',
    'Family-Friendly Space', 'Gender-Neutral Restrooms', 'Free Parking Lot & Street Parking'];
  $('perks').innerHTML = PERKS.map(function (p, i) {
    return '<div class="cb-perk"><span class="cb-perk__no" aria-hidden="true">0' + (i + 1) + '</span><h3 class="cb-perk__title">' + esc(p) + '</h3></div>';
  }).join('');

  /* ---------- Smooth-scroll links ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playful = !reduce;                                  // Cat Mode: Playful, or Sleepy (which holds every scene still)
  function still() { return reduce || !playful; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (a) {
      e.preventDefault();
      var el = $(a.dataset.go), nav = document.querySelector('.cb-nav');
      view.scrollTo({ top: a.dataset.go === 'top' ? 0 : el.offsetTop - nav.offsetHeight - (parseFloat(getComputedStyle(nav).top) || 0), behavior: reduce ? 'auto' : 'smooth' });
    } else if (e.target.closest('[data-todo]')) { e.preventDefault(); }
  });

  /* ---------- Hero = one full screen: tell CSS how tall the sticky nav is ---------- */
  var navEl = document.querySelector('.cb-nav');
  function setNavH() { document.documentElement.style.setProperty('--nav-h', navEl.offsetHeight + 'px'); }
  setNavH(); window.addEventListener('resize', setNavH);

  /* ---------- Cat sprites: 32×32 pixel cats drawn part by part ----------
     Each cat is built from ears, head, body, four legs and a tail. Every part gets a 1px
     outline, so moving a leg or flicking an ear redraws cleanly. Frames are cached. */
  var OUT = '#2c1a12', PINK = '#f2a7b0', NOSE = '#e57373', BLUSH = '#f6b3ab', SPARK = '#fffdf7';
  var shadeCache = {};
  function shade(hex, f) {
    var k = hex + f; if (shadeCache[k]) return shadeCache[k];
    var n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255], to = f < 0 ? [44, 26, 18] : [255, 253, 247], a = Math.abs(f);
    return (shadeCache[k] = '#' + c.map(function (v, i) { return ('0' + Math.round(v + (to[i] - v) * a).toString(16)).slice(-2); }).join(''));
  }
  function ell(cx, cy, rx, ry) { return function (x, y) { var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; return dx * dx + dy * dy <= 1; }; }
  function tri(ax, ay, bx, by, cx, cy) {
    return function (x, y) {
      var px = x + 0.5, py = y + 0.5, d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by), d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy), d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };
  }
  function near(pts, x, y) { // distance² and index of the closest point on a polyline
    var px = x + 0.5, py = y + 0.5, best = 1e9, bi = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var ax = pts[i][0], ay = pts[i][1], vx = pts[i + 1][0] - ax, vy = pts[i + 1][1] - ay, l = vx * vx + vy * vy || 1;
      var t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l)), dx = px - ax - vx * t, dy = py - ay - vy * t, d = dx * dx + dy * dy;
      if (d < best) { best = d; bi = i + t; }
    }
    return [best, bi / (pts.length - 1)];
  }
  function line(pts, r) { return function (x, y) { return near(pts, x, y)[0] <= r * r; }; }
  function any() { var f = arguments; return function (x, y) { for (var i = 0; i < f.length; i++) if (f[i](x, y)) return true; return false; }; }
  function paint(g, shape, color, skip) {
    for (var y = 0; y < 32; y++) for (var x = 0; x < 32; x++) {
      if (shape(x, y)) g[y * 32 + x] = color(x, y);
      else if (shape(x - 1, y) || shape(x + 1, y) || shape(x, y - 1) || shape(x, y + 1)) { if (!skip || !skip(x, y)) g[y * 32 + x] = OUT; }
    }
  }

  // Coat patterns. Coordinates are relative to the part's centre (head, body) or run 0→1 along it (legs, tail).
  var BREEDS = [
    { name: 'Calico', eye: '#6b8e23', ears: 'up', col: function (p, x, y, k) {
      var W = '#fffdf7', O = '#e8943a', D = '#4a2e22';
      if (p === 'head') return (x < -1.5 && y < -0.5) ? O : (x > 2.5 && y < -2) ? D : W;
      if (p === 'ear') return x < 0 ? O : D;
      if (p === 'body') return ((x + 3) * (x + 3) / 12 + (y + 1.5) * (y + 1.5) / 6 < 1) ? O : ((x - 3.5) * (x - 3.5) / 6 + (y + 2) * (y + 2) / 3.5 < 1) ? D : W;
      if (p === 'tail') return k > 0.72 ? D : O;
      return W;
    } },
    { name: 'Orange Tabby', eye: '#9ac93a', ears: 'up', col: function (p, x, y, k) {
      var G = '#e8943a', S = '#b8621b', C = '#fdf6e3', rx = Math.round(x), ry = Math.round(y);
      if (p === 'head') { if (y > 1.5 && Math.abs(x) < 3.2) return C; if (y < -2.5 && y > -6 && (rx === -2 || rx === 0 || rx === 2)) return S; if (Math.abs(x) > 4.8 && (ry === 0 || ry === 2)) return S; return G; }
      if (p === 'body') { if (y > 2.4 && x > 0) return C; if ((rx + 40) % 3 === 0 && y < 2) return S; return G; }
      if (p === 'tail') return Math.floor(k * 9) % 2 ? S : G;
      if (p === 'leg') return k > 0.78 ? C : G;
      return G;
    } },
    { name: 'Siamese', eye: '#4fa8e0', ears: 'up', col: function (p, x, y, k) {
      var Cr = '#f3e3c3', P = '#4a2e22', P2 = '#7a5a48';
      if (p === 'head') return (x * x / 6 + (y - 2) * (y - 2) / 5 < 1) ? P : (x * x / 15 + (y - 1.5) * (y - 1.5) / 11 < 1) ? P2 : Cr;
      if (p === 'ear') return P;
      if (p === 'body') return x < -4 ? '#e8d3b0' : Cr;
      if (p === 'tail') return k > 0.25 ? P : P2;
      if (p === 'leg') return k > 0.55 ? P : k > 0.3 ? P2 : Cr;
      return Cr;
    } },
    { name: 'Tuxedo', eye: '#c9d94a', ears: 'up', col: function (p, x, y, k) {
      var K = '#2e2428', K2 = '#4e4048', Wt = '#fffdf7';
      if (p === 'head') { if (x * x / 9 + (y - 2.6) * (y - 2.6) / 5.5 < 1) return Wt; if (Math.abs(x + 0.5) < 1 && y > -3 && y < 1) return Wt; return y < -4.2 ? K2 : K; }
      if (p === 'body') { if (x > 3 && y > -1.5) return Wt; return y < -3.4 ? K2 : K; }
      if (p === 'leg') return k > 0.7 ? Wt : K;
      if (p === 'tail') return k > 0.86 ? Wt : K;
      return K;
    } },
    { name: 'Scottish Fold', eye: '#e0a030', ears: 'fold', col: function (p, x, y, k) {
      var B = '#8e9baa', S = '#6c7887', L = '#bcc6d2';
      if (p === 'head') { if (y > 1.5 && Math.abs(x) < 3.5) return L; if (y < -3 && Math.abs(x) < 3 && Math.round(x) % 2 === 0) return S; return B; }
      if (p === 'ear') return S;
      if (p === 'body') return (y > 2.4 && x > 1) ? L : B;
      if (p === 'tail') return Math.floor(k * 9) % 3 === 2 ? S : B;
      return B;
    } },
    // the five footer cats
    { name: 'Black Cat', eye: '#e0c030', ears: 'up', col: function (p, x, y, k) {
      var K = '#2a2226', K2 = '#463a40';
      if (p === 'head') return y < -4.4 ? K2 : K;
      if (p === 'body') return y < -3.4 ? K2 : K;
      return K;
    } },
    { name: 'Tortoiseshell', eye: '#e0a030', ears: 'up', col: function (p, x, y, k) {
      var K = '#3a2a24', O = '#c8742e', T = '#8a4a22', h = Math.round(x * 1.7 + y * 2.3 + k * 9);
      var m = ((h % 5) + 5) % 5;
      if (p === 'head') return x < -0.5 ? (m < 2 ? O : K) : (m === 0 ? O : K);
      return m === 0 ? O : m === 1 ? T : K;
    } },
    { name: 'Grey Tabby', eye: '#6b8e23', ears: 'up', col: function (p, x, y, k) {
      var G = '#9a9690', S = '#5e5a56', L = '#d6d2ca', rx = Math.round(x), ry = Math.round(y);
      if (p === 'head') { if (y > 1.5 && Math.abs(x) < 3.2) return L; if (y < -2.5 && (rx === -2 || rx === 0 || rx === 2)) return S; return G; }
      if (p === 'body') { if (y > 2.4 && x > 1) return L; if ((rx + 40) % 3 === 0) return S; return G; }
      if (p === 'tail') return Math.floor(k * 9) % 2 ? S : G;
      if (p === 'leg') return Math.floor(k * 5) % 2 ? S : G;
      return G;
    } },
    { name: 'Snow', eye: '#4fa8e0', ears: 'up', col: function (p, x, y, k) {
      var W = '#fffdf7', W2 = '#ece4d6';
      if (p === 'head') return y > 3.4 ? W2 : W;
      if (p === 'body') return y > 2 ? W2 : W;
      return W;
    } },
    { name: 'Ginger & White', eye: '#9ac93a', ears: 'up', col: function (p, x, y, k) {
      var G = '#e8943a', W = '#fffdf7';
      if (p === 'head') return (y > 0.5 && Math.abs(x) < 3.6) || (Math.abs(x + 0.3) < 1 && y > -3) ? W : G;
      if (p === 'ear') return G;
      if (p === 'body') return (x > 1.5 && y > -2) || y > 2.6 ? W : G;
      if (p === 'leg') return W;
      if (p === 'tail') return k > 0.8 ? W : G;
      return G;
    } }
  ];

  // st: { pose: 'walk'|'sit', step: 0-7, tail: -2..2, ear: 0|1|2, eyes: 'open'|'blink'|'happy'|'sleep', pet: bool }
  function drawCat(B, st) {
    var g = new Array(1024), walk = st.pose === 'walk';
    var bob = walk && st.step % 4 === 2 ? -1 : 0;
    var bx = walk ? 14 : 13, by = (walk ? 21 : 22) + bob, hx = walk ? 22 : 20.5, hy = (walk ? 12.5 : 12) + bob;
    var col = function (part, ox, oy, dark, k) { return function (x, y) { var c = B.col(part, x + 0.5 - ox, y + 0.5 - oy, k ? k(x, y) : 0); if (part === 'body' && y + 0.5 - oy > 2.6) c = shade(c, -0.14); if (part === 'head' && y + 0.5 - oy > 4.4) c = shade(c, -0.1); return dark ? shade(c, -0.25) : c; }; };

    // soft ground shadow
    var sh = ell(15.5, 29.7, 10.5, 1.6);
    for (var i = 0; i < 1024; i++) if (sh(i % 32, i >> 5)) g[i] = 'rgba(44,26,18,0.25)';

    // legs
    var ph = st.step / 8 * Math.PI * 2;
    function leg(x, off) {
      if (!walk) return null;
      var s = Math.sin(ph + off), lift = Math.max(0, Math.cos(ph + off)), fx = x + Math.round(s * 2), fy = 27.6 - Math.round(lift * 1.4);
      return [[x, by + 1], [fx, fy]];
    }
    function legPart(pts, dark, skip) {
      var shape = any(line(pts, 1.45), ell(pts[1][0] + 0.4, pts[1][1] + 0.3, 1.9, 1.15));
      paint(g, shape, col('leg', 0, 0, dark, function (x, y) { return Math.max(0, Math.min(1, (y + 0.5 - pts[0][1]) / (pts[1][1] - pts[0][1] + 1))); }), skip);
    }
    var bodyShape = walk ? any(ell(bx, by, 7.6, 4.6), ell(bx + 4.5, by - 0.8, 3.6, 4.2)) : any(ell(11, 24 + bob, 5.8, 4.4), ell(16.8, 20.5 + bob, 4.4, 5.6));
    if (walk) { legPart(leg(9.5, Math.PI), true); legPart(leg(18.5, 0), true); }
    else legPart([[16, 21], [16, 27.6]], true);

    // tail
    var pts = [], a, curv, n, seg = 1.3, x0, y0, sw = st.tail;
    if (st.pet) { x0 = walk ? 7.5 : 7; y0 = walk ? by - 1 : 23; a = -1.8; curv = 0.06; n = 9; }
    else if (walk) { x0 = 7.5; y0 = by - 1; a = -2.25 + sw * 0.12; curv = 0.14 + sw * 0.02; n = 9; }
    else { x0 = 7; y0 = 26 + bob; a = Math.PI - 0.1; curv = 0.34 + sw * 0.05; n = 8; }
    pts.push([x0, y0]);
    for (i = 0; i < n; i++) { x0 += Math.cos(a) * seg; y0 += Math.sin(a) * seg; pts.push([x0, y0]); a += curv; }
    paint(g, line(pts, 1.25), col('tail', 0, 0, false, function (x, y) { return near(pts, x, y)[1]; }));

    // body, then the near legs (no outline where they overlap the body)
    paint(g, bodyShape, col('body', walk ? bx : 13.5, walk ? by : 22 + bob));
    if (walk) { legPart(leg(11.5, 0), false, bodyShape); legPart(leg(20.5, Math.PI), false, bodyShape); }
    else { legPart([[19.4, 21], [19.4, 27.6]], false, bodyShape); paint(g, ell(14, 28.2, 2.3, 1.2), col('leg', 0, 0, false, function () { return 1; })); }

    // ears (twitch: 1 = left ear flicks, 2 = right ear flicks)
    var eL = st.ear === 1 ? [-1, 1.5] : [0, 0], eR = st.ear === 2 ? [1, 1.5] : [0, 0];
    if (B.ears === 'fold') {
      paint(g, ell(hx - 4, hy - 5.3 + eL[1] * 0.6, 2.7, 1.7), col('ear', hx, hy));
      paint(g, ell(hx + 4, hy - 5.3 + eR[1] * 0.6, 2.7, 1.7), col('ear', hx, hy));
    } else {
      var ears = [
        [hx - 7, hy - 2, hx - 1.5, hy - 5, hx - 5.5 + eL[0], hy - 10.5 + eL[1]],
        [hx + 1.5, hy - 5, hx + 7, hy - 2, hx + 5.5 + eR[0], hy - 10.5 + eR[1]]
      ];
      ears.forEach(function (e) {
        var cxm = (e[0] + e[2] + e[4]) / 3, cym = (e[1] + e[3] + e[5]) / 3, s = 0.5;
        var inner = tri(cxm + (e[0] - cxm) * s, cym + (e[1] - cym) * s + 0.6, cxm + (e[2] - cxm) * s, cym + (e[3] - cym) * s + 0.6, cxm + (e[4] - cxm) * s, cym + (e[5] - cym) * s + 0.6);
        var base = col('ear', hx, hy);
        paint(g, tri(e[0], e[1], e[2], e[3], e[4], e[5]), function (x, y) { return inner(x, y) ? PINK : base(x, y); });
      });
    }

    // head with cheek fluff
    paint(g, any(ell(hx, hy, 7.2, 6.2), ell(hx - 5.6, hy + 2.4, 2.3, 2.1), ell(hx + 5.6, hy + 2.4, 2.3, 2.1)), col('head', hx, hy));

    // face
    var ey = Math.round(hy), e1 = Math.round(hx - 4.5), e2 = Math.round(hx + 2.5), nx = Math.round(hx - 1);
    function px(x, y, c) { if (x >= 0 && x < 32 && y >= 0 && y < 32) g[y * 32 + x] = c; }
    [e1, e2].forEach(function (ex) {
      if (st.eyes === 'open') { px(ex, ey, OUT); px(ex + 1, ey, SPARK); px(ex, ey + 1, B.eye); px(ex + 1, ey + 1, OUT); }
      else if (st.eyes === 'happy') { px(ex, ey + 1, OUT); px(ex + 1, ey, OUT); px(ex + 2, ey + 1, OUT); }
      else { px(ex, ey + 1, OUT); px(ex + 1, ey + 1, OUT); }
    });
    px(nx, ey + 2, NOSE); px(nx + 1, ey + 2, NOSE);
    px(nx, ey + 3, shade(B.col('head', 0, 3, 0), -0.45));
    px(e1 - 1, ey + 2, BLUSH); px(e2 + 2, ey + 2, BLUSH);

    var c = document.createElement('canvas'); c.width = c.height = 32;
    var cx = c.getContext('2d');
    for (i = 0; i < 1024; i++) if (g[i]) { cx.fillStyle = g[i]; cx.fillRect(i % 32, i >> 5, 1, 1); }
    return c;
  }

  /* ---------- Cat Stamp Card ----------
     The card lives on the customer's phone as a random code (no sign-up, no personal details) and shows as a
     QR code. Staff scan it with the café phone, which opens the staff page of the Google Apps Script (signed
     in to the Chibiro Google account) to add a stamp or give the free drink. This page polls the sheet so new
     stamps appear live. Backend and setup: apps-script/Code.gs and the setup guide.
     Paste the two web app links (both end in /exec) here. While STAMP_API is empty the card runs in a
     preview mode that only lives in this browser, so the design can be tried out. */
  var STAMP_API = 'https://script.google.com/macros/s/AKfycbwR8Z7vlQEVyXehefGOcjkERVbE7l9H5FrJ0IwzMyVmkzl7V-aPuUicSdaz9dba1ZXx/exec';     // public deployment ("Who has access: Anyone"): looks up a card's stamps
  var STAMP_STAFF = 'https://script.google.com/macros/s/AKfycbzCwCftbNpsDwIqmo1EqXWAJ1WeKWnyd1YudxPhTHwZ08Os7h2pCUfgBEONVk77mDHw/exec';   // staff deployment ("Who has access: Only myself"): the staff page
  (function () {
    var cardEl = document.getElementById('stampCard'), side = document.getElementById('stampSide'); if (!cardEl || !side) return;
    var SIZE = 10, CARD_KEY = 'chibiro-card', STAFF_KEY = 'chibiro-staff-phone', DEMO_KEY = 'chibiro-card-demo', TZ = 'Asia/Kuching';
    var CATNAMES = ['Calico', 'Orange Tabby', 'Siamese', 'Tuxedo', 'Scottish Fold', 'Black Cat', 'Tortoiseshell', 'Grey Tabby', 'Snow', 'Ginger & White'];
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var demo = !STAMP_API;
    function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
    function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function validCode(c) { return typeof c === 'string' && /^[A-Za-z0-9_-]{22}$/.test(c); }
    function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function pad(n) { return ('000' + n).slice(-4); }
    function newCode() { var b = new Uint8Array(16); crypto.getRandomValues(b); return btoa(String.fromCharCode.apply(null, b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
    function cardLink(code) { return location.origin + location.pathname + '#card=' + code; }
    function short(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + ' ' + MON[+p[1] - 1] : ''; }
    function longDate(iso) { try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).format(new Date(iso)); } catch (e) { return String(iso).slice(0, 10); } }
    function todayIso() { try { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }

    // ---- arriving from a scanned QR code (#card=…) or the café phone set-up link (#staff-phone=on|off) ----
    var hash = new URLSearchParams(location.hash.slice(1)), query = new URLSearchParams(location.search);
    var scanned = hash.get('card') || query.get('card'), staffSetting = hash.get('staff-phone');
    if (validCode(scanned) && STAMP_STAFF && load(STAFF_KEY) === '1') { location.replace(STAMP_STAFF + '?card=' + encodeURIComponent(scanned)); return; }

    var state = { code: load(CARD_KEY), card: null, msg: null, fresh: [], error: false, paused: false };
    if (!validCode(state.code)) state.code = null;

    // ---- talking to the sheet (or the in-browser preview) ----
    function demoCard() {
      var d = null; try { d = JSON.parse(load(DEMO_KEY) || 'null'); } catch (e) { d = null; }
      d = d || { member: 0, stamps: 0, dates: [], freeDrinks: 0 };
      var last = d.dates[d.dates.length - 1], exp = null;
      if (d.stamps > 0 && d.stamps < SIZE && last) { var x = new Date(last + 'T23:59:59+08:00'); x.setMonth(x.getMonth() + 1); exp = x.toISOString(); }
      return { member: d.member, stamps: d.stamps, size: SIZE, dates: d.dates, expires: exp, stampedToday: false, freeDrinks: d.freeDrinks };
    }
    function demoStamp() {
      var c = demoCard();
      if (c.stamps >= SIZE) { c.stamps = 0; c.dates = []; c.freeDrinks += 1; state.msg = { text: 'Free drink given (preview). A new card has started.', ok: true }; }
      else { if (!c.member) c.member = 308; c.stamps += 1; c.dates = c.dates.concat([todayIso()]); }
      store(DEMO_KEY, JSON.stringify({ member: c.member, stamps: c.stamps, dates: c.dates, freeDrinks: c.freeDrinks }));
      return demoCard();
    }
    function fetchCard() {
      if (!state.code) return Promise.resolve(null);
      if (demo) return Promise.resolve(demoCard());
      // A plain-text POST keeps this a "simple" request, which Apps Script web apps accept from any site
      return fetch(STAMP_API, { method: 'POST', body: JSON.stringify({ action: 'card', card: state.code }), redirect: 'follow' })
        .then(function (r) { return r.json(); }).then(function (r) { return r && r.ok ? r.card : null; }).catch(function () { return null; });
    }
    function apply(card) {
      if (!card) { state.error = true; return true; }
      var before = state.card, changed = !before || state.error || before.stamps !== card.stamps || before.freeDrinks !== card.freeDrinks || before.member !== card.member;
      state.error = false;
      if (before) {
        if (card.freeDrinks > before.freeDrinks) state.msg = { text: 'Enjoy your free drink! A new card has started.', ok: true };
        else if (card.stamps > before.stamps) {
          state.fresh = []; for (var i = before.stamps; i < card.stamps; i++) state.fresh.push(i);
          state.msg = { text: 'New cat stamp: ' + CATNAMES[card.stamps - 1] + '! ' + card.stamps + ' of ' + SIZE + '.' + (!before.member && card.member ? ' Welcome, member No.' + pad(card.member) + '!' : ''), ok: true };
        }
      }
      state.card = card;
      return changed;
    }

    // ---- drawing ----
    var heads = {};
    function headURL(k) {
      if (heads[k]) return heads[k];
      var spr = drawCat(BREEDS[k], { pose: 'sit', step: 0, tail: 0, ear: 0, eyes: 'open' }), c = document.createElement('canvas');
      c.width = c.height = 20; c.getContext('2d').drawImage(spr, 11, 0, 20, 20, 0, 0, 20, 20);
      return (heads[k] = c.toDataURL());
    }
    var qrCache = { code: '', svg: '' }, qrLoading = false;
    // qrcode.js is only fetched once a visitor has a card, so first-time visitors never download it
    function loadQr() {
      if (qrLoading) return; qrLoading = true;
      var s = document.createElement('script'); s.src = 'qrcode.js';
      s.onload = function () { var box = side.querySelector('.stamp-qr'); if (box && state.code) box.innerHTML = qrSvg(state.code); };
      s.onerror = function () { qrLoading = false; };
      document.head.appendChild(s);
    }
    function qrSvg(code) {
      if (qrCache.code === code) return qrCache.svg;
      if (typeof qrcode !== 'function') { loadQr(); return ''; }
      var q = qrcode(0, 'M'); q.addData(cardLink(code)); q.make();
      qrCache = { code: code, svg: q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }).replace('<svg ', '<svg role="img" aria-label="Your stamp card QR code" ') };
      return qrCache.svg;
    }
    function cardHTML(c, sample) {
      var n = c.stamps, h = '<div class="stamp-card__head"><div class="stamp-card__names">' +
        '<img class="stamp-card__logo" src="' + esc(LOGO) + '" alt="Chibiro Coffee" width="84" height="43"><span class="stamp-card__title">Stamp Card</span></div>' +
        '<span class="stamp-card__no"><span class="stamp-card__no-label">Member</span><span class="stamp-card__no-num">No.' + (c.member ? pad(c.member) : '----') + '</span></span></div><ol class="stamp-grid">';
      for (var i = 0; i < SIZE; i++) {
        var on = i < n, last = i === SIZE - 1, cls = 'stamp-slot' + (on ? ' is-stamped' : '') + (last && !on ? ' is-reward' : '') + (on && i === n - 1 ? ' is-new' : '') + (state.fresh.indexOf(i) >= 0 ? ' is-fresh' : '');
        h += '<li class="' + cls + '" title="' + esc(CATNAMES[i]) + '"><img class="stamp-head" src="' + headURL(i) + '" alt="" width="20" height="20">' +
          (on ? '<span class="stamp-slot__date">' + esc(short(c.dates[i] || '')) + '</span>' : last ? '<span class="stamp-slot__free">Free<br>Drink</span>' : '<span class="stamp-slot__num">' + (i + 1) + '</span>') + '</li>';
      }
      h += '</ol><div class="stamp-card__foot"><div class="stamp-meter"><span style="width:' + (n / SIZE * 100) + '%"></span></div>';
      h += '<p class="stamp-card__count"><b>' + n + '/' + SIZE + '</b> · ' + (n >= SIZE ? 'your free drink is ready!' : (SIZE - n) + ' more cat' + (SIZE - n > 1 ? 's' : '') + ' to a free drink') + '</p>';
      if (c.expires) h += '<p class="stamp-card__exp">Expires <b>' + esc(longDate(c.expires)) + '</b> · one month after the last stamp</p>';
      else if (n >= SIZE) h += '<p class="stamp-card__exp">Show your QR code at the counter to claim it.</p>';
      else h += '<p class="stamp-card__exp">' + (sample ? 'Sample card' : 'A card expires one month after its last stamp') + '</p>';
      return h + '</div>';
    }
    var LOGO = (document.querySelector('.cb-nav__brand img') || {}).src || '';
    var SAMPLE = { member: 308, stamps: 6, dates: ['2026-11-03', '2026-11-05', '2026-11-07', '2026-11-10', '2026-11-12', '2026-11-16'], expires: '2026-12-16T15:59:59Z', freeDrinks: 0 };
    var sideHTML = side.innerHTML;
    function render() {
      if (!state.code) {                                  // no card yet: the sample card and how it works
        cardEl.innerHTML = cardHTML(SAMPLE, true); cardEl.classList.add('is-sample');
        if (side.dataset.mode !== 'intro') { side.innerHTML = sideHTML; side.dataset.mode = 'intro'; }
        return;
      }
      cardEl.classList.remove('is-sample');
      var c = state.card;
      cardEl.innerHTML = c ? cardHTML(c) : '<p class="stamp-wait">' + (state.error ? 'Couldn\'t check your card. Check your internet and try again.' : 'Loading your card…') + '</p>';
      var h = '<h3 class="stamp-how__title">Your card</h3>';
      if (demo) h += '<p class="stamp-demo"><b>Preview mode.</b> Not linked to the Google Sheet yet, so this card only lives in this browser. Tap the button under the QR code to see a stamp land.</p>';
      if (state.msg) h += '<p class="stamp-msg' + (state.msg.ok ? ' stamp-msg--ok' : '') + '" role="status">' + esc(state.msg.text) + '</p>';
      h += '<div class="stamp-qr">' + qrSvg(state.code) + '</div>';
      h += '<p class="stamp-how__note">After you order, show this QR code at the counter and we\'ll stamp it. One stamp a visit, one visit a day.</p>';
      if (c && c.stampedToday && c.stamps < SIZE) h += '<p class="stamp-how__note"><b>Today\'s cat is collected.</b> See you again soon!</p>';
      if (demo) h += '<button class="cb-btn cb-btn--plain" type="button" data-stamp="demo">' + (c && c.stamps >= SIZE ? 'Preview: give the free drink' : 'Preview: add a stamp') + '</button>';
      else h += state.paused || state.error ? '<button class="stamp-link" type="button" data-stamp="check">Check for stamps</button>' : '<p class="stamp-live"><span class="stamp-live__dot" aria-hidden="true"></span>Live: new stamps appear here</p>';
      h += '<p class="stamp-small">Keep a screenshot of this card. If your phone ever loses it, scan the screenshot with your camera to bring it back.</p>' +
        '<div class="stamp-links"><button class="stamp-link" type="button" data-stamp="copy">Copy my card link</button><button class="stamp-link" type="button" data-stamp="paste">Paste a card link</button></div>' +
        '<p class="stamp-small">No sign-up. We don\'t ask for your name or phone number.</p>';
      side.innerHTML = h; side.dataset.mode = 'card';
      state.fresh = [];
    }

    // ---- live updates while the stamp card is on screen ----
    var poll = { timer: 0, until: 0, busy: false }, onScreen = false;
    function startLive() { poll.until = Date.now() + 3 * 60000; if (state.paused) { state.paused = false; render(); } clearTimeout(poll.timer); check(); }
    function check() {
      if (poll.busy || !state.code) return; poll.busy = true;
      fetchCard().then(function (card) {
        poll.busy = false; if (apply(card)) render(); clearTimeout(poll.timer);
        if (demo || !onScreen || document.hidden) return;
        if (Date.now() > poll.until) { state.paused = true; render(); return; }
        poll.timer = setTimeout(check, 3000);
      });
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { var was = onScreen; onScreen = es[0].isIntersecting; if (onScreen && !was && state.code) startLive(); }).observe(cardEl);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && onScreen && state.code) startLive(); });

    function say(text, ok) { state.msg = { text: text, ok: ok }; render(); }
    document.getElementById('stamps').addEventListener('click', function (e) {
      var b = e.target.closest('[data-stamp]'); if (!b) return;
      var act = b.dataset.stamp;
      if (act === 'get') { state.code = newCode(); store(CARD_KEY, state.code); state.card = null; state.msg = { text: 'Your card is ready! Show the QR code when you order.', ok: true }; render(); startLive(); }
      else if (act === 'check') { state.msg = null; startLive(); }
      else if (act === 'demo') { var before = state.card; state.card = before; apply(demoStamp()); render(); }
      else if (act === 'copy') {
        var link = cardLink(state.code);
        (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(link) : Promise.reject())
          .then(function () { say('Card link copied. Keep it somewhere safe.', true); }, function () { window.prompt('Copy your card link:', link); });
      } else if (act === 'paste') {
        var use = function (text) {
          var m = /card=([A-Za-z0-9_-]{22})/.exec(text || '');
          if (!m) { say('That isn\'t a card link. Open your card in the other browser and tap “Copy my card link” first.', false); return; }
          state.code = m[1]; store(CARD_KEY, m[1]); state.card = null; say('Your card is back on this phone.', true); startLive();
        };
        if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(use, function () { use(window.prompt('Paste your card link here:')); });
        else use(window.prompt('Paste your card link here:'));
      }
    });

    // ---- start ----
    if (scanned || staffSetting) { query.delete('card'); var qs = query.toString(); history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + '#stamps'); }
    if (staffSetting === 'on' || staffSetting === 'off') {
      store(STAFF_KEY, staffSetting === 'on' ? '1' : null);
      state.msg = { text: staffSetting === 'on' ? 'This phone is now the café phone. Scanning a customer\'s card will open the staff page.' : 'This phone is no longer the café phone.', ok: true };
      if (!state.code) state.code = newCode(), store(CARD_KEY, state.code);
    } else if (validCode(scanned) && scanned !== state.code) {
      state.code = scanned; store(CARD_KEY, scanned); state.card = null; state.msg = { text: 'Your card is back on this phone.', ok: true };
    }
    render();
    if (state.code) fetchCard().then(function (card) { if (apply(card)) render(); });
    if (scanned || staffSetting) setTimeout(function () { document.getElementById('stamps').scrollIntoView(); }, 300);
  })();

  /* ---------- Footer yard: flat 2D gravel with three table sets (as in the hero); five more cats wander between them ---------- */
  (function () {
    var cv = document.getElementById('denYard'), box = document.getElementById('denCats'); if (!cv || !box) return;
    var den = cv.parentNode, out = cv.getContext('2d'), bg = document.createElement('canvas'), g = out, P = 3, W = 0, H = 0, sets = [], blocks = [];
    function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
    function chair(x, yb, f) {                            // same folding camping chair as the hero, side view
      var m = '#4a4a52', mesh = '#26262c', trim = '#d0783a';
      for (var k = 0; k < 6; k++) { rect(x - 4 * f + Math.round(k * 7 / 5) * f, yb - 1 - k, 1, 1, m); rect(x + 3 * f - Math.round(k * 7 / 5) * f, yb - 1 - k, 1, 1, m); }
      rect(x + 3 * f, yb - 11, 1, 5, m);
      rect(f > 0 ? x - 4 : x - 3, yb - 7, 8, 1, mesh); rect(f > 0 ? x - 3 : x - 2, yb - 6, 6, 1, mesh); rect(f > 0 ? x - 4 : x - 3, yb - 7, 8, 1, trim);
      rect(f > 0 ? x - 4 : x - 3, yb - 11, 8, 1, mesh); rect(f > 0 ? x + 4 : x - 5, yb - 12, 2, 1, m); rect(f > 0 ? x + 4 : x - 5, yb - 11, 2, 1, mesh);
      for (var r = 0; r < 11; r++) { var bx = x - 4 * f - Math.floor(r / 3) * f; rect(f > 0 ? bx - 1 : bx, yb - 8 - r, 2, 1, mesh); rect(f > 0 ? bx - 1 : bx + 1, yb - 8 - r, 1, 1, r % 5 === 0 ? trim : mesh); }
      rect(f > 0 ? x - 8 : x + 6, yb - 19, 3, 1, trim);
    }
    function table(x, yb) {                               // same aluminium roll table as the hero
      rect(x - 9, yb - 12, 19, 2, '#b4b8bc'); for (var i = x - 8; i < x + 10; i += 2) rect(i, yb - 12, 1, 2, '#8a8e94');
      rect(x - 9, yb - 10, 19, 1, '#6a6e74');
      for (var k = 0; k < 9; k++) { var d = Math.round(k * 5 / 8); rect(x - 7 + d, yb - 9 + k, 1, 1, '#7a7e84'); rect(x - 2 - d, yb - 9 + k, 1, 1, '#7a7e84'); rect(x + 3 + d, yb - 9 + k, 1, 1, '#7a7e84'); rect(x + 8 - d, yb - 9 + k, 1, 1, '#7a7e84'); }
      rect(x - 2, yb - 14, 2, 2, '#fdf6e3'); rect(x + 3, yb - 14, 2, 2, '#e57373');   // two cups on top
    }
    var GY = 0;                                           // the grass edge: everything stands along this line, seen from the side
    function layout() {
      P = window.innerWidth < 768 ? 2 : 3;
      W = Math.max(1, Math.round(den.clientWidth / P)); H = Math.max(1, Math.round(den.clientHeight / P));
      cv.width = W; cv.height = H; bg.width = W; bg.height = H; g = bg.getContext('2d');
      var seed = 7; function R() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      GY = Math.round(H * 0.44);
      // night sky, a few stars
      for (var y = 0; y < GY; y++) rect(0, y, W, 1, y < GY * 0.5 ? '#1a1310' : '#221a14');
      for (var k = 0; k < W / 40; k++) rect(Math.floor(R() * W), Math.floor(R() * GY * 0.45), 1, 1, '#c8c0b0');
      // two rows of tropical trees: soft round crowns, plus a coconut palm now and then
      function crown(cx, top, r, c) { for (var yy = -r; yy <= r; yy++) { var w = Math.round(Math.sqrt(r * r - yy * yy) * 1.15); rect(cx - w, top + r + yy, w * 2 + 1, 1, c); } }
      [['#1d2a1c', 0.62, Math.max(3, Math.round(GY * 0.16))], ['#24361f', 0.8, Math.max(2, Math.round(GY * 0.11))]].forEach(function (row, ri) {
        for (var x = -6; x < W + 10; x += row[2] * 2 + Math.floor(R() * 6)) {
          var r = row[2] + Math.floor(R() * 3), top = Math.round(GY * row[1]) - r - Math.floor(R() * 3);
          crown(x, top, r, row[0]); rect(x, top + r * 2, 2, GY - top - r * 2, row[0]);
        }
        if (ri === 0) for (var pz = 0; pz < 2; pz++) {                  // palms
          var px = Math.round(W * (0.12 + pz * 0.66) + R() * 12), pt = Math.round(GY * 0.22);
          for (var yy = pt; yy < GY; yy++) rect(px + Math.round((yy - pt) * 0.08), yy, 2, 1, '#2a2418');
          [[-1, 0], [1, 0], [-1, 1], [1, 1], [0, -1]].forEach(function (d) { for (var f = 0; f < 9; f++) rect(px + d[0] * f, pt + Math.round(f * f * 0.08) + d[1] * 2 - (d[1] < 0 ? f / 2 : 0), 2, 1, '#22301c'); });
        }
      });
      // grass edge, then the gravel lane down to the bottom
      for (x = 0; x < W; x++) { var gh = 2 + ((x * 7 + (x >> 2)) % 3 === 0 ? 2 : 0); rect(x, GY - gh, 1, gh, x % 3 ? '#3f5a2a' : '#4f6e32'); }
      rect(0, GY, W, 2, '#3f5a2a');
      var tones = ['#6e6658', '#625a4e', '#7a7264', '#575045', '#686052'];
      rect(0, GY + 2, W, H - GY - 2, tones[0]);
      for (y = GY + 2; y < H; y++) for (x = 0; x < W; x++) { var v = R(); if (v < 0.45) rect(x, y, 1, 1, tones[1 + Math.floor(v * 8.8) % 4]); }
      // three table sets along the lane, each with a little lantern glowing on the table
      var step = W / 3;
      sets = [0, 1, 2].map(function (k) { return { x: Math.round(step * (k + 0.5) + (k === 1 ? 6 : 0)), yb: GY + 8 }; });
      sets.forEach(function (s) {
        var gr = g.createRadialGradient(s.x * 1, s.yb - 14, 1, s.x, s.yb - 10, 30);
        gr.addColorStop(0, 'rgba(255,190,110,0.42)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
        g.fillStyle = gr; g.fillRect(s.x - 32, s.yb - 44, 64, 60);
      });
      sets.forEach(function (s) { chair(s.x - 14, s.yb, 1); chair(s.x + 14, s.yb, -1); });
      g = out;
      people(); paint(performance.now());
      // cats may walk the lane in front of a set only where their whole body clears it
      blocks = sets.map(function (s) { return [s.x - 23, s.yb - 21, s.x + 23, s.yb + 16]; });
      stand.x = Math.max(8, Math.round(sets[0].x - 30)); stand.yb = H - 3;
      if (stand.x + 6 > sets[0].x - 23) stand.x = 7;
      blocks.push([stand.x - 7, stand.yb - 26, stand.x + 7, stand.yb + 14]);
      dc.forEach(function (c) { if (!free(c, c.x, c.y)) place(c); });
      if (walker && !wFree(walker.x, walker.yb)) wPlace();
    }

    // ----- customers: two chatting at a table, one standing on the left sipping, one strolling who stops to pet the cats
    function cup(x, y) { rect(x, y, 2, 3, ('#fdf6e3')); rect(x, y, 2, 1, ('#6b4a3a')); }
    // a little person about 25 art pixels tall, feet at (x, yb); pose is stand, walk or sit (on a chair facing `face`)
    function drawPerson(o, t, opt) {
      opt = opt || {};
      var f = o.face, cx = Math.round(o.x), yb = o.yb, sit = o.pose === 'sit';
      if (opt.bend) return drawCrouch(o, opt);
      var hy = sit ? yb - 24 : yb - 25, by = hy + 7, hx = f > 0 ? cx - 2 : cx - 3, ex = f > 0 ? hx + 4 : hx + 1, fx = f > 0 ? cx + 2 : cx - 2;
      var skin = (o.skin), shirt = (o.shirt), pants = (o.pants), shoe = ('#2a2224'), dark = 'rgba(30,20,30,0.28)';
      // legs
      if (sit) {
        rect(f > 0 ? cx - 2 : cx - 4, yb - 9, 7, 2, pants);
        var sx = f > 0 ? cx + 3 : cx - 4; rect(sx, yb - 7, 2, 6, pants); rect(f > 0 ? sx : sx - 1, yb - 1, 3, 1, shoe);
      } else {
        var st = opt.step || 0;
        for (var r = 0; r < 8; r++) {
          var off = st % 2 && r >= 3 ? Math.min(2, Math.round((r - 2) / 2)) : 0, d = st === 1 ? 1 : -1;
          rect(cx - 2 - f * d * off, yb - 9 + r, 2, 1, pants);
          rect(cx + 1 + f * d * off, yb - 9 + r, 2, 1, pants);
        }
        var o1 = st % 2 ? -f * (st === 1 ? 1 : -1) * 2 : 0, o2 = -o1;
        rect(cx - 2 + o1 + (f > 0 ? 0 : -1), yb - 1, 3, 1, shoe); rect(cx + 1 + o2 + (f > 0 ? 0 : -1), yb - 1, 3, 1, shoe);
      }
      // body
      rect(cx - 2, by, 5, 9, shirt); rect(f > 0 ? cx - 2 : cx + 2, by, 1, 9, dark); rect(cx - 1, by, 3, 1, dark);
      // head and hair
      rect(hx, hy + 1, 6, 6, skin);
      var hb = f > 0 ? hx : hx + 4, hc = (o.hair);
      rect(hx, hy, 6, 2, hc); rect(hb, hy + 2, 2, o.style === 'long' ? 8 : 3, hc);
      if (o.style === 'bun') rect(f > 0 ? hx - 1 : hx + 5, hy - 1, 2, 2, hc);
      if (o.style === 'cap') { rect(hx, hy - 1, 6, 2, (o.cap)); rect(f > 0 ? hx + 6 : hx - 2, hy, 2, 1, (o.cap)); }
      rect(ex, hy + 3, 1, 1, OUT);
      if (opt.mouth) rect(ex, hy + 5, 1, 1, ('#9a4a40'));
      // front arm: resting, gesturing, holding a cup or sipping from it
      var arm = shade(o.shirt, -0.25);
      if (opt.sip) { rect(fx, by + 1, 1, 2, arm); rect(fx + f, by, 1, 1, skin); cup(f > 0 ? hx + 6 : hx - 2, hy + 4); }
      else if (opt.cup) { rect(fx, by + 1, 1, 4, arm); rect(fx + f, by + 5, 1, 1, skin); cup(f > 0 ? fx + 2 : fx - 3, by + 3); }
      else if (opt.gesture) { rect(fx, by + 1, 1, 2, arm); rect(fx + f, by + 3, 1, 1, arm); rect(fx + 2 * f, by + 2, 1, 1, skin); }
      else if (!sit) { rect(fx, by + 1, 1, 6, arm); rect(fx, by + 7, 1, 1, skin); }
      else { rect(fx, by + 1, 1, 4, arm); rect(fx + f, by + 5, 2, 1, arm); rect(fx + 3 * f, by + 5, 1, 1, skin); }
      if (opt.bubble) {                                                                                    // a little "…" speech bubble
        var bx = f > 0 ? hx + 4 : hx - 7, byy = hy - 7;
        rect(bx, byy, 9, 5, ('#fffdf7')); rect(bx + (f > 0 ? 1 : 6), byy + 5, 2, 1, ('#fffdf7'));
        for (var dd = 0; dd < 3; dd++) rect(bx + 2 + dd * 2, byy + 2, 1, 1, ('#6b4a3a'));
      }
    }

    function drawCrouch(o, opt) { // squatting on one knee, leaning in and patting the cat in front of them
      var f = o.face, cx = Math.round(o.x), yb = o.yb, skin = (o.skin), shirt = (o.shirt), pants = (o.pants), shoe = ('#2a2224'), hc = (o.hair);
      rect(f > 0 ? cx - 3 : cx + 2, yb - 6, 2, 4, pants); rect(f > 0 ? cx - 6 : cx + 2, yb - 2, 5, 2, pants);              // back leg: knee down, shin along the ground
      rect(f > 0 ? cx - 7 : cx + 6, yb - 2, 1, 2, shoe);
      rect(f > 0 ? cx - 1 : cx - 3, yb - 7, 5, 2, pants); rect(f > 0 ? cx + 2 : cx - 3, yb - 5, 2, 4, pants);                 // front leg: thigh and shin
      rect(f > 0 ? cx + 2 : cx - 4, yb - 1, 3, 1, shoe);
      var by = yb - 13;
      for (var r = 0; r < 7; r++) rect(cx - 2 + (r < 2 ? 2 * f : r < 4 ? f : 0), by + r, 5, 1, shirt);                     // body leaning in
      var hx = (f > 0 ? cx - 1 : cx - 4) + 2 * f, hy = by - 6;
      rect(hx, hy + 1, 6, 5, skin); rect(hx, hy, 6, 2, hc); rect(f > 0 ? hx : hx + 4, hy + 2, 2, o.style === 'long' ? 6 : 2, hc);
      if (o.style === 'cap') { rect(hx, hy - 1, 6, 2, (o.cap)); rect(f > 0 ? hx + 6 : hx - 2, hy, 2, 1, (o.cap)); }
      if (o.style === 'bun') rect(f > 0 ? hx - 1 : hx + 5, hy - 1, 2, 2, hc);
      rect(f > 0 ? hx + 4 : hx + 1, hy + 4, 1, 1, OUT);                                                                 // eye, looking down at the cat
      var pat = opt.pat || 0;
      for (var k = 0; k < 4; k++) rect(cx + (3 + k) * f, by + 2 + Math.round(k * 0.75), 1, 1, shirt);                      // arm reaching out
      rect(f > 0 ? cx + 7 : cx - 8, by + 4 + pat, 2, 1, skin);                                                              // hand, patting
    }


    var pair = [{ pose: 'sit', skin: '#e2b48c', hair: '#2a1a14', style: 'long', shirt: '#d08ab0', pants: '#3a4a6a', face: 1, ph: 0.4 },
                { pose: 'sit', skin: '#c98e62', hair: '#1c1c22', style: 'cap', cap: '#2e4a7a', shirt: '#e8d46a', pants: '#2e2e34', face: -1, ph: 2.7 }];
    var stand = { pose: 'stand', skin: '#f1c9a5', hair: '#3e281c', style: 'bun', shirt: '#6aa060', pants: '#6a5a48', face: 1, ph: 1.2, x: 10, yb: 0 };
    var walker = { pose: 'walk', skin: '#a8724a', hair: '#2a1a14', style: 'short', shirt: '#5a8ac0', pants: '#5a6a8a', face: 1, ph: 0, x: -99, yb: -99, tx: 0, ty: 0, v: 9, dist: 0, petUntil: 0, cool: 0, next: 0, cat: null };
    function people() { var s = sets[1]; pair[0].x = s.x - 14; pair[1].x = s.x + 14; pair[0].yb = pair[1].yb = s.yb; }
    function wFoot(x, y) { return [x - 4, y - 2, x + 4, y + 1]; }
    function wFree(x, y) {
      if (x < 6 || x > W - 6 || y < GY + 5 || y > H - 1) return false;
      var f = wFoot(x, y);
      if (sets.some(function (s) { return hit(f, [s.x - 23, s.yb - 4, s.x + 23, s.yb + 3]); })) return false;
      if (hit(f, [stand.x - 8, stand.yb - 3, stand.x + 8, stand.yb + 2])) return false;
      return dc.every(function (c) { return !hit(f, [c.x - 9, c.y - 4, c.x + 9, c.y + 2]); });
    }
    function wPlace() { for (var k = 0; k < 300; k++) { var x = 6 + Math.random() * (W - 12), y = GY + 5 + Math.random() * (H - GY - 6); if (wFree(x, y)) { walker.x = walker.tx = x; walker.yb = walker.ty = y; return; } } }
    function wPick() { for (var k = 0; k < 40; k++) { var x = 6 + Math.random() * (W - 12), y = GY + 5 + Math.random() * (H - GY - 6), ok = wFree(x, y);
      for (var j = 1; ok && j <= 12; j++) ok = wFree(walker.x + (x - walker.x) * j / 12, walker.yb + (y - walker.yb) * j / 12);
      if (ok) { walker.tx = x; walker.ty = y; return; } } }
    function moveWalker(t, dt) {
      var w = walker;
      if (w.petUntil) { if (t < w.petUntil) { if (w.cat) w.cat.happy = Math.max(w.cat.happy, t + 200); return; } w.petUntil = 0; w.cat = null; w.cool = t + 6000; w.next = 0; w.face = -w.face; }
      if (still()) return;
      if (t > w.cool) {                                   // a cat right beside them: kneel down and give it a pat
        var near = dc.filter(function (c) { return Math.abs(c.y - w.yb) <= 6 && Math.abs(c.x - w.x) <= 20 && Math.abs(c.x - w.x) >= 8; })[0];
        if (near) { w.petUntil = t + 3200; w.cat = near; near.happy = t + 3400; near.tx = near.x; near.ty = near.y; w.face = near.x > w.x ? 1 : -1; w.tx = w.x; w.ty = w.yb; return; }
      }
      var dx = w.tx - w.x, dy = w.ty - w.yb, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.4) { if (t > w.next) { wPick(); w.next = t + 2500 + Math.random() * 3500; } w.moving = false; return; }
      var st = Math.min(d, w.v * dt), nx = w.x + dx / d * st, ny = w.yb + dy / d * st;
      if (!wFree(nx, ny)) { w.tx = w.x; w.ty = w.yb; w.next = t + 600; w.moving = false; return; }
      w.x = nx; w.yb = ny; w.dist += st; w.moving = true; if (Math.abs(dx) > 0.2) w.face = dx > 0 ? 1 : -1;
    }
    function paint(t) {
      if (!W) return;
      g.drawImage(bg, 0, 0);
      var talk = Math.floor(t / 2600) % 2;
      pair.forEach(function (q, i) {                      // chatting in turns, sipping now and then
        var chat = !still() && talk === i, sip = !still() && !chat && Math.sin(t * 0.0011 + q.ph) > 0.6;
        q.sipping = sip;
        drawPerson(q, t, { sip: sip, mouth: chat && Math.floor(t / 200) % 2 === 0, gesture: chat && Math.floor(t / 900) % 2 === 0, bubble: chat && Math.floor(t / 2600) % 4 < 2 });
      });
      sets.forEach(function (s, k) {
        table(s.x, s.yb);
        rect(s.x - 1, s.yb - 17, 3, 4, '#ffd27a'); rect(s.x - 1, s.yb - 18, 3, 1, '#2c1a12'); rect(s.x - 1, s.yb - 13, 3, 1, '#2c1a12');
        if (k === 1) pair.forEach(function (q, i) { if (!q.sipping) cup(s.x + (i ? 5 : -7), s.yb - 15); });
      });
      var o = !still() && Math.sin(t * 0.0009 + stand.ph) > 0.75;
      var list = [[stand, { sip: o, cup: !o }], [walker, walker.petUntil && t < walker.petUntil ? { bend: true, pat: Math.floor(t / 260) % 2 } : { step: walker.moving ? Math.floor(walker.dist / 2.5) % 4 : 0, cup: false }]];
      list.sort(function (a, b) { return a[0].yb - b[0].yb; }).forEach(function (e) { if (e[0].yb > 0) drawPerson(e[0], t, e[1]); });
    }
    var dc = [];
    function foot(x, y) { return [x - 7, y - 4, x + 7, y + 1]; }   // a cat's footprint, in yard pixels
    function hit(a, b) { return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; }
    function free(c, x, y) {
      if (x < 9 || x > W - 9 || y < GY + 9 || y > H - 2) return false;  // stay on the gravel lane, fully in view
      var f = foot(x, y);
      if (blocks.some(function (b) { return hit(f, b); })) return false;
      if (walker && hit(f, [walker.x - 7, walker.yb - 26, walker.x + 7, walker.yb + 14])) return false;
      return dc.every(function (o) { return o === c || Math.abs(o.x - x) > 16 || Math.abs(o.y - y) > 13; });
    }
    function clear(c, x0, y0, x1, y1) { for (var k = 1; k <= 12; k++) { var t = k / 12; if (!free(c, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; } return true; }
    function place(c) { for (var k = 0; k < 300; k++) { var x = 9 + Math.random() * (W - 18), y = GY + 9 + Math.random() * (H - GY - 11); if (free(c, x, y)) { c.x = c.tx = x; c.y = c.ty = y; return; } } }
    function pick(c) { for (var k = 0; k < 40; k++) { var x = 9 + Math.random() * (W - 18), y = GY + 9 + Math.random() * (H - GY - 11); if (free(c, x, y) && clear(c, c.x, c.y, x, y)) { c.tx = x; c.ty = y; return; } } }
    for (var i = 5; i < 10; i++) {
      var el = document.createElement('div'), sp = document.createElement('canvas');
      el.className = 'den-cat'; sp.width = sp.height = 32; el.appendChild(sp); box.appendChild(el);
      var c = { el: el, g: sp.getContext('2d'), B: BREEDS[i], cache: {}, key: '', x: -99, y: -99, tx: 0, ty: 0, v: 7 + (i % 3) * 2,
        next: 800 * (i - 4), moving: false, walk: 0, face: i % 2 ? 1 : -1, happy: 0, tailT: i, blink: 0, blinkNext: 1500 + i * 500 };
      el.addEventListener('click', (function (c) { return function () { c.happy = performance.now() + 1500; c.el.classList.remove('is-hop'); void c.el.offsetWidth; c.el.classList.add('is-hop'); }; })(c));
      dc.push(c);
    }
    function draw(c, t) {
      var pet = t < c.happy, st = { pose: c.moving ? 'walk' : 'sit', step: c.moving ? Math.floor(c.walk) : 0, tail: pet ? 0 : Math.round(Math.sin(c.tailT) * 2), ear: 0,
        eyes: pet ? 'happy' : t < c.blink ? 'blink' : 'open', pet: pet };
      var key = st.pose + st.step + st.tail + st.eyes + (pet ? 'p' : '');
      if (key !== c.key) { c.key = key; var spr = c.cache[key] || (c.cache[key] = drawCat(c.B, st)); c.g.clearRect(0, 0, 32, 32); c.g.drawImage(spr, 0, 0); }
      var s = P * 16;                                     // sprite is 32px for a 16px cat; feet sit 2.5px above its bottom
      c.el.style.transform = 'translate(' + Math.round(c.x * P - s / 2) + 'px,' + Math.round(c.y * P - s * 29.5 / 32) + 'px)';
      c.el.style.zIndex = Math.round(c.y);
      c.el.classList.toggle('is-flip', c.face < 0);
    }
    layout(); dc.forEach(function (c) { place(c); }); wPlace(); den._walker = walker;
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
    // the loop only runs while the footer yard is on screen; off screen it stops completely
    var seen = true, prevT = 0, lastPaint = 0, running = false;
    function start() { if (running || !seen) return; running = true; prevT = performance.now(); requestAnimationFrame(tick); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; start(); }).observe(den);
    function tick(t) {
      if (!seen) { running = false; return; }
      var dt = Math.min(0.05, (t - prevT) / 1000 || 0.016); prevT = t;
      moveWalker(t, dt); if (t - lastPaint > 60) { lastPaint = t; paint(t); }
      dc.forEach(function (c) {
        if (!still() && t > c.next && !c.moving) { pick(c); c.next = t + 3000 + Math.random() * 5000; }
        var dx = c.tx - c.x, dy = c.ty - c.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0.3 && !(t < c.happy) && !still()) {
          var s = Math.min(d, c.v * dt), nx = c.x + dx / d * s, ny = c.y + dy / d * s;
          if (!free(c, nx, ny)) { c.tx = c.x; c.ty = c.y; c.moving = false; c.next = t + 700; }   // someone stepped in the way: stop and rethink
          else { c.x = nx; c.y = ny; c.moving = true; if (Math.abs(dx) > 0.2) c.face = dx > 0 ? 1 : -1; c.walk = (c.walk + s * 0.9 + 0.04) % 8; }
        } else c.moving = false;
        if (t > c.blinkNext) { c.blink = t + 150; c.blinkNext = t + 2500 + Math.random() * 3500; }
        if (!still()) c.tailT += dt * (c.moving ? 12 : 3.5);
        draw(c, t);
      });
      requestAnimationFrame(tick);
    }
    dc.forEach(function (c) { draw(c, 0); });
    start();
  })();

  /* ---------- Five-cat engine (PRD 4.1 – 4.2) ---------- */
  var layer = $('cats'), stage = $('stage'), hero = $('top'), yarnEl = $('yarn');
  var HEART = 'assets/heart.svg', NOTE = 'assets/note.svg';
  var sound = false;
  // ease = how fast each cat closes on its target; bounce = extra hop in px while walking
  var DEFS = [
    // v = walking speed around the hero yard, in scene pixels per second
    { ease: 0.09, v: 12, bounce: 0, role: 'leader' },   // Calico: fastest, chases the yarn
    { ease: 0.065, v: 8, bounce: 0, role: 'wander' },   // Orange Tabby: playful, pauses often
    { ease: 0.055, v: 7, bounce: 0, role: 'wander' },   // Siamese: smooth trot
    { ease: 0.045, v: 6, bounce: 0, role: 'sit' },      // Tuxedo: sits proudly
    { ease: 0.03, v: 5, bounce: 2, role: 'wander' }     // Scottish Fold: slow, bouncy
  ];
  var cats = [].map.call(layer.querySelectorAll('.cb-cat'), function (el, i) {
    var d = DEFS[i], cv = el.querySelector('.cb-cat__sprite');
    return { el: el, cv: cv, cx: cv.getContext('2d'), breed: BREEDS[i], cache: {}, key: '', i: i, ease: d.ease, v: d.v, bounce: d.bounce, role: d.role, ax: 0, ay: 0, path: [], ready: false, blocked: 0, dest: null, yid: -1,
      x: 40 + i * 90, y: -1, wx: 0.15 + i * 0.17, next: 0, face: 1, size: 0, petUntil: 0,
      walk: 0, tailT: i * 1.3, lastMove: 0, earUntil: 0, earSide: 0, earNext: 1500 + i * 900, blinkUntil: 0, blinkNext: 2000 + i * 700 };
  });
  function renderCat(c, st) {
    var key = st.pose + st.step + '|' + st.tail + '|' + st.ear + st.eyes + (st.pet ? 'p' : '');
    if (key === c.key) return;
    c.key = key;
    var spr = c.cache[key] || (c.cache[key] = drawCat(c.breed, st));
    c.cx.clearRect(0, 0, 32, 32); c.cx.drawImage(spr, 0, 0);
  }
  var lastNight = -1;
  var yarn = { x: 300, tx: 300, next: 0, ax: 0, ay: 0, path: [], ready: false, id: 0, dest: null };

  /* ---------- HERO_YARD: a walkable grid over the scene, so cats go around tables, chairs and people ---------- */
  var G = null, CELL = 4;
  function hit(a, b) { return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; }
  var SCL = function () { return 1; };                                            // the scene's depth scale at a given y (smaller near the house)
  function catBox(x, y) { var k = SCL(y); return [x - 7 * k, y - 14 * k, x + 7 * k, y]; }   // a cat's footprint in scene px, feet at (x, y)
  function buildGrid(info) {
    var cols = Math.ceil(info.W / CELL), rows = Math.ceil(info.H / CELL), free = new Uint8Array(cols * rows);
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var fx = i * CELL + 2, fy = j * CELL + 2;
      if (fy < info.yardTop + 16 || fy > info.H - 2 || fx < 9 || fx > info.W - 9) continue;
      var ks = SCL(fy), bx = [fx - 8 * ks, fy - 15 * ks, fx + 8 * ks, fy + 1], ok = true;
      for (var k = 0; ok && k < info.statics.length; k++) if (hit(bx, info.statics[k])) ok = false;
      free[j * cols + i] = ok ? 1 : 0;
    }
    return { cols: cols, rows: rows, free: free, ver: info.ver };
  }
  function cellAt(x, y) { return Math.max(0, Math.min(G.rows - 1, Math.floor(y / CELL))) * G.cols + Math.max(0, Math.min(G.cols - 1, Math.floor(x / CELL))); }
  function centre(id) { return [(id % G.cols) * CELL + 2, Math.floor(id / G.cols) * CELL + 2]; }
  function nearestFree(id) {
    if (G.free[id]) return id;
    var ci = id % G.cols, cj = Math.floor(id / G.cols);
    for (var r = 1; r < 60; r++) for (var dj = -r; dj <= r; dj++) for (var di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      var i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= G.cols || j >= G.rows) continue;
      if (G.free[j * G.cols + i]) return j * G.cols + i;
    }
    return -1;
  }
  function bfs(start) {                                     // 8-way flood from start, no cutting corners
    var prev = new Int32Array(G.cols * G.rows).fill(-2), dist = new Int32Array(G.cols * G.rows), q = [start], out = [];
    prev[start] = -1;
    for (var h = 0; h < q.length; h++) {
      var id = q[h], i = id % G.cols, j = (id - i) / G.cols; out.push(id);
      for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        var ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= G.cols || nj >= G.rows) continue;
        var n = nj * G.cols + ni; if (!G.free[n] || prev[n] !== -2) continue;
        if (di && dj && (!G.free[j * G.cols + ni] || !G.free[nj * G.cols + i])) continue;
        prev[n] = id; dist[n] = dist[id] + 1; q.push(n);
      }
    }
    return { prev: prev, dist: dist, cells: out };
  }
  function route(from, to, B) {
    B = B || bfs(from); if (B.prev[to] === -2) return null;
    var path = []; for (var id = to; id !== -1 && id !== from; id = B.prev[id]) path.unshift(centre(id));
    return path;
  }
  function wanderTo(m, others) {                            // pick a reachable spot a little way off, away from the other cats
    var from = cellAt(m.ax, m.ay), B = bfs(from), pool = B.cells.filter(function (id) { return B.dist[id] >= 4 && B.dist[id] <= 45; });
    for (var tries = 0; tries < 12 && pool.length; tries++) {
      var id = pool[Math.floor(Math.random() * pool.length)], c = centre(id);
      if (others.some(function (o) { return o !== m && o.dest && Math.abs(o.dest[0] - c[0]) < 16 && Math.abs(o.dest[1] - c[1]) < 12; })) continue;
      m.dest = c; m.path = route(from, id, B) || []; return true;
    }
    return false;
  }
  function stepAlong(m, speed, dts, walkers) {              // returns scene px moved (0 when waiting for someone to pass)
    if (!m.path.length) return 0;
    var wp = m.path[0], dx = wp[0] - m.ax, dy = wp[1] - m.ay, d = Math.sqrt(dx * dx + dy * dy), st = speed * dts;
    var nx = d <= st ? wp[0] : m.ax + dx / d * st, ny = d <= st ? wp[1] : m.ay + dy / d * st;
    if (walkers) {                                          // never step into someone; if already touching, only step away
      var nb = catBox(nx, ny), mx = function (w, x, y) { var cx = (w[0] + w[2]) / 2, cy = w[3]; return Math.abs(x - cx) + Math.abs(y - cy); };
      if (walkers.some(function (w) { return hit([nb[0] - 1, nb[1], nb[2] + 1, nb[3]], w) && mx(w, nx, ny) <= mx(w, m.ax, m.ay); })) return -1;
    }
    if (Math.abs(dx) > 0.3) m.face = dx > 0 ? 1 : -1;
    m.ax = nx; m.ay = ny; if (d <= st) m.path.shift();
    return Math.min(d, st);
  }
  var prev = 0;

  function frame(t) {
    var dt = Math.min(48, t - prev || 16.7) / 16.7; prev = t;
    var W = window.innerWidth, H = window.innerHeight;
    var mobile = W < 768, inHero = playful;      // the cats live in the hero yard and scroll away with it
    var s = mobile ? (inHero ? 32 : 48) : (inHero ? 48 : 64), gap = mobile ? 2 : 12, ledge = 8;
    var n = cats.length, packW = n * s + (n - 1) * gap;
    var r = stage.getBoundingClientRect();
    var foot = s * 29.5 / 32;                                                     // sprite feet sit 2.5px above its bottom
    var ground = inHero ? r.top + r.height * 0.55 - foot : r.bottom - foot - ledge;   // Sleepy: curled up at the foot of the hero

    var SC = window.ChibiroScene, info = inHero && SC ? SC.info() : null, dts = dt * 16.7 / 1000;
    if (info && info.W) {
      if (info.scale) SCL = info.scale;
      if (!G || G.ver !== info.ver) { G = buildGrid(info); yarn.ready = false; cats.forEach(function (c) { c.ready = false; }); }
      var Rc = info.rect, Pp = info.P, lead = cats[0];
      cats.forEach(function (c) {                           // place (or re-place) each cat on a free spot in the yard
        if (c.ready) return;
        var cs0 = c.size || s, id = c.y < 0 ? -1 : nearestFree(cellAt((c.x + cs0 / 2 - Rc.left) / Pp, (c.y + cs0 * 29.5 / 32 - Rc.top) / Pp));
        if (c.y < 0 || id < 0) { var fr = []; for (var k = 0; k < G.free.length; k++) if (G.free[k]) { var cp = centre(k); if (!info.walkers.some(function (w) { return hit(catBox(cp[0], cp[1]), [w[0] - 20, w[1], w[2] + 20, w[3] + 4]); }) && !cats.some(function (o) { return o !== c && o.ready && hit(catBox(cp[0], cp[1]), catBox(o.ax, o.ay)); })) fr.push(k); } id = fr.length ? fr[Math.floor(Math.random() * fr.length)] : 0; var cc = centre(id); c.ax = cc[0]; c.ay = cc[1]; c.path = []; }
        else { var here = centre(id); c.ax = here[0]; c.ay = here[1]; c.path = []; }
        c.dest = null; c.next = 0; c.ready = true; c.blocked = 0; c.yid = -1;
      });
      if (!yarn.ready) { yarn.ax = lead.ax; yarn.ay = lead.ay; yarn.path = []; yarn.next = 0; yarn.ready = true; }
      if (!yarn.path.length && t > yarn.next) { if (wanderTo(yarn, [])) yarn.id++; yarn.next = t + 3500 + Math.random() * 3000; }
      stepAlong(yarn, 16, dts);
      var ys = Math.round(s * 0.3 * SCL(yarn.ay));
      yarnEl.style.display = 'block';
      if (yarnEl._s !== ys) { yarnEl._s = ys; yarnEl.style.width = yarnEl.style.height = ys + 'px'; yarnEl.style.borderWidth = Math.max(2, Math.round(ys / 6)) + 'px'; }
      yarnEl.style.transform = 'translate3d(' + Math.round(Rc.left + yarn.ax * Pp - ys / 2) + 'px,' + Math.round(Rc.top + yarn.ay * Pp - ys) + 'px,0)';
    } else { yarnEl.style.display = 'none'; G = G && inHero ? G : null; cats.forEach(function (c) { c.ready = false; }); }
    var catBoxes = [];
    if (SC && SC.pets) while (SC.pets.length) { var pc = cats[SC.pets.shift()]; if (pc) petCat(pc, 3000); }

    cats.forEach(function (c) {
      var tx, ox = c.x, moving = false, cs = s;
      if (info && info.W && c.ready) {                    // IDLE_PLAY in the yard: wander in 2D, around furniture and people
        if (c.role === 'leader') { if (c.yid !== yarn.id && yarn.dest && !c.blocked) { c.yid = yarn.id; c.dest = yarn.dest; c.path = route(cellAt(c.ax, c.ay), cellAt(yarn.dest[0], yarn.dest[1])) || []; } }
        else if (c.role === 'sit') { if (!c.dest) wanderTo(c, cats); }
        else if (!c.path.length && t > c.next) { wanderTo(c, cats); c.next = t + 2500 + Math.random() * 4000 * (1 + c.i * 0.3); }
        var held = SC.holding && SC.holding[c.i] > t;                     // a customer is petting this cat: stay put and enjoy it
        if (held) { c.petUntil = Math.max(c.petUntil, t + 300); c.blocked = 0; if (c.role === 'wander') c.next = Math.max(c.next, t + 1500); }
        var others = cats.filter(function (o) { return o !== c && o.ready; }).map(function (o) { return catBox(o.ax, o.ay); });   // keep a cat's width apart
        if (!held && !c.path.length && info.walkers.concat(others).some(function (w) { return hit(catBox(c.ax, c.ay), w); })) wanderTo(c, cats);   // standing in someone's way: move along
        var was = c.path.length, mv = held ? 0 : stepAlong(c, c.v, dts, info.walkers.concat(others));
        if (!held) cats.forEach(function (o) {                  // two cats ended up on top of each other: ease apart
          if (o === c || !o.ready || !hit(catBox(c.ax, c.ay), catBox(o.ax, o.ay))) return;
          var dx = c.ax - o.ax, dy = c.ay - o.ay, d = Math.sqrt(dx * dx + dy * dy) || 1; if (d < 0.5) { dx = c.i - o.i; dy = 0; d = Math.abs(dx); }
          var nx = c.ax + dx / d * 6 * dts, ny = c.ay + dy / d * 6 * dts;
          if (G.free[cellAt(nx, ny)] && !info.walkers.some(function (w) { return hit(catBox(nx, ny), w); })) { c.ax = nx; c.ay = ny; mv = Math.max(mv, 0.01); if (dx) c.face = dx > 0 ? 1 : -1; }
        });
        if (!held) info.walkers.forEach(function (w) {           // a stroller ended up on top of this cat: ease out of their way
          if (!hit(catBox(c.ax, c.ay), w)) return;
          var dx = c.ax - (w[0] + w[2]) / 2, dy = c.ay - w[3], d = Math.sqrt(dx * dx + dy * dy) || 1;
          var nx = c.ax + dx / d * 6 * dts, ny = c.ay + dy / d * 6 * dts;
          if (G.free[cellAt(nx, ny)]) { c.ax = nx; c.ay = ny; mv = Math.max(mv, 0.01); if (Math.abs(dx) > 0.3) c.face = dx > 0 ? 1 : -1; }
        });
        if (mv < 0) { c.blocked += dt * 16.7; if (c.blocked > 1500) { c.path = []; c.blocked = 0; c.yid = yarn.id; wanderTo(c, cats); } }   // give up and go somewhere else
        else c.blocked = 0;
        if (was && !c.path.length && c.role === 'wander') c.next = t + 2500 + Math.random() * 4000 * (1 + c.i * 0.3);
        moving = mv > 0;
        var cur = cellAt(c.ax, c.ay);
        if (!G.free[cur]) { var nf = nearestFree(cur); if (nf >= 0) { var cc2 = centre(nf); c.ax = cc2[0]; c.ay = cc2[1]; c.path = []; } }   // never rest on top of anything
        cs = Math.round(s * SCL(c.ay));                                     // nearer the house, smaller
        c.x = Rc.left + c.ax * Pp - cs / 2; c.y = Rc.top + c.ay * Pp - cs * 29.5 / 32;
        catBoxes[c.i] = catBox(c.ax, c.ay);
        if (moving) {
          c.el.classList.toggle('cb-cat--flip', c.face < 0);
          c.lastMove = t; c.walk = (c.walk + mv * Pp * 32 / cs * 0.9 + 0.04 * dt) % 8;
        }
      } else {
      if (!playful) {                                   // Sleepy: docked bottom-right
        tx = W - ledge - packW + c.i * (s + gap);
      } else {                                          // IDLE_PLAY
        if (c.role === 'leader') tx = yarn.x - s + 6;
        else if (c.role === 'sit') tx = W * 0.78;
        else {
          if (t > c.next) { c.wx = 0.05 + Math.random() * 0.85; c.next = t + 2500 + Math.random() * 4000 * (1 + c.i * 0.3); }
          tx = c.wx * (W - s);
        }
      }
      c.x += (tx - c.x) * Math.min(1, c.ease * dt);
      c.x = Math.max(ledge, Math.min(W - ledge - s, c.x));                        // STAY_VISIBLE
      c.y = c.y < 0 ? ground : c.y + (ground - c.y) * Math.min(1, 0.15 * dt);
      moving = playful && Math.abs(tx - c.x) > 3;
      if (moving) {
        var face = tx > c.x ? 1 : -1;
        if (face !== c.face) { c.face = face; c.el.classList.toggle('cb-cat--flip', face < 0); }
        c.lastMove = t;
        c.walk = (c.walk + Math.abs(c.x - ox) * 32 / s * 0.9 + 0.05 * dt) % 8;   // legs keep pace with the distance covered
      }
      }
      if (cs !== c.size) { c.size = cs; c.el.style.width = c.el.style.height = cs + 'px'; }

      // ears, blinks and tail
      if (t > c.earNext) { c.earUntil = t + 240; c.earSide = Math.random() < 0.5 ? 1 : 2; c.earNext = t + 1800 + Math.random() * 4500; }
      if (t > c.blinkNext) { c.blinkUntil = t + 150; c.blinkNext = t + 2500 + Math.random() * 3500; }
      if (!still() || moving) c.tailT += dt * (moving ? 0.2 : 0.06);   // Sleepy: tails rest too
      var pet = t < c.petUntil, step = Math.floor(c.walk);
      var pose = moving || t - c.lastMove < 350 ? 'walk' : 'sit';
      if (pose === 'walk' && !moving) step = 0;
      renderCat(c, {
        pose: pose, step: step, pet: pet,
        tail: pet ? 0 : Math.round(Math.sin(c.tailT) * 2),
        ear: !still() && t < c.earUntil ? c.earSide : 0,
        eyes: pet ? 'happy' : !playful ? 'sleep' : t < c.blinkUntil ? 'blink' : 'open'
      });

      var bob = moving && c.bounce ? (step % 4 < 2 ? -c.bounce : 0) : 0;
      var y = c.y + bob;
      c.el.style.transform = 'translate3d(' + Math.round(c.x) + 'px,' + Math.round(y) + 'px,0)';
    });
    if (SC) SC.cats = catBoxes;
    // only show the cats inside the hero, below the sticky nav, so they never ride along with the page
    var hr = hero.getBoundingClientRect(), nb = navEl ? Math.max(0, navEl.getBoundingClientRect().bottom) : 0;
    var clip = 'inset(' + Math.round(Math.max(0, hr.top, nb)) + 'px 0 ' + Math.round(Math.max(0, H - hr.bottom)) + 'px 0)';
    if (clip !== layer._clip) { layer._clip = clip; layer.style.clipPath = clip; layer.style.visibility = hr.bottom <= nb ? 'hidden' : ''; }
    // light the cats like the scene: as they are at sunset, softly darker (and a touch cooler) at night; normal outside the hero
    var nt = info && info.W && SC.night ? Math.round(SC.night * 50) / 50 : 0;
    if (nt !== lastNight) {
      lastNight = nt;
      var f = nt ? 'brightness(' + (1 - 0.48 * nt).toFixed(2) + ') saturate(' + (1 - 0.4 * nt).toFixed(2) + ') hue-rotate(' + Math.round(-10 * nt) + 'deg)' : '';
      cats.forEach(function (c) { c.cv.style.filter = f; }); yarnEl.style.filter = f;
    }
    if (heroOn) requestAnimationFrame(frame); else running = false;
  }
  // the hero cats only animate while the hero is on screen; the last frame above hides them, then the loop stops
  var heroOn = true, running = false;
  function startCats() { if (running) return; running = true; prev = performance.now(); requestAnimationFrame(frame); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; if (heroOn) startCats(); }).observe(hero);
  startCats();

  /* ---------- PET_REACTION ---------- */
  var ac;
  function meow() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = ac.createOscillator(), g = ac.createGain(), now = ac.currentTime;
      o.type = 'square'; o.frequency.setValueAtTime(760, now); o.frequency.linearRampToValueAtTime(520, now + 0.16);
      g.gain.setValueAtTime(0.04, now); g.gain.linearRampToValueAtTime(0, now + 0.2);
      o.connect(g); g.connect(ac.destination); o.start(now); o.stop(now + 0.22);
    } catch (err) {}
  }
  function petCat(cat, ms) {
    var el = cat.el; ms = ms || 900;
    cat.petUntil = Math.max(cat.petUntil, performance.now() + ms);
    el.querySelector('.cb-cat__bubble img').src = ms > 900 || Math.random() < 0.6 ? HEART : NOTE;
    el.classList.remove('is-petted'); void el.offsetWidth; el.classList.add('is-petted');
    clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('is-petted'); }, ms);
    if (sound) meow();
  }
  layer.addEventListener('click', function (e) {
    var el = e.target.closest('.cb-cat'); if (!el) return;
    var cat = cats.filter(function (c) { return c.el === el; })[0];
    if (cat) petCat(cat, 900);
  });

  /* ---------- Toggles ---------- */
  function setToggle(btn, on, label) { btn.setAttribute('aria-checked', on); btn.querySelector('.cb-toggle__state').textContent = label; }
  $('soundToggle').addEventListener('click', function () { sound = !sound; setToggle(this, sound, sound ? 'On' : 'Off'); if (sound) meow(); });
  $('catToggle').addEventListener('click', function () {
    playful = !playful; setToggle(this, playful, playful ? 'Playful' : 'Sleepy');
    if (window.ChibiroScene && window.ChibiroScene.setPaused) window.ChibiroScene.setPaused(!playful);   // Sleepy holds the hero scene still too
  });
  setToggle($('catToggle'), playful, playful ? 'Playful' : 'Sleepy');
})();
