(function () {
  var $ = function (id) { return document.getElementById(id); };
  var view = {   // the page itself scrolls
    get scrollTop() { return window.scrollY; },
    get scrollHeight() { return document.documentElement.scrollHeight; },
    scrollTo: function (o) { window.scrollTo(o); },
    addEventListener: function (a, b, c) { window.addEventListener(a, b, c); }
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
    $('tabs').innerHTML = '<div class="menu-shelves">' + [['drinks', 'Drinks'], ['snacks', 'Snacks']].map(function (t) {
      return '<button class="cb-tab" role="tab" aria-selected="' + (t[0] === shelf) + '" aria-controls="menu" data-shelf="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div><div class="menu-cats" role="group" aria-label="' + (shelf === 'drinks' ? 'Drink' : 'Snack') + ' categories">' + MENU[shelf].map(function (g, i) {
      return '<button class="menu-cat" aria-pressed="' + (i === cat[shelf]) + '" data-cat="' + i + '">' + esc(g.cat) + ' <span class="menu-cat__n">' + g.items.length + '</span></button>';
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
  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-shelf],[data-cat]'); if (!b) return;
    if (b.dataset.shelf) { if (b.dataset.shelf === shelf) return; shelf = b.dataset.shelf; } else cat[shelf] = +b.dataset.cat;
    page = 0; renderMenu();
  });
  $('menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-page],[data-goto]'); if (!b || b.disabled) return;
    page = b.dataset.goto != null ? +b.dataset.goto : page + +b.dataset.page; renderMenu();
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

  /* ---------- Five-cat engine (PRD 4.1 – 4.2) ---------- */
  var layer = $('cats'), stage = $('stage'), hero = $('top'), yarnEl = $('yarn');
  var HEART = 'assets/heart.svg', NOTE = 'assets/note.svg';
  var playful = !reduce, sound = false;
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
  function catBox(x, y) { return [x - 7, y - 14, x + 7, y]; }                     // a cat's footprint in scene px, feet at (x, y)
  function buildGrid(info) {
    var cols = Math.ceil(info.W / CELL), rows = Math.ceil(info.H / CELL), free = new Uint8Array(cols * rows), sky = null, sk = $('skyToggle');
    if (sk) { var b = sk.getBoundingClientRect(), R0 = info.rect; sky = [(b.left - R0.left) / info.P - 2, (b.top - R0.top) / info.P - 2, (b.right - R0.left) / info.P + 2, (b.bottom - R0.top) / info.P + 2]; }
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var fx = i * CELL + 2, fy = j * CELL + 2;
      if (fy < info.yardTop + 16 || fy > info.H - 2 || fx < 9 || fx > info.W - 9) continue;
      var bx = [fx - 8, fy - 15, fx + 8, fy + 1], ok = !(sky && hit(bx, sky));
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
  var lastTop = 0, lastScrollAt = -1e9, dir = 1, prev = 0;

  view.addEventListener('scroll', function () {
    var st = view.scrollTop;
    if (st !== lastTop) { dir = st > lastTop ? 1 : -1; lastTop = st; lastScrollAt = performance.now(); }
  }, { passive: true });

  function frame(t) {
    var dt = Math.min(48, t - prev || 16.7) / 16.7; prev = t;
    var W = window.innerWidth, H = window.innerHeight, st = view.scrollTop;
    var mobile = W < 768, inHero = playful && st < hero.offsetHeight * 0.7;      // IDLE_PLAY threshold
    var s = mobile ? (inHero ? 32 : 48) : (inHero ? 48 : 64), gap = mobile ? 2 : 12, ledge = 8;
    var n = cats.length, packW = n * s + (n - 1) * gap;
    var r = stage.getBoundingClientRect();
    var foot = s * 29.5 / 32;                                                     // sprite feet sit 2.5px above its bottom
    var ground = inHero ? Math.min(r.top + r.height * 0.55 - foot, H - s - ledge) : H - foot - ledge;
    var resting = t - lastScrollAt > 1500;                                       // REST_OBSERVE

    var SC = window.ChibiroScene, info = inHero && SC ? SC.info() : null, dts = dt * 16.7 / 1000;
    if (info && info.W) {
      if (!G || G.ver !== info.ver) { G = buildGrid(info); yarn.ready = false; cats.forEach(function (c) { c.ready = false; }); }
      var Rc = info.rect, Pp = info.P, ys = Math.round(s * 0.3), lead = cats[0];
      cats.forEach(function (c) {                           // place (or re-place) each cat on a free spot in the yard
        if (c.ready) return;
        var id = c.y < 0 ? -1 : nearestFree(cellAt((c.x + s / 2 - Rc.left) / Pp, (c.y + foot - Rc.top) / Pp));
        if (c.y < 0 || id < 0) { var fr = []; for (var k = 0; k < G.free.length; k++) if (G.free[k]) { var cp = centre(k); if (!info.walkers.some(function (w) { return hit(catBox(cp[0], cp[1]), [w[0] - 20, w[1], w[2] + 20, w[3] + 4]); }) && !cats.some(function (o) { return o !== c && o.ready && hit(catBox(cp[0], cp[1]), catBox(o.ax, o.ay)); })) fr.push(k); } id = fr.length ? fr[Math.floor(Math.random() * fr.length)] : 0; var cc = centre(id); c.ax = cc[0]; c.ay = cc[1]; c.path = []; }
        else { var here = centre(id); c.ax = here[0]; c.ay = here[1]; c.path = []; }
        c.dest = null; c.next = 0; c.ready = true; c.blocked = 0; c.yid = -1;
      });
      if (!yarn.ready) { yarn.ax = lead.ax; yarn.ay = lead.ay; yarn.path = []; yarn.next = 0; yarn.ready = true; }
      if (!yarn.path.length && t > yarn.next) { if (wanderTo(yarn, [])) yarn.id++; yarn.next = t + 3500 + Math.random() * 3000; }
      stepAlong(yarn, 16, dts);
      yarnEl.style.display = 'block';
      if (yarnEl._s !== ys) { yarnEl._s = ys; yarnEl.style.width = yarnEl.style.height = ys + 'px'; yarnEl.style.borderWidth = Math.max(2, Math.round(ys / 6)) + 'px'; }
      yarnEl.style.transform = 'translate3d(' + Math.round(Rc.left + yarn.ax * Pp - ys / 2) + 'px,' + Math.round(Rc.top + yarn.ay * Pp - ys) + 'px,0)';
    } else { yarnEl.style.display = 'none'; G = G && inHero ? G : null; cats.forEach(function (c) { c.ready = false; }); }
    var catBoxes = [];
    if (SC && SC.pets) while (SC.pets.length) { var pc = cats[SC.pets.shift()]; if (pc) petCat(pc, 3000); }

    cats.forEach(function (c) {
      var tx, ox = c.x, moving = false;
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
        if (mv < 0) { c.blocked += dt * 16.7; if (c.blocked > 1500) { c.path = []; c.blocked = 0; c.yid = yarn.id; wanderTo(c, cats); } }   // give up and go somewhere else
        else c.blocked = 0;
        if (was && !c.path.length && c.role === 'wander') c.next = t + 2500 + Math.random() * 4000 * (1 + c.i * 0.3);
        moving = mv > 0;
        var cur = cellAt(c.ax, c.ay);
        if (!G.free[cur]) { var nf = nearestFree(cur); if (nf >= 0) { var cc2 = centre(nf); c.ax = cc2[0]; c.ay = cc2[1]; c.path = []; } }   // never rest on top of anything
        c.x = Rc.left + c.ax * Pp - s / 2; c.y = Rc.top + c.ay * Pp - foot;
        catBoxes[c.i] = catBox(c.ax, c.ay);
        if (moving) {
          c.el.classList.toggle('cb-cat--flip', c.face < 0);
          c.lastMove = t; c.walk = (c.walk + mv * Pp * 32 / s * 0.9 + 0.04 * dt) % 8;
        }
      } else {
      if (!playful) {                                   // Sleepy: docked bottom-right
        tx = W - ledge - packW + c.i * (s + gap);
      } else if (inHero) {                              // IDLE_PLAY
        if (c.role === 'leader') tx = yarn.x - s + 6;
        else if (c.role === 'sit') tx = W * 0.78;
        else {
          if (t > c.next) { c.wx = 0.05 + Math.random() * 0.85; c.next = t + 2500 + Math.random() * 4000 * (1 + c.i * 0.3); }
          tx = c.wx * (W - s);
        }
      } else {                                          // SCROLL_CHASE: the pack tracks scroll progress, leader in front
        var max = view.scrollHeight - H, p = max > 0 ? st / max : 0;
        var lead = ledge + p * (W - 2 * ledge - packW);
        tx = lead + (dir > 0 ? n - 1 - c.i : c.i) * (s + gap);
      }
      c.x += (tx - c.x) * Math.min(1, c.ease * dt);
      c.x = Math.max(ledge, Math.min(W - ledge - s, c.x));                        // STAY_VISIBLE
      c.y = c.y < 0 ? ground : c.y + (ground - c.y) * Math.min(1, 0.15 * dt);
      moving = playful && Math.abs(tx - c.x) > 3 && !(resting && !inHero && Math.abs(tx - c.x) < 12);
      if (moving) {
        var face = tx > c.x ? 1 : -1;
        if (face !== c.face) { c.face = face; c.el.classList.toggle('cb-cat--flip', face < 0); }
        c.lastMove = t;
        c.walk = (c.walk + Math.abs(c.x - ox) * 32 / s * 0.9 + 0.05 * dt) % 8;   // legs keep pace with the distance covered
      }
      }
      if (s !== c.size) { c.size = s; c.el.style.width = c.el.style.height = s + 'px'; }

      // ears, blinks and tail
      if (t > c.earNext) { c.earUntil = t + 240; c.earSide = Math.random() < 0.5 ? 1 : 2; c.earNext = t + 1800 + Math.random() * 4500; }
      if (t > c.blinkNext) { c.blinkUntil = t + 150; c.blinkNext = t + 2500 + Math.random() * 3500; }
      if (!reduce) c.tailT += dt * (moving ? 0.2 : playful ? 0.06 : 0.025);
      var pet = t < c.petUntil, step = Math.floor(c.walk);
      var pose = moving || t - c.lastMove < 350 ? 'walk' : 'sit';
      if (pose === 'walk' && !moving) step = 0;
      renderCat(c, {
        pose: pose, step: step, pet: pet,
        tail: pet ? 0 : Math.round(Math.sin(c.tailT) * 2),
        ear: !reduce && t < c.earUntil ? c.earSide : 0,
        eyes: pet ? 'happy' : !playful ? 'sleep' : t < c.blinkUntil ? 'blink' : 'open'
      });

      var bob = moving && c.bounce ? (step % 4 < 2 ? -c.bounce : 0) : 0;
      var y = (c.ready && info ? c.y : Math.max(ledge, Math.min(H - s - ledge + s * 2.5 / 32, c.y))) + bob;
      c.el.style.transform = 'translate3d(' + Math.round(c.x) + 'px,' + Math.round(y) + 'px,0)';
    });
    if (SC) SC.cats = catBoxes;
    // light the cats like the scene: as they are at sunset, softly darker (and a touch cooler) at night; normal outside the hero
    var nt = info && info.W && SC.night ? Math.round(SC.night * 50) / 50 : 0;
    if (nt !== lastNight) {
      lastNight = nt;
      var f = nt ? 'brightness(' + (1 - 0.48 * nt).toFixed(2) + ') saturate(' + (1 - 0.4 * nt).toFixed(2) + ') hue-rotate(' + Math.round(-10 * nt) + 'deg)' : '';
      cats.forEach(function (c) { c.cv.style.filter = f; }); yarnEl.style.filter = f;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

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
  $('catToggle').addEventListener('click', function () { playful = !playful; setToggle(this, playful, playful ? 'Playful' : 'Sleepy'); });
  setToggle($('catToggle'), playful, playful ? 'Playful' : 'Sleepy');
})();
