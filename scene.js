/* Chibiro Coffee — hero backdrop.
   A pixel-art take on the real Chibiro: a two-storey white house in Taman Jaya with a carport,
   a red-awning porch with the red sofa, an upstairs balcony, grille windows and AC units. In
   front is a gravel yard of folding tables, mesh camping chairs and a dome tent.
   On either side are the neighbours (a blue house on
   the left, a white semi-D on the right), with power lines, a water tank and trees behind.
   Drawn on a low-res canvas and scaled up with crisp pixels. The café opens 3 PM to 12:08 AM, so
   it only cycles Sunset ⇄ Night, and the "Sky" button jumps to the other one. Visitors start on
   the phase that matches their local time. */
(function () {
  var hero = document.getElementById('top'), cvs = document.getElementById('scene'),
      copy = hero && hero.querySelector('.hero__copy');
  if (!hero || !cvs || !cvs.getContext) return;
  var ctx = cvs.getContext('2d');
  // reduce = hold the scene still: the visitor's reduce-motion setting, or Cat Mode "Sleepy" (app.js calls ChibiroScene.setPaused)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches, osReduce = reduce;

  /* ---------- Palettes: sky per phase; everything else is tinted by the phase ---------- */
  var NP = 2;   // Sunset, Night
  var RAW = [
    { skyTop: '#3d3a80', skyMid: '#c95f7c', skyLow: '#ffb35c', cloud: '#ffc490', cloudShade: '#c86c7c', sun: '#ffdc80', sunGlow: '#ff9a50',
      moon: '#f4ecd0', moonShade: '#c9c0a0', tint: '#8a4a6a', tintA: 0.3, glow: 0.55, stars: 0.18, sunGlowA: 0.85, birds: 1 },
    { skyTop: '#0a0c24', skyMid: '#181d48', skyLow: '#2c3064', cloud: '#363d72', cloudShade: '#232854', sun: '#ffdc80', sunGlow: '#ff9a50',
      moon: '#f6eed2', moonShade: '#c4bb9c', tint: '#12152e', tintA: 0.66, glow: 1, stars: 1, sunGlowA: 0, birds: 0 }
  ];
  var rgbCache = {};
  function rgb(h) { if (rgbCache[h]) return rgbCache[h]; var n = parseInt(h.slice(1), 16); return (rgbCache[h] = [n >> 16 & 255, n >> 8 & 255, n & 255]); }
  var PAL = RAW.map(function (p) { var o = {}; for (var k in p) o[k] = typeof p[k] === 'string' ? rgb(p[k]) : p[k]; return o; });
  function css(c, a) { return a == null ? 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' : 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function lerpC(a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; }
  function mix(f) {
    var i = Math.floor(f) % NP, j = (i + 1) % NP, a = f - Math.floor(f), A = PAL[i], B = PAL[j], o = { c: {}, s: {} };
    for (var k in A) {
      if (typeof A[k] === 'number') o[k] = A[k] + (B[k] - A[k]) * a;
      else { o.c[k] = lerpC(A[k], B[k], a); o.s[k] = css(o.c[k]); }
    }
    return o;
  }
  var P_ = null, tintCache = {};
  function T(hex) { // a daytime colour, shifted toward the current phase's light
    var v = tintCache[hex]; if (v) return v;
    return (tintCache[hex] = css(lerpC(rgb(hex), P_.c.tint, P_.tintA)));
  }
  var WARM = '#ffe9a8', COOL = '#a8c4f0';
  function lit(a) { return 'rgba(255,214,130,' + Math.max(0, Math.min(1, a)).toFixed(2) + ')'; }

  /* ---------- Timeline ---------- */
  var HOLDS = [5000, 15000], FADE = 4000;                 // sunset holds 5 s, night 15 s (Niekki), each with a 4 s fade into the next
  var STARTS = HOLDS.map(function (h, i) { return HOLDS.slice(0, i).reduce(function (a, b) { return a + b + FADE; }, 0); }), LOOP = STARTS[NP - 1] + HOLDS[NP - 1] + FADE;
  var hr = new Date().getHours();
  var clock = STARTS[(hr >= 6 && hr < 19) ? 0 : 1];
  function smooth(x) { return x * x * (3 - 2 * x); }
  function phase() {
    var e = ((clock % LOOP) + LOOP) % LOOP, seg = NP - 1; while (seg > 0 && e < STARTS[seg]) seg--;
    var w = e - STARTS[seg];
    return w < HOLDS[seg] ? seg : seg + smooth((w - HOLDS[seg]) / FADE);
  }

  /* ---------- Layout (rebuilt on resize) ---------- */
  var W = 0, H = 0, P = 3, skyTop = 0, panelB = 0, yardTop, yd;
  var NAP = [".................o........o...", "................obo......obo..", "......ooooooooooobpoooooopbo..", "....oobbbbbbbbbbobpbbssbbpbo..", "...obbsbbbsbbbsbsbbbbsbbbbo...", "..obbbsbbbsbbbsbsbbbbbbbbbbo..", ".obbbbbsbbbsbbbssbbbbbbbbbbo..", "obbbbbbbbbbbbbbbbbebbebebbeo..", "obbbbbbbbbbbbbbbbbbeewwbeebo..", "obbbbbbbbbbbbbbbbbkwwwnwwbko..", ".obbbbbbbssssssbbbbwwwwwwbo...", "..ossssssttttttsswwwwwwwwwo...", "..ottttttttttttttwwwwowwwwwo..", "..owwttttttttttttttttoooooo...", "...oooooottttttoooooo........."], nap = null;
  var house = {}, sign = {}, lot = {}, hills = [], shops = [], bgTrees = [], wires = [], tower = null, nbL = null, nbR = null;
  var furn = [], people = [], scene = [], tent = null, cpoles = [], strands = [], stars = [], clouds = [], birds = [], flies = [];
  var skyImg = null, gravel = null, path = null, statics = [], openStand = null;
  var fitK = 1, WH = 10, doorX = 0, walkB = 0, WG = null, WC = 3;
  function overlap(a, b) { return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; }
  // depth: things near the house are drawn a little smaller than things near the curb (fitK shrinks it all to fit narrow screens)
  function sc(y) { return fitK * (0.78 + 0.32 * clamp((y - yardTop) / yd, 0, 1)); }
  function walkX(y) { return doorX + (walkB - doorX) * clamp((y - yardTop) / Math.max(1, H - yardTop), 0, 1); }   // centre of the walkway
  function wbox(q, x, y) { y = y == null ? q.yb : y; var k = sc(y); return [x - 5 * k, y - 27 * k, x + 5 * k, y + 1]; }   // a walker's whole body
  function wcen(id) { return [(id % WG.cols) * WC + 1, Math.floor(id / WG.cols) * WC + 1]; }
  function wcell(x, y) { return clamp(Math.floor(y / WC), 0, WG.rows - 1) * WG.cols + clamp(Math.floor(x / WC), 0, WG.cols - 1); }
  // shared with the cat sprites: the art grid, everything they must keep clear of, and (sent back) where the cats are
  var API = window.ChibiroScene = { ver: 0, cats: [], holding: {}, pets: [], night: 0, info: function () {
    return { P: P, W: W, H: H, yardTop: yardTop, rect: cvs.getBoundingClientRect(), ver: API.ver, statics: statics, scale: sc,
             walkers: people.filter(function (q) { return q.pose === 'walk'; }).map(function (q) { return wbox(q, q.x); }) };
  } };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // the sign is about 10 screen px per letter pixel on every screen, so desktop matches phones
  function signSize() { var k = clamp(Math.min(Math.floor((W * 0.78 - 8) / 27), Math.floor((H * 0.16 - 6) / 5), Math.round(10 / P)), 2, 6); return { k: k, w: 27 * k + (k + 2) * 2, h: 5 * k + (k + 2) * 2 }; }
  // the gravel yard is a V: as wide as the house front at the porch, opening out toward the viewer at the curb
  function edgeL(y) { return Math.round(path.lt + (path.lb - path.lt) * clamp((y - yardTop) / yd, 0, 1)); }
  function edgeR(y) { return Math.round(path.rt + (path.rb - path.rt) * clamp((y - yardTop) / yd, 0, 1)); }

  function layout() {
    var R = rng(1208);
    yd = clamp(Math.round(H * 0.28), 40, 120);
    yardTop = H - yd;

    // the CHIBIRO sign floats on its own, centred in the upper part of the frame
    // a big ginger cat sleeps curled up on top of the CHIBIRO letters, over the left end; the sign moves down to make room
    var s = signSize(), cs = Math.max(1, Math.round(s.k * 0.4)), lift = NAP.length * cs - (s.k + 2) - cs;
    var sy = panelB + Math.max(4, Math.round((H - panelB) * 0.05)) + Math.max(0, lift);
    sign = { k: s.k, w: s.w, h: s.h, x: Math.round(W / 2 - s.w / 2), y: sy };
    nap = { cs: cs, x: sign.x + s.k + 2 + s.k, y: sign.y + (s.k + 2) - NAP.length * cs + cs };
    // the café house stands alone in the middle, below the sign
    var bwMax = W < 300 ? Math.round(W * 0.66) : Math.min(Math.round(W * 0.4), 190);
    var hh = clamp(yardTop - (sy + s.h) - 10, 50, 150);
    var bw = clamp(Math.round(hh * 1.3), 80, bwMax);
    hh = Math.min(hh, Math.round(bw / 1.05));
    var spare = yardTop - (sy + s.h) - 10 - hh;                                  // narrow screens: the house is held back by the width,
    if (spare > 16) { var add = Math.min(spare - 16, Math.round(H * 0.16)); yd += add; yardTop -= add; }   // so give the unused sky to the yard
    house = { x: Math.round(W / 2 - bw / 2), w: bw, h: hh, top: yardTop - hh };
    house.roofH = Math.max(7, Math.round(hh * 0.12));
    house.wallTop = house.top + house.roofH + 3;
    house.uH = Math.round((yardTop - house.wallTop) * 0.47);
    house.slab = house.wallTop + house.uH;
    house.porchX = house.x + bw;
    lot = { l: house.x - 4, r: house.x + bw + 10 };
    var spread = Math.round(W * (W < 300 ? 0.1 : 0.04));
    path = { lt: lot.l, rt: lot.r, lb: -spread, rb: W + spread };

    // the neighbours sit back, small and hazy, with a clear gap on each side of the café
    var nH = Math.round(hh * 0.58), nW = Math.round(bw * 0.6), gap = Math.max(14, Math.round(bw * 0.14));
    nbL = { x: lot.l - gap - nW, w: nW, h: nH, wall: '#8cb8de', awning: '#c0443a', seed: 3 };
    nbR = { x: lot.r + gap, w: nW, h: nH - 2, wall: '#efede6', awning: '#7f9fb4', seed: 7 };

    // distant hills, a few low shophouses, trees and the neighbour's water tank behind
    hills = []; var hmax = clamp((yardTop - skyTop) * 0.35, 8, 34);
    for (var x = 0; x < W; x++) hills.push(Math.round(hmax * (0.6 + 0.25 * Math.sin(x * 0.021 + 0.6) + 0.15 * Math.sin(x * 0.07 + 2))));
    shops = []; var smax = Math.max(8, Math.round(hh * 0.42));
    for (x = -4; x < W;) { var sw = 16 + Math.floor(R() * 14); shops.push({ x: x, w: sw, h: Math.round(smax * (0.7 + R() * 0.3)), col: ['#e8dccb', '#d6e0dc', '#e6d0c0', '#dcd4e2'][Math.floor(R() * 4)], seed: Math.floor(R() * 999) }); x += sw + 1; }
    bgTrees = [];
    for (x = 6; x < W; x += 22 + Math.floor(R() * 16)) { if (x > lot.l - 4 && x < lot.r + 4) continue; bgTrees.push({ x: x, r: 6 + Math.floor(R() * 6), y: yardTop - Math.round(hh * (0.5 + R() * 0.25)), seed: Math.floor(R() * 99) }); }
    tower = { x: nbR.x + Math.round(nbR.w * 0.55), top: yardTop - nbR.h - 14 };

    // power lines sweeping across the whole frame, from a pole at the left
    wires = []; var wy = Math.max(sign.y + sign.h + 4, house.top - 4);
    for (var i = 0; i < 3; i++) wires.push({ y1: wy + i * 3, y2: wy + i * 4 + 6, sag: 4 + i });

    // furniture in the yard: a 1×3 block of table sets on the left and a 3×3 block on the right, with a
    // paved walkway between them running from the front door toward the viewer. Everything is drawn at a
    // depth scale (sc): smaller near the house, larger near the curb.
    var small = W < 300;
    doorX = house.x + Math.round(house.w * 0.1) + 5;
    openStand = { x: doorX + 18, yb: yardTop + 4 };                             // on the porch slab, just right of the front door
    var G, CG, Lu, Ru, rowY = [], topMin = yardTop + 10, aisle = 0;
    function spacing(roomy) {                                                    // walkway half-width, walkway-to-set gap, gap between columns (set units);
      WH = roomy ? 10 : 7; G = roomy ? 6 : 3; CG = roomy ? 18 : 5;               // roomy leaves aisles wide enough to walk through
      Lu = WH + G + 46; Ru = WH + G + 138 + 2 * CG; aisle = roomy ? 0 : 1;   // compact (phones): no aisles between columns, so keep aisles between rows
    }
    function minGap() { return aisle ? Math.ceil(17 * fitK) : 0; }               // room for a cat to walk between two rows
    function stack(e) {                                                          // rows from the bottom edge up, each set clear of the row behind
      var y3 = H - 2, y2 = Math.floor(y3 - 27 * sc(y3) - 1 - e), y1 = Math.floor(y2 - 27 * sc(y2) - 1 - e);
      return [y1, y2, y3];
    }
    function blockFits(rows) {
      if (rows[0] - 27 * sc(rows[0]) < topMin) return false;
      var kb = sc(H - 2); walkB = clamp(Math.round(W / 2 - (Ru - Lu) / 2 * kb), Math.ceil(6 + Lu * kb), Math.floor(W - 6 - Ru * kb));
      return rows.every(function (y) { var k = sc(y), xw = walkX(y); return xw - Lu * k >= 6 && xw + Ru * k <= W - 6; });   // the corner poles keep the edges
    }
    function fit() { for (fitK = 1; fitK > 0.5; fitK -= 0.01) { rowY = stack(minGap()); if (blockFits(rowY)) break; } return fitK; }
    spacing(false); var tight = fit(); spacing(true);
    if (fit() < tight - 0.08) { spacing(false); fit(); }                        // narrow phones: the compact spacing keeps everything bigger
    var slack = rowY[0] - 27 * sc(rowY[0]) - topMin;                             // spare depth (phones): open up the aisles between rows
    for (var e = minGap() + Math.floor(slack / 2); e > minGap(); e--) { var ry = stack(e); if (blockFits(ry)) { rowY = ry; break; } }
    blockFits(rowY);
    furn = []; people = [];
    var seatLeft = small ? 4 : 6;
    rowY.forEach(function (ty) {
      var k = sc(ty), xw = walkX(ty), xs = [xw - (WH + G + 23) * k];
      for (var c = 0; c < 3; c++) xs.push(xw + (WH + G + 23 + c * (46 + CG)) * k);
      xs.forEach(function (x) {
        var fu = { x: Math.round(x), yb: ty, k: k, kind: 'set', flip: R() < 0.5, seed: Math.floor(R() * 99), who: [null, null] };
        for (var sd = 0; sd < 2; sd++) if (seatLeft > 0 && R() < 0.42) { fu.who[sd] = person(R, 'sit'); fu.who[sd].ph = R() * 6.3; seatLeft--; }
        furn.push(fu);
      });
    });
    // five more seated customers, filling tables in chatting pairs (own random stream, so the rest stays put)
    var R2 = rng(508), extra = 5;
    furn.forEach(function (f) { if (extra > 0 && !!f.who[0] !== !!f.who[1]) { var sd = f.who[0] ? 1 : 0; f.who[sd] = person(R2, 'sit'); f.who[sd].ph = R2() * 6.3; extra--; } });
    furn.forEach(function (f) { for (var sd = 0; sd < 2; sd++) if (extra > 0 && !f.who[sd]) { f.who[sd] = person(R2, 'sit'); f.who[sd].ph = R2() * 6.3; extra--; } });

    // the tent and the standing customers go wherever they fit beside the blocks, never on a set
    // a light pole in each bottom corner, each strung to the house
    var cpTop = Math.max(house.wallTop, house.slab - 6);
    cpoles = [{ x: 1, top: cpTop, base: H }, { x: W - 4, top: cpTop, base: H }];
    statics = [[openStand.x - 15, openStand.yb - 27, openStand.x + 15, openStand.yb + 1]].concat(cpoles.map(function (c) { return [c.x - 1, c.top, c.x + 4, c.base]; }));
    furn.forEach(function (f) { statics.push([f.x - 23 * f.k, f.yb - 26 * f.k, f.x + 23 * f.k, f.yb + 1]); });
    function free(b) { return b[0] >= 1 && b[2] <= W - 1 && !statics.some(function (s) { return overlap(b, s); }); }
    var y1 = rowY[0], k1 = sc(y1), gL = walkX(y1) - Lu * k1, gR = walkX(y1) + Ru * k1;
    tent = null; var tw = Math.round(Math.max(28, bw * 0.26) * k1), th = Math.round(tw * 0.62);
    [Math.round(gL - 5 - tw), Math.round(gR + 5)].some(function (tx) {
      var b = [tx - 1, y1 - th - 1, tx + tw + 1, y1 + 1];
      if (!free(b)) return false;
      tent = { x: tx, w: tw, h: th, base: y1 }; statics.push(b); return true;
    });
    function standAt(q, x, yb, tall) {                                          // place a standing customer, if they fit
      var k = sc(yb), b = [x - 6 * k, yb - tall * k, x + 6 * k, yb + 1];
      if (!free(b)) return false;
      q.x = Math.round(x); q.yb = yb; people.push(q); statics.push(b); return true;
    }
    var c = person(R, 'stand'); c.face = -1; c.cup = true; c.ph = R() * 6.3;     // someone with a takeaway cup at the porch
    standAt(c, Math.min(W - 6, house.x + house.w + 4), yardTop + 5, 27);
    var a = person(R, 'stand'), b2 = person(R, 'stand');                        // a pair chatting on their feet, beside the blocks
    a.face = 1; a.talker = 0; b2.face = -1; b2.talker = 1; b2.cup = true;
    [rowY[1], rowY[2], rowY[0]].some(function (yb) {
      var k = sc(yb), gr = walkX(yb) + Ru * k, gl = walkX(yb) - Lu * k;
      return [gr + 4 + 13 * k, gl - 4 - 13 * k].some(function (x) {
        var box = [x - 13 * k, yb - 35 * k, x + 13 * k, yb + 1];
        if (!free(box)) return false;
        a.x = Math.round(x - 6 * k); a.yb = yb; b2.x = Math.round(x + 6 * k); b2.yb = yb; people.push(a, b2); statics.push(box); return true;
      });
    });

    // walkers stroll anywhere in the yard (left/right and up/down: the walkway, the aisles between columns, the
    // strip in front of the porch and the sides), always keeping their whole body clear of furniture and people
    // (they may pass in front of the OPEN stand, whoever stands on the porch, so the yard stays one area)
    var block = statics.filter(function (o) { return o[3] > yardTop + 6; });
    var wc = Math.ceil(W / WC), wr = Math.ceil(H / WC), wf = new Uint8Array(wc * wr);
    for (var j = 0; j < wr; j++) for (var i = 0; i < wc; i++) {
      var fx = i * WC + 1, fy = j * WC + 1;
      if (fy < yardTop + 7 || fy > H - 2 || fx < 5 || fx > W - 5) continue;
      // walkers are drawn in depth order, so a table in front of them covers them naturally: only their feet must stay off
      // the ground under furniture and people (a 6px band at the base of each)
      var k = sc(fy), ft = [fx - 4 * k - 1, fy - 2, fx + 4 * k + 1, fy + 2];
      wf[j * wc + i] = block.some(function (o) { return overlap(ft, [o[0], o[3] - 6, o[2], o[3]]); }) ? 0 : 1;
    }
    var lab = new Int32Array(wf.length), best = 0, bestN = 0;                   // keep only the largest connected walkable area, so no one strolls into a dead-end pocket
    for (i = 0; i < wf.length; i++) if (wf[i] && !lab[i]) {
      var qq = [i], nl = i + 1; lab[i] = nl;
      for (var h2 = 0; h2 < qq.length; h2++) { var id2 = qq[h2], ci2 = id2 % wc; [id2 - 1, id2 + 1, id2 - wc, id2 + wc].forEach(function (m, d) { if (m < 0 || m >= wf.length || (d < 2 && Math.floor(m / wc) !== Math.floor(id2 / wc)) || !wf[m] || lab[m]) return; lab[m] = nl; qq.push(m); }); }
      if (qq.length > bestN) { bestN = qq.length; best = nl; }
    }
    for (i = 0; i < wf.length; i++) if (lab[i] !== best) wf[i] = 0;
    WG = { cols: wc, rows: wr, free: wf };
    var spots = []; for (i = 0; i < wf.length; i++) if (wf[i]) spots.push(i);
    (small ? [0] : [0, 1]).forEach(function (n) {
      var w = person(R, 'walk'), id = spots.length ? spots[Math.floor(R() * spots.length)] : 0, ce = wcen(id);
      w.x = ce[0]; w.yb = ce[1]; w.face = n ? -1 : 1; w.v = 6 + R() * 4; w.dist = 0; w.cup = n === 1; w.path = []; w.waitUntil = 0; w.blocked = 0;
      people.push(w);
    });
    scene = [{ yb: openStand.yb, sign: true }].concat(tent ? [{ yb: tent.base, tent: true }] : [])
      .concat(furn.map(function (f) { return { yb: f.yb, f: f }; })).concat(people.map(function (q) { return { yb: q.yb, q: q }; }));
    API.ver++;

    // fairy lights: only the strands from the corner poles to the house (the tall yard pole was removed at Niekki's request)
    var h = house, fy = h.wallTop - 1;
    strands = [];
    // each corner pole fans three strands to the house: up to the roof eave, to the awning corner, and in across the awning
    cpoles.forEach(function (c, side) {
      var ex = side ? h.x + h.w + 2 : h.x - 2, ix = h.x + Math.round(h.w * (side ? 0.7 : 0.3));
      strands.push([c.x + 1, c.top + 1, ex, fy, 10], [c.x + 1, c.top + 1, ex, h.slab + 1, 8], [c.x + 1, c.top + 1, ix, h.slab + 6, 6]);
    });

    // pre-render the gravel in daytime colours
    var gw = Math.max(1, W), gh = Math.max(1, H - yardTop);
    gravel = document.createElement('canvas'); gravel.width = gw; gravel.height = gh;
    var g = gravel.getContext('2d'), tones = ['#b9b09c', '#a79e8a', '#cbc3b0', '#968d7a', '#b2a994'];
    g.fillStyle = tones[0]; g.fillRect(0, 0, gw, gh);
    for (var yy = 0; yy < gh; yy++) for (var xx = 0; xx < gw; xx++) { var v = R(); if (v < 0.45) { g.fillStyle = tones[1 + Math.floor(v * 8.8) % 4]; g.fillRect(xx, yy, 1, 1); } }

    stars = []; var sBot = Math.max(skyTop + 6, house.top - 6), nS = Math.round(W * (sBot - skyTop) / 300);
    for (i = 0; i < nS; i++) {
      var st = { x: Math.floor(R() * W), y: Math.floor(skyTop + R() * (sBot - skyTop)), b: R() < 0.06, ph: R() * 6.3 };
      if (st.x > sign.x - 3 && st.x < sign.x + sign.w + 3 && st.y > sign.y - 3 && st.y < sign.y + sign.h + 3) continue;   // not behind the sign
      if (nap && st.x > nap.x - 3 && st.x < nap.x + 40 * nap.cs && st.y > nap.y - 14 * nap.cs && st.y < nap.y + NAP.length * nap.cs + 3) continue;   // or the sleeping cat and its Zzz
      stars.push(st);
    }
    clouds = []; var nC = Math.max(3, Math.round(W / 70));
    for (i = 0; i < nC; i++) clouds.push({ x: R() * (W + 40) - 20, y: Math.round(skyTop + 6 + R() * Math.max(6, (house.top - skyTop) * 0.45)), s: R() < 0.45 ? 2 : 1, v: 0.6 + R() * 0.9 });
    birds = []; for (i = 0; i < 3; i++) birds.push({ x: R() * W, y: skyTop + 8 + R() * Math.max(8, (house.top - skyTop) * 0.5), v: 4 + R() * 4, ph: R() * 2 });
    flies = []; for (i = 0; i < 7; i++) { var fy0 = yardTop + R() * yd; flies.push({ x: edgeL(fy0) + R() * (edgeR(fy0) - edgeL(fy0)), y: fy0 - 6, ph: R() * 6.3 }); }
    skyImg = ctx.createImageData(W, Math.max(1, yardTop));
  }

  function resize() {
    var cw = hero.clientWidth, ch = hero.clientHeight;
    if (!cw || !ch) return;
    P = cw < 768 ? 2 : 3;   // same pixel size as the cat sprites (64px / 96px cats = 2× / 3×)
    W = Math.ceil(cw / P); H = Math.ceil(ch / P);
    cvs.width = W; cvs.height = H;
    cvs.style.width = W * P + 'px'; cvs.style.height = H * P + 'px';
    var top = hero.getBoundingClientRect().top;
    panelB = copy ? clamp(Math.round((copy.getBoundingClientRect().bottom - top) / P) + 3, 0, Math.round(H * 0.7)) : 0;
    skyTop = cw < 768 ? panelB : 0;
    layout();
    draw(performance.now());
  }

  /* ---------- Drawing helpers ---------- */
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], OUT = '#2c1a12';
  // while SC_ is set, sprites are drawn scaled about their feet (SC_.ax, SC_.ay); every art pixel still lands on whole
  // canvas pixels, and is never thinner than one, so the pixel art stays crisp at any depth
  var SC_ = null;
  function rect(x, y, w, h, c) {
    ctx.fillStyle = c;
    if (!SC_) { ctx.fillRect(x, y, w, h); return; }
    var a = SC_, x0 = Math.round(a.ax + (x - a.ax) * a.k), x1 = Math.round(a.ax + (x + w - a.ax) * a.k), y0 = Math.round(a.ay + (y - a.ay) * a.k), y1 = Math.round(a.ay + (y + h - a.ay) * a.k);
    ctx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
  }
  function disc(cx, cy, r, c) {
    ctx.fillStyle = c;
    for (var y = -Math.ceil(r); y <= Math.ceil(r); y++) {
      var hw = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) + 0.35);
      if (hw > 0 || Math.abs(y) < r) ctx.fillRect(Math.round(cx) - hw, Math.round(cy) + y, hw * 2 + 1, 1);
    }
  }
  function softGlow(cx, cy, R, a, col) {
    col = col || '255,190,110'; // smooth warm radial glow, same as the footer lanterns
    if (a <= 0.01 || R < 1) return;
    var g = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, R);
    g.addColorStop(0, 'rgba(' + col + ',' + Math.min(1, a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = g; ctx.fillRect(Math.floor(cx - R), Math.floor(cy - R), Math.ceil(R * 2) + 1, Math.ceil(R * 2) + 1);
  }
  var lamps = [], litCv = document.createElement('canvas'), litCtx = litCv.getContext('2d');
  function lampLit(x, yb, fn) { // figures near a lit table catch its warm light on the side facing the lantern
    var k = sc(yb), cy = yb - 12 * k, near = P_.glow > 0.1 ? lamps.filter(function (l) { var dx = l.x - x, dy = l.y - cy; return dx * dx + dy * dy < l.r * l.r; }) : [];
    if (!near.length) return fn();
    if (litCv.width !== W || litCv.height !== H) { litCv.width = W; litCv.height = H; }
    var bx = Math.max(0, Math.floor(x - 24 * k)), by = Math.max(0, Math.floor(yb - 36 * k)), bw = Math.min(W, Math.ceil(x + 24 * k)) - bx, bh = Math.min(H, Math.ceil(yb + 3)) - by;
    if (bw <= 0 || bh <= 0) return fn();
    var main = ctx; litCtx.clearRect(bx, by, bw, bh); ctx = litCtx; fn(); ctx = main;
    litCtx.globalCompositeOperation = 'source-atop';
    near.forEach(function (l) {
      var g = litCtx.createRadialGradient(l.x, l.y, 0.5, l.x, l.y, l.r);
      g.addColorStop(0, 'rgba(255,178,92,' + (0.5 * P_.glow).toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(255,178,92,' + (0.18 * P_.glow).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,178,92,0)');
      litCtx.fillStyle = g; litCtx.fillRect(bx, by, bw, bh);
    });
    litCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(litCv, bx, by, bw, bh, bx, by, bw, bh);
  }
  function sag(x1, y1, x2, y2, d, fn) {
    var n = Math.max(1, Math.round(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))));
    for (var i = 0; i <= n; i++) { var t = i / n; fn(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t + d * 4 * t * (1 - t)), i); }
  }
  function key4(K, f) { var u = Math.floor(f), a = f - u, A = K[u], B = K[u + 1]; return [A[0] + (B[0] - A[0]) * a, A[1] + (B[1] - A[1]) * a, A[2] + (B[2] - A[2]) * a]; }
  var SUN = [[0.88, 0.8, 9], [0.95, 1.35, 9], [0.88, 0.8, 9]];   // y is a share of sky-top → horizon, so the sunset sun sits low
  var MOON = [[0.1, 1.9, 5], [0.9, 0.6, 5], [0.96, 1.9, 5]];
  var GLYPH = { C: [7, 4, 4, 4, 7], H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], B: [6, 5, 6, 5, 6], R: [6, 5, 6, 5, 5], O: [7, 5, 5, 5, 7], P: [6, 5, 6, 4, 4], E: [7, 4, 6, 4, 7], N: [6, 5, 5, 5, 5], Z: [7, 1, 2, 4, 7], L: [4, 4, 4, 4, 7], S: [7, 4, 7, 1, 7], D: [6, 5, 5, 5, 6] };
  function text(s, x, y, c, k) {
    k = k || 1; ctx.fillStyle = c;
    for (var i = 0; i < s.length; i++) { var g = GLYPH[s[i]]; for (var r = 0; r < 5; r++) for (var b = 0; b < 3; b++) if (g[r] >> (2 - b) & 1) ctx.fillRect(x + (i * 4 + b) * k, y + r * k, k, k); }
  }

  function drawSky(p, sun, moon) {
    var d = skyImg.data, hz = skyImg.height, top = p.c.skyTop, mid = p.c.skyMid, low = p.c.skyLow, bands = 10;
    var sg = p.c.sunGlow, mg = p.c.moon, sA = p.sunGlowA, mA = 0.35 * clamp((p.stars - 0.18) / 0.82, 0, 1), sR = sun[2] * 3.4, mR = moon[2] * 3;
    for (var y = 0; y < hz; y++) {
      var t = y / Math.max(1, hz - 1), v = t * bands, b0 = Math.floor(v), fr = v - b0;
      var c0 = grad(b0 / bands), c1 = grad(Math.min(bands, b0 + 1) / bands);
      for (var x = 0; x < W; x++) {
        var bay = BAYER[((y & 3) << 2) | (x & 3)], c = fr * 16 > bay ? c1 : c0, dx, dy, dd, a;
        if (sA > 0.01) { dx = x - sun[0]; dy = y - sun[1]; dd = Math.sqrt(dx * dx + dy * dy); if (dd < sR) { a = Math.pow(1 - dd / sR, 1.4) * sA; if (a * 16 > bay) c = lerpC(c, sg, a > 0.5 ? 0.7 : 0.45); } }
        if (mA > 0.01) { dx = x - moon[0]; dy = y - moon[1]; dd = Math.sqrt(dx * dx + dy * dy); if (dd < mR) { a = (1 - dd / mR) * mA; if (a * 16 > bay) c = lerpC(c, mg, 0.25); } }
        var i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    ctx.putImageData(skyImg, 0, 0);
    function grad(t) { return t < 0.55 ? lerpC(top, mid, t / 0.55) : lerpC(mid, low, (t - 0.55) / 0.45); }
  }
  function drawCloud(x, y, s, p) {
    var blobs = [[0, 0, 3], [4, -2, 4], [9, -1, 3.4], [13, 0, 2.6]];
    for (var k = 0; k < 2; k++) {
      var c = k ? p.s.cloud : p.s.cloudShade, o = k ? 0 : 1;
      for (var i = 0; i < blobs.length; i++) disc(x + blobs[i][0] * s, y + blobs[i][1] * s + o, blobs[i][2] * s, c);
      rect(Math.round(x - 2 * s), Math.round(y + o), Math.round(17 * s), Math.round(2 * s + 1), c);
    }
  }

  /* ---------- Building parts ---------- */
  function grilleWin(x, y, w, h, p, glow, diamond) { // window behind a metal security grille
    rect(x - 1, y - 1, w + 2, h + 2, T('#d8d4cc'));
    rect(x, y, w, h, glow > 0.3 ? css(lerpC(rgb('#3a4450'), rgb(diamond ? '#ffd28a' : '#b8d0f4'), Math.min(1, glow))) : T('#3e4854'));
    if (glow < 0.3) rect(x + 1, y + 1, Math.max(1, Math.floor(w / 3)), 1, T('#6a7684'));
    var gc = T('#f2f0ea');
    if (diamond) { for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) if ((xx + yy) % 6 === 0 || (xx - yy + 600) % 6 === 0) rect(x + xx, y + yy, 1, 1, gc); }
    else { for (var gx = x + 3; gx < x + w; gx += 4) rect(gx, y, 1, h, gc); for (var gy = y + 3; gy < y + h; gy += 5) rect(x, gy, w, 1, gc); rect(x + Math.floor(w / 2), y, 1, h, T('#d8d4cc')); }
  }
  function acUnit(x, y, p) {
    rect(x, y, 8, 6, T('#9a9a96')); rect(x, y, 8, 5, T('#e4e2dc'));
    disc(x + 3, y + 2, 1.6, T('#9a9a96')); rect(x + 3, y + 2, 1, 1, T('#5a5a58')); rect(x + 6, y + 1, 1, 3, T('#c4c2bc'));
  }
  function corrugated(x, y, w, h, base, rib) { rect(x, y, w, h, T(base)); for (var i = x + 1; i < x + w; i += 2) rect(i, y, 1, h, T(rib)); }

  function drawTwoStorey(n, p, side, haze) { // a neighbour's house, set back and softened by haze
    var x = n.x, w = n.w, base = yardTop, top = base - n.h, rh = 4, wt = top + rh + 2, slab = wt + Math.round((base - wt) * 0.48);
    for (var r = 0; r < rh; r++) rect(x - 5 + (rh - r), top + r, w + 10 - (rh - r) * 2, 1, T(side < 0 ? '#9a5040' : '#8a8a86'));
    rect(x - 6, top + rh, w + 12, 2, T(side < 0 ? '#c0443a' : '#c8c4bc'));
    rect(x, wt, w, base - wt, T(n.wall)); rect(side < 0 ? x + w - 2 : x, wt, 2, base - wt, 'rgba(44,26,18,0.12)');
    var nw = Math.max(1, Math.floor((w - 6) / 16));
    for (var i = 0; i < nw; i++) {
      var wx = x + 4 + i * 16, on = p.glow > 0.4 && (n.seed + i) % 3 !== 0;
      grilleWin(wx, wt + 4, 10, Math.max(6, Math.round((slab - wt) * 0.5)), p, on ? p.glow * 0.8 : 0, side > 0 && i % 2 === 0);
    }
    if (side > 0) acUnit(x + w - 14, wt + 3, p);
    rect(x - 1, slab, w + 2, 2, T('#d8d4cc'));
    corrugated(x - 2, slab + 3, w + 4, 3, n.awning, side < 0 ? '#9a3028' : '#5f7f94');
    for (var px = x + 3; px < x + w; px += 22) rect(px, slab + 6, 1, base - slab - 6, T('#f2f0ea'));
    rect(x + Math.round(w * 0.45), slab + 8, 9, base - slab - 8, T('#6a5040'));
    rect(x - 6, top, w + 12, base - top, haze);
  }

  function drawHouse(t, p) {
    var h = house, x = h.x, w = h.w, base = yardTop, glow = p.glow;
    rect(x - 2, h.wallTop, w + 4, base - h.wallTop, T('#f2f0ea')); rect(x - 2, h.wallTop, 1, base - h.wallTop, T('#d4d0c8'));
    rect(x - 1, h.wallTop, 2, base - h.wallTop, T('#d4d0c8')); rect(x + w - 2, h.wallTop, 2, base - h.wallTop, T('#dcd8d0'));
    rect(x + 2, h.wallTop, 1, base - h.wallTop, T('#c8c4bc'));                                         // downpipe
    var uy = h.wallTop + Math.max(2, Math.round(h.uH * 0.16)), uh = Math.max(8, Math.round(h.uH * 0.56));
    var upLit = glow > 0.35 ? glow * 0.75 : 0;

    var gy = h.slab + 4, gH = base - gy;
    drawRoof(h, p);

    // --- the café half
    acUnit(x + 6, uy, p); acUnit(x + 6, uy + 7, p);
    var lw = Math.max(12, Math.round(w * 0.24));
    grilleWin(x + 18, uy, lw, uh, p, upLit * 0.6, true);
    var bx = x + Math.round(w * 0.5), bwid = x + w - 5 - bx, dW = Math.max(7, Math.round(bwid * 0.3));
    grilleWin(bx + 2, uy - 1, dW, uh + 2, p, upLit, true);                                              // balcony door
    grilleWin(bx + dW + 6, uy, Math.max(8, bwid - dW - 6), uh, p, upLit * 0.8, true);
    var ry = h.slab - 7;
    rect(bx - 2, ry, bwid + 6, 1, T('#f8f6f0')); rect(bx - 2, ry + 1, bwid + 6, 1, T('#c8c4bc'));
    for (var rx = bx - 1; rx < bx + bwid + 4; rx += 2) rect(rx, ry + 2, 1, 5, T('#e8e6e0'));
    rect(x - 1, h.slab, w + 4, 3, T('#e4e0d8')); rect(x - 1, h.slab + 3, w + 4, 1, T('#b8b4ac'));
    // porch under the red corrugated awning
    rect(x, gy, w - 2, gH, T('#ece9e2'));
    var dw = 10, dh = Math.round(gH * 0.74), dx = x + Math.round(w * 0.1);
    // the front door stands open: a warm, lit interior with the door leaf swung inward
    rect(dx - 1, base - dh - 1, dw + 2, dh + 1, T('#c8c4bc'));
    var inside = css(lerpC(rgb('#e8b878'), rgb('#ffd890'), glow));
    rect(dx, base - dh, dw, dh, inside); rect(dx, base - 3, dw, 3, css(lerpC(rgb('#a8784a'), rgb('#d8a060'), glow)));   // floor
    rect(dx + 3, base - dh + 3, dw - 3, 1, 'rgba(120,70,40,0.35)');   // a pendant lamp's shade
    rect(dx + 3, base - Math.round(dh * 0.45), dw - 3, 1, T('#7a4a30')); rect(dx + 3, base - Math.round(dh * 0.45) + 1, dw - 3, Math.round(dh * 0.45) - 4, T('#9a6440'));   // counter
    rect(dx, base - dh, 3, dh, T('#7a3a2a')); rect(dx + 2, base - dh, 1, dh, T('#5a2a1e')); rect(dx + 1, base - Math.round(dh * 0.5), 1, 1, T('#e0b060'));   // open door leaf
    var wx = dx + dw + 8, wW = Math.max(12, x + w - 6 - wx), wy = gy + 6, wH = Math.max(7, Math.round(gH * 0.44));
    if (glow > 0.1) softGlow(wx + wW / 2, wy + wH / 2, wW * 1.4, glow * 0.4);
    grilleWin(wx, wy, wW, wH, p, glow > 0.1 ? glow : 0, true);
    if (glow > 0.1) for (var lb = wx - 1; lb < wx + wW + 1; lb += 2) { rect(lb, wy - 1, 1, 1, WARM); rect(lb, wy + wH, 1, 1, WARM); }
    var ay = gy + 1, aw = w + 8;
    var sw = Math.min(34, wW + 4), sx = wx + Math.round((wW - sw) / 2);                                // red L-sofa
    rect(sx, base - 9, sw, 3, T('#a02a24')); rect(sx, base - 6, sw, 5, T('#c0362c')); rect(sx, base - 1, sw, 1, T('#6a1a16'));
    rect(sx - 3, base - 8, 4, 7, T('#a02a24')); rect(sx + sw - 1, base - 8, 3, 7, T('#a02a24'));
    for (var c = sx + 7; c < sx + sw - 2; c += 8) rect(c, base - 6, 1, 4, T('#8a2420'));
    rect(sx + 3, base - 9, 4, 3, T('#7a2420'));                                                         // cushion
    rect(sx - 12, base - 5, 8, 1, T('#2e2a28')); rect(sx - 11, base - 4, 1, 4, T('#2e2a28')); rect(sx - 6, base - 4, 1, 4, T('#2e2a28'));
    rect(sx - 10, base - 7, 2, 2, T('#fdf6e3'));
    [dx - 6, dx + dw + 2].forEach(function (px) { rect(px, base - 5, 4, 5, T('#c0583e')); rect(px - 1, base - 9, 6, 4, T('#4f8a2a')); rect(px + 1, base - 11, 2, 2, T('#5a9a2e')); });
    if (glow > 0.2) rect(x, gy + 5, w - 2, gH - 5, lit(glow * 0.12));
    // the porch slab and red corrugated awning both reach forward, toward the viewer
    var sl = 6;
    for (var r = 0; r < sl; r++) { var e = Math.round(r * 1.6); rect(x - 4 - e, base + r, w + 10 + e * 2, 1, T(r === 0 ? '#e4e0d8' : r === sl - 1 ? '#b8b4ac' : '#cfcac0')); }
    var ad = 7, aL0 = x - 3, aR0 = x + w + 5, fL = aL0 - Math.round(ad * 1.7), fR = aR0 + Math.round(ad * 1.7), ribs = Math.round((aR0 - aL0) / 2);
    rect(fL + 1, ay + ad + 2, 1, base + sl - 1 - (ay + ad + 2), T('#f8f6f0')); rect(fR - 2, ay + ad + 2, 1, base + sl - 1 - (ay + ad + 2), T('#f8f6f0'));   // posts
    rect(fL + 2, ay + ad + 2, 1, base + sl - 1 - (ay + ad + 2), T('#c8c4bc')); rect(fR - 1, ay + ad + 2, 1, base + sl - 1 - (ay + ad + 2), T('#c8c4bc'));
    for (r = 0; r < ad; r++) {
      var u = r / (ad - 1), l = Math.round(aL0 + (fL - aL0) * u), rr = Math.round(aR0 + (fR - aR0) * u);
      rect(l, ay + r, rr - l, 1, T(r < 2 ? '#a83a30' : '#c0443a'));
      for (var q = 1; q < ribs; q++) rect(Math.round(l + (rr - l) * q / ribs), ay + r, 1, 1, T('#9a3028'));
    }
    rect(fL, ay + ad, fR - fL, 2, T('#7a2620')); rect(fL, ay + ad + 2, fR - fL, 1, 'rgba(44,26,18,0.3)');
    if (glow > 0.05) for (var ix = fL; ix < fR; ix += 3) { var len = 1 + ((ix * 7) % 3); for (var k = 0; k < len; k++) rect(ix, ay + ad + 2 + k, 1, 1, k === len - 1 ? WARM : 'rgba(255,233,168,0.4)'); }
    if (glow > 0.1) { softGlow(dx + dw / 2, base - 2, dw * 2, glow * 0.55); for (var sp = 0; sp < 4; sp++) rect(dx - sp, base + sp, dw + sp * 2, 1, 'rgba(255,214,130,' + (0.28 * glow * (1 - sp / 4)).toFixed(2) + ')'); }   // light spilling out
  }

  function drawRoof(h, p) { // a low hip roof whose eaves overhang toward the viewer: we see the fascia and the underside
    var x = h.x, w = h.w, L = x - 16, Rr = x + w + 16, ft = h.top + h.roofH - 3;
    for (var r = 0; r < h.roofH - 3; r++) { var ins = Math.round((h.roofH - 3 - r) * 3.4); rect(L + ins, h.top + r, Rr - L - ins * 2, 1, T(r % 2 ? '#8a5444' : '#7a4a3c')); }
    rect(L - 1, ft, Rr - L + 2, 3, T('#c0443a')); rect(L - 1, ft, Rr - L + 2, 1, T('#d8584a'));
    for (r = 0; r < 4; r++) { var ins2 = Math.round(r * 13 / 3); rect(L + ins2, ft + 3 + r, Rr - L - ins2 * 2, 1, T(r === 0 ? '#5a3a30' : '#6a4a3e')); }
    rect(x - 2, ft + 7, w + 4, 1, 'rgba(44,26,18,0.25)');
  }

  function drawSign(t, p) { // just the letters, floating, outlined so they read on any sky
    var k = sign.k, pad = k + 2, x = sign.x + pad, y = sign.y + pad + (reduce ? 0 : Math.round(Math.sin(t * 0.0012))), glow = p.glow;
    var sh = Math.max(1, k >> 1), o = Math.max(1, k >> 2);
    for (var dx = -o; dx <= o; dx++) for (var dy = -o; dy <= o; dy++) if (dx || dy) { text('CHIBIRO', x + dx, y + dy, T(OUT), k); text('CHIBIRO', x + sh + dx, y + sh + dy, T(OUT), k); }
    text('CHIBIRO', x + sh, y + sh, T('#b23a48'), k);
    text('CHIBIRO', x, y, css(lerpC([253, 246, 227], [255, 233, 168], glow)), k);
  }

  function drawNap(t, p) { // the sleeping cat: breathes slowly, with little Zs drifting up from its head
    if (!nap) return;
    var cs = nap.cs, bob = reduce ? 0 : Math.round(Math.sin(t * 0.0012)), x0 = nap.x, y0 = nap.y + bob, breath = !reduce && Math.sin(t * 0.0018) > 0.2 ? 1 : 0;
    var L = function (h) { return css(lerpC(rgb(h), P_.c.tint, P_.tintA * 0.45)); }, C = { o: OUT, e: OUT, b: L('#e8a060'), s: L('#c67a3a'), t: L('#d88a48'), w: L('#fff3e0'), p: L('#f2a0a0'), n: L('#d06a6a'), k: L('#f2b0a0') };   // lit softly, like the sign
    for (var r = 0; r < NAP.length; r++) for (var c = 0; c < NAP[r].length; c++) { var ch = NAP[r][c]; if (ch !== '.') { ctx.fillStyle = C[ch]; ctx.fillRect(x0 + c * cs, y0 + r * cs, cs, cs); } }
    if (breath) for (c = 1; c < 16; c++) {                                                // on each breath the back swells: its outline rises a touch and fur fills in below, so nothing splits apart
      for (r = 0; r < NAP.length && NAP[r][c] === '.'; r++);
      if (r >= NAP.length - 1 || NAP[r][c] !== 'o') continue;
      var d = Math.max(1, cs >> 1), below = NAP[r + 1][c];
      ctx.fillStyle = C[below === '.' ? 'o' : below]; ctx.fillRect(x0 + c * cs, y0 + r * cs, cs, cs);
      ctx.fillStyle = C.o; ctx.fillRect(x0 + c * cs, y0 + r * cs - d, cs, cs);
    }
    if (reduce) return;
    for (var i = 0; i < 3; i++) {                                                         // three Zs rise and fade in turn
      var ph = ((t / 2400) + i / 3) % 1, zk = Math.max(1, Math.round(cs * (0.5 + ph * 0.6)));
      var zx = Math.round(x0 + 24 * cs + ph * 18 * cs), zy = Math.round(y0 - 1 * cs - ph * 7 * cs);   // drifting off to the right, clear of the buttons
      ctx.globalAlpha = Math.max(0, Math.min(1, (1 - ph) * 1.6)) * (0.6 + 0.4 * (1 - p.glow * 0.3));
      text('Z', zx, zy, css(lerpC([253, 246, 227], [255, 233, 168], p.glow)), zk);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Yard ---------- */
  function drawGrounds(p) {
    // grass on either side of the yard
    rect(0, yardTop, W, yd, T('#8fae5a'));
    for (var x = 0; x < W; x += 2) rect(x, yardTop + ((x * 13) % Math.max(1, yd - 1)), 1, 1, T('#6f8e3a'));
    // the gravel path: a V that opens from the porch toward the curb, tinted for the time of day
    // and warmed by the fairy lights after dark
    var tint = p.tintA > 0.01 ? css(p.c.tint, p.tintA.toFixed(2)) : null, warm = p.glow > 0.05 ? 'rgba(255,190,110,' + (0.16 * p.glow).toFixed(2) + ')' : null, edge = T('#8a8272');
    var slab = T('#d6ccb6'), joint = T('#ab9f88'), course = 0, nextJ = yardTop + 3;
    for (var y = yardTop; y < H; y++) {
      var l = Math.max(0, edgeL(y)), r = Math.min(W, edgeR(y)), w = r - l;
      if (w <= 0) continue;
      ctx.drawImage(gravel, l, y - yardTop, w, 1, l, y, w, 1);
      // the paved walkway from the front door: square slabs that grow toward the viewer
      var k = sc(y), wc = walkX(y), wh = Math.max(4, Math.round((WH - 1.5) * k)), wl = Math.round(wc - wh), wr = Math.round(wc + wh);
      rect(wl, y, wr - wl, 1, slab);
      if (y >= nextJ) { rect(wl, y, wr - wl, 1, joint); course++; nextJ = y + Math.max(3, Math.round(wh * 0.9)); }
      else if (course % 2) rect(Math.round(wc), y, 1, 1, joint);
      rect(wl - 1, y, 1, 1, edge); rect(wr, y, 1, 1, edge);
      if (tint) rect(l, y, w, 1, tint);
      if (warm) rect(l, y, w, 1, warm);
      rect(l - 1, y, 2, 1, edge); rect(r - 1, y, 2, 1, edge);                                           // stone edging
    }
  }

  function drawFences(p) {
    // low boundary fences behind the grass: a white gate on the left, blue corrugated on the right
    var gl = lot.l - 4, gy = yardTop + 1;
    if (gl > 2) {
      rect(0, gy - 9, gl, 1, T('#f2f0ea')); rect(0, gy - 1, gl, 1, T('#f2f0ea'));
      for (var x = 1; x < gl; x += 2) rect(x, gy - 9, 1, 9, T('#e8e6e0'));
      rect(gl - 4, gy - 12, 4, 12, T('#b8483a')); rect(gl - 5, gy - 13, 6, 1, T('#f2f0ea'));
    }
    var fl = lot.r + 4, fy = yardTop - 10;
    if (fl < W - 2) { corrugated(fl, fy, W - fl, 11, '#8fb0cc', '#6f94b8'); rect(fl, fy, W - fl, 1, T('#5a7a98')); }
  }

  function drawTent(p) {
    var t = tent, cx = t.x + t.w / 2, rx = t.w / 2, ry = t.h;
    for (var y = 0; y < ry; y++) {
      var hw = Math.round(rx * Math.sqrt(1 - Math.pow((ry - y) / ry, 2)));
      rect(Math.round(cx - hw), t.base - ry + y, hw * 2, 1, T(y < 2 ? '#d8c09a' : '#c8aa80'));
    }
    var aw = Math.round(t.w * 0.26), ah = Math.round(ry * 0.72);                                    // two arched openings
    [cx - aw - 2, cx + 2].forEach(function (ax) {
      for (var y = 0; y < ah; y++) { var hw = Math.round((aw / 2) * Math.sqrt(1 - Math.pow((ah - y) / ah, 2))); rect(Math.round(ax + aw / 2 - hw), t.base - ah + y, hw * 2, 1, T('#5a4c3c')); }
      if (p.glow > 0.2) rect(Math.round(ax + aw / 2 - 1), t.base - Math.round(ah * 0.5), 2, 2, lit(p.glow));
    });
    rect(Math.round(cx), t.base - ry, 1, ry, T('#a88a64')); rect(t.x, t.base - 1, t.w, 1, T('#8a7050'));
    rect(t.x - 1, t.base - 3, 1, 3, T('#6a5a48')); rect(t.x + t.w, t.base - 3, 1, 3, T('#6a5a48'));
  }

  function drawChair(x, yb, face, p) { // folding camping chair, side view: X legs, sagging sling seat, armrest with cup holder, reclined back
    var f = face, m = T('#4a4a52'), mesh = T('#26262c'), trim = T('#d0783a');
    for (var k = 0; k < 6; k++) { rect(x - 4 * f + Math.round(k * 7 / 5) * f, yb - 1 - k, 1, 1, m); rect(x + 3 * f - Math.round(k * 7 / 5) * f, yb - 1 - k, 1, 1, m); }
    rect(x + 3 * f, yb - 11, 1, 5, m);                                                                // front post up to the armrest
    rect(f > 0 ? x - 4 : x - 3, yb - 7, 8, 1, mesh); rect(f > 0 ? x - 3 : x - 2, yb - 6, 6, 1, mesh); rect(f > 0 ? x - 4 : x - 3, yb - 7, 8, 1, trim);   // sling seat
    rect(f > 0 ? x - 4 : x - 3, yb - 11, 8, 1, mesh); rect(f > 0 ? x + 4 : x - 5, yb - 12, 2, 1, m); rect(f > 0 ? x + 4 : x - 5, yb - 11, 2, 1, mesh);   // armrest + cup holder
    for (var r = 0; r < 11; r++) {                                                                     // backrest leaning back
      var bx = x - 4 * f - Math.floor(r / 3) * f;
      rect(f > 0 ? bx - 1 : bx, yb - 8 - r, 2, 1, mesh); rect(f > 0 ? bx - 1 : bx + 1, yb - 8 - r, 1, 1, r === 10 ? trim : (r % 5 === 0 ? trim : mesh));
    }
    rect(f > 0 ? x - 8 : x + 6, yb - 19, 3, 1, trim);
  }
  function drawRollTable(x, yb, p) { // aluminium slat roll table with X legs, about 19px wide
    rect(x - 9, yb - 12, 19, 2, T('#b4b8bc')); for (var i = x - 8; i < x + 10; i += 2) rect(i, yb - 12, 1, 2, T('#8a8e94'));
    rect(x - 9, yb - 10, 19, 1, T('#6a6e74'));
    for (var k = 0; k < 9; k++) {
      var d = Math.round(k * 5 / 8);
      rect(x - 7 + d, yb - 9 + k, 1, 1, T('#7a7e84')); rect(x - 2 - d, yb - 9 + k, 1, 1, T('#7a7e84'));
      rect(x + 3 + d, yb - 9 + k, 1, 1, T('#7a7e84')); rect(x + 8 - d, yb - 9 + k, 1, 1, T('#7a7e84'));
    }
  }
  function drawFurniture(f, p, t) {
    SC_ = { ax: f.x, ay: f.yb, k: f.k };
    var sx = f.kind === 'set' ? 14 : 6, faces = f.kind === 'set' ? [1, -1] : (f.flip ? [-1, 1] : [1, -1]);
    for (var sd = 0; sd < 2; sd++) {
      var x = f.x + (sd ? sx : -sx); drawChair(x, f.yb, faces[sd], p);
      var q = f.who[sd]; if (!q) continue;
      q.x = x; q.yb = f.yb; q.face = faces[sd];
      q.sipping = !reduce && Math.sin(t * 0.0011 + q.ph) > 0.82;
      var chat = f.who[0] && f.who[1] && !reduce && Math.floor(t / 2600 + f.seed) % 2 === sd;
      var po = { sip: q.sipping && !chat, mouth: chat && Math.floor(t / 200) % 2 === 0, gesture: chat && !q.sipping && Math.floor(t / 900) % 2 === 0, bubble: chat && Math.floor(t / 2600 + f.seed) % 4 < 2 && f.seed % 2 === 0 };
      lampLit(x, f.yb, function () { drawPerson(q, t, po); });
    }
    if (f.kind === 'set') {
      drawRollTable(f.x, f.yb, p);
      cup(f.x - 2, f.yb - 15);
      for (sd = 0; sd < 2; sd++) if (f.who[sd] && !f.who[sd].sipping) cup(f.x + (sd ? 5 : -7), f.yb - 15);
      if ((f.who[0] || f.who[1]) && p.glow > 0.1) rect(f.x + 1, f.yb - 16, 2, 4, '#ffd06c');
    }
    SC_ = null;
  }
  function wPlan(q, t) { // pick a reachable spot a little way off and walk there around the furniture
    var from = wcell(q.x, q.yb);
    if (!WG.free[from]) { var best = -1, bd = 1e9; for (var i = 0; i < WG.free.length; i++) if (WG.free[i]) { var c0 = wcen(i), dd = Math.abs(c0[0] - q.x) + Math.abs(c0[1] - q.yb); if (dd < bd) { bd = dd; best = i; } } if (best < 0) return; from = best; }
    var cols = WG.cols, n = WG.free.length, prev = new Int32Array(n).fill(-2), dist = new Int32Array(n), qu = [from], pool = [];
    prev[from] = -1;
    for (var h = 0; h < qu.length; h++) {
      var id = qu[h], ci = id % cols, cj = (id - ci) / cols;
      if (dist[id] >= 10 && dist[id] <= 70) pool.push(id);
      for (var dj = -1; dj <= 1; dj++) for (var di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        var ni = ci + di, nj = cj + dj; if (ni < 0 || nj < 0 || ni >= cols || nj >= WG.rows) continue;
        var m = nj * cols + ni; if (!WG.free[m] || prev[m] !== -2) continue;
        if (di && dj && (!WG.free[cj * cols + ni] || !WG.free[nj * cols + ci])) continue;   // no cutting corners
        prev[m] = id; dist[m] = dist[id] + 1; qu.push(m);
      }
    }
    for (var tries = 0; tries < 10 && pool.length; tries++) {
      var to = pool[Math.floor(Math.random() * pool.length)], c = wcen(to);
      if (people.some(function (o) { return o !== q && o.dest && Math.abs(o.dest[0] - c[0]) < 16 && Math.abs(o.dest[1] - c[1]) < 8; })) continue;
      var path = []; for (var k = to; k !== -1 && k !== from; k = prev[k]) path.unshift(wcen(k));
      q.path = path; q.dest = c; q.blocked = 0; return;
    }
    q.waitUntil = t + 1000;
  }
  function drawStander(q, t, dt) {
    var o = {};
    if (q.pose === 'walk') {
      var still = true;
      if (!reduce && q.petUntil && t < q.petUntil) { o.bend = true; o.pat = Math.floor(t / 260) % 2; API.holding[q.petCat] = t + 250; }
      else if (!reduce) {
        if (q.petUntil) { q.petUntil = 0; q.cool = t + 6000; q.path = []; q.waitUntil = 0; }                      // done petting: stroll off somewhere else
        if (!q.path.length && t > q.waitUntil) wPlan(q, t);
        if (q.path.length) {
          var wp = q.path[0], dx = wp[0] - q.x, dy = wp[1] - q.yb, d = Math.sqrt(dx * dx + dy * dy) || 0.001, mv = Math.min(d, q.v * sc(q.yb) * dt / 1000);
          var nx = q.x + dx / d * mv, ny = q.yb + dy / d * mv, dir = Math.abs(dx) > 0.2 ? (dx > 0 ? 1 : -1) : q.face;
          var nb = wbox(q, nx + dir * 2, ny), cur = wbox(q, q.x), hc = -1, under = false, wait = false;
          API.cats.forEach(function (cb, ci) {
            if (!cb) return;
            var mx = (cb[0] + cb[2]) / 2, my = (cb[1] + cb[3]) / 2, bx = (nb[0] + nb[2]) / 2, by = (nb[1] + nb[3]) / 2, cx = (cur[0] + cur[2]) / 2, cy = (cur[1] + cur[3]) / 2;
            if (overlap(cur, cb)) { under = true; if (Math.abs(bx - mx) + Math.abs(by - my) <= Math.abs(cx - mx) + Math.abs(cy - my)) wait = true; }   // a cat at their feet: only step away from it
            else if (hc < 0 && overlap(nb, cb)) hc = ci;
          });
          if (!under && hc >= 0) {                                                                                       // a cat in the way
            var cb = API.cats[hc];
            if (Math.abs(cb[3] - q.yb) <= 5 && t > (q.cool || 0)) { q.petUntil = t + 3200; q.petCat = hc; API.pets.push(hc); q.face = (cb[0] + cb[2]) / 2 > q.x ? 1 : -1; o.bend = true; o.pat = 0; }   // right beside them: crouch and pet
            else wait = true;
          }
          var nf = wbox(q, nx, ny);                                                                                       // never walk into another walker
          if (!o.bend && people.some(function (w) { if (w === q || w.pose !== 'walk') return false; var f2 = wbox(w, w.x); return overlap([nf[0] - 2, nf[1], nf[2] + 2, nf[3] + 1], f2) && Math.abs(nx - w.x) + Math.abs(ny - w.yb) < Math.abs(q.x - w.x) + Math.abs(q.yb - w.yb); })) wait = true;
          if (o.bend) {}
          else if (wait && under) {                                                                                       // tangled up with a cat: sidestep straight away from it
            var cat = API.cats.filter(function (cb) { return cb && overlap(cur, cb); })[0], ex = q.x - (cat[0] + cat[2]) / 2, ey = (q.yb - 13 * sc(q.yb)) - (cat[1] + cat[3]) / 2, el = Math.sqrt(ex * ex + ey * ey) || 1;
            var sx2 = q.x + ex / el * Math.max(mv, 0.5), sy2 = q.yb + ey / el * Math.max(mv, 0.5);
            if (WG.free[wcell(sx2, sy2)]) { if (Math.abs(ex) > 0.2) q.face = ex > 0 ? 1 : -1; q.x = sx2; q.yb = sy2; q.dist += mv; q.path = []; q.waitUntil = t + 400; still = false; }
            else { q.blocked += dt; if (q.blocked > 1500) { q.path = []; q.waitUntil = t + 300; q.blocked = 0; } }
          }
          else if (wait) { q.blocked += dt; if (q.blocked > 1500) { q.path = []; q.waitUntil = t + 300; q.blocked = 0; } }   // give way, then go somewhere else
          else {
            q.x = nx; q.yb = ny; q.dist += mv; q.face = dir; q.blocked = 0; still = false;
            if (mv >= d - 0.001) { q.path.shift(); if (!q.path.length) { q.dest = null; q.waitUntil = t + 1500 + Math.random() * 4000; } }   // arrived: linger a moment
          }
        }
      }
      o.step = still ? 0 : Math.floor(q.dist / 2.5) % 4; o.cup = q.cup && !o.bend;
      if (still && !o.bend && q.cup && !reduce) { o.sip = Math.sin(t * 0.0009 + q.ph) > 0.8; o.cup = !o.sip; }
    } else if (q.talker != null) {
      var turn = Math.floor(t / 2600) % 2 === q.talker && !reduce;
      o.mouth = turn && Math.floor(t / 200) % 2 === 0; o.gesture = turn && Math.floor(t / 700) % 2 === 0;
      o.bubble = turn && Math.floor(t / 2600) % 4 < 2; o.cup = q.cup && !o.gesture;
    } else { o.sip = !reduce && Math.sin(t * 0.0009 + q.ph) > 0.8; o.cup = !o.sip; }
    var ax = Math.round(q.x), ay = Math.round(q.yb), dq = Object.create(q);
    dq.x = ax; dq.yb = ay; SC_ = { ax: ax, ay: ay, k: sc(q.yb) };
    lampLit(ax, ay, function () { drawPerson(dq, t, o); });
    SC_ = null;
  }

  /* ---------- Customers ---------- */
  var SKIN = ['#f1c9a5', '#e2b48c', '#c98e62', '#a8724a', '#7e5236'], HAIR = ['#2a1a14', '#3e281c', '#1c1c22', '#6a4028', '#4a3a34'],
      SHIRT = ['#e8d46a', '#5a8ac0', '#c05050', '#f2f0ea', '#6aa060', '#d08ab0', '#e08a3a', '#7a6ab0', '#3a8a8a'],
      PANTS = ['#3a4a6a', '#2e2e34', '#6a5a48', '#5a6a8a', '#8a7a62'], STYLE = ['short', 'short', 'long', 'bun', 'cap'];
  function pick(R, a) { return a[Math.floor(R() * a.length)]; }
  function person(R, pose) {
    return { pose: pose, skin: pick(R, SKIN), hair: pick(R, HAIR), style: pick(R, STYLE), shirt: pick(R, SHIRT), pants: pick(R, PANTS),
             cap: pick(R, ['#c0443a', '#2e4a7a', '#e8d46a']), face: 1, ph: R() * 6.3 };
  }
  function cup(x, y) { rect(x, y, 2, 3, T('#fdf6e3')); rect(x, y, 2, 1, T('#6b4a3a')); }
  // a little person about 25 art pixels tall, feet at (x, yb); pose is stand, walk or sit (on a chair facing `face`)
  function drawPerson(o, t, opt) {
    opt = opt || {};
    var f = o.face, cx = Math.round(o.x), yb = o.yb, sit = o.pose === 'sit';
    if (opt.bend) return drawCrouch(o, opt);
    var hy = sit ? yb - 24 : yb - 25, by = hy + 7, hx = f > 0 ? cx - 2 : cx - 3, ex = f > 0 ? hx + 4 : hx + 1, fx = f > 0 ? cx + 2 : cx - 2;
    var skin = T(o.skin), shirt = T(o.shirt), pants = T(o.pants), shoe = T('#2a2224'), dark = 'rgba(30,20,30,0.28)';
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
    var hb = f > 0 ? hx : hx + 4, hc = T(o.hair);
    rect(hx, hy, 6, 2, hc); rect(hb, hy + 2, 2, o.style === 'long' ? 8 : 3, hc);
    if (o.style === 'bun') rect(f > 0 ? hx - 1 : hx + 5, hy - 1, 2, 2, hc);
    if (o.style === 'cap') { rect(hx, hy - 1, 6, 2, T(o.cap)); rect(f > 0 ? hx + 6 : hx - 2, hy, 2, 1, T(o.cap)); }
    rect(ex, hy + 3, 1, 1, T(OUT));
    if (opt.mouth) rect(ex, hy + 5, 1, 1, T('#9a4a40'));
    // front arm: resting, gesturing, holding a cup or sipping from it
    var arm = T('#' + lerpC(rgb(o.shirt), [30, 20, 30], 0.25).map(function (v) { return (256 + v).toString(16).slice(1); }).join(''));
    if (opt.sip) { rect(fx, by + 1, 1, 2, arm); rect(fx + f, by, 1, 1, skin); cup(f > 0 ? hx + 6 : hx - 2, hy + 4); }
    else if (opt.cup) { rect(fx, by + 1, 1, 4, arm); rect(fx + f, by + 5, 1, 1, skin); cup(f > 0 ? fx + 2 : fx - 3, by + 3); }
    else if (opt.gesture) { rect(fx, by + 1, 1, 2, arm); rect(fx + f, by + 3, 1, 1, arm); rect(fx + 2 * f, by + 2, 1, 1, skin); }
    else if (!sit) { rect(fx, by + 1, 1, 6, arm); rect(fx, by + 7, 1, 1, skin); }
    else { rect(fx, by + 1, 1, 4, arm); rect(fx + f, by + 5, 2, 1, arm); rect(fx + 3 * f, by + 5, 1, 1, skin); }
    if (opt.bubble) {                                                                                    // a little "…" speech bubble
      var bx = f > 0 ? hx + 4 : hx - 7, byy = hy - 7;
      rect(bx, byy, 9, 5, T('#fffdf7')); rect(bx + (f > 0 ? 1 : 6), byy + 5, 2, 1, T('#fffdf7'));
      for (var dd = 0; dd < 3; dd++) rect(bx + 2 + dd * 2, byy + 2, 1, 1, T('#6b4a3a'));
    }
  }

  function drawCrouch(o, opt) { // squatting on one knee, leaning in and patting the cat in front of them
    var f = o.face, cx = Math.round(o.x), yb = o.yb, skin = T(o.skin), shirt = T(o.shirt), pants = T(o.pants), shoe = T('#2a2224'), hc = T(o.hair);
    rect(f > 0 ? cx - 3 : cx + 2, yb - 6, 2, 4, pants); rect(f > 0 ? cx - 6 : cx + 2, yb - 2, 5, 2, pants);              // back leg: knee down, shin along the ground
    rect(f > 0 ? cx - 7 : cx + 6, yb - 2, 1, 2, shoe);
    rect(f > 0 ? cx - 1 : cx - 3, yb - 7, 5, 2, pants); rect(f > 0 ? cx + 2 : cx - 3, yb - 5, 2, 4, pants);                 // front leg: thigh and shin
    rect(f > 0 ? cx + 2 : cx - 4, yb - 1, 3, 1, shoe);
    var by = yb - 13;
    for (var r = 0; r < 7; r++) rect(cx - 2 + (r < 2 ? 2 * f : r < 4 ? f : 0), by + r, 5, 1, shirt);                     // body leaning in
    var hx = (f > 0 ? cx - 1 : cx - 4) + 2 * f, hy = by - 6;
    rect(hx, hy + 1, 6, 5, skin); rect(hx, hy, 6, 2, hc); rect(f > 0 ? hx : hx + 4, hy + 2, 2, o.style === 'long' ? 6 : 2, hc);
    if (o.style === 'cap') { rect(hx, hy - 1, 6, 2, T(o.cap)); rect(f > 0 ? hx + 6 : hx - 2, hy, 2, 1, T(o.cap)); }
    if (o.style === 'bun') rect(f > 0 ? hx - 1 : hx + 5, hy - 1, 2, 2, hc);
    rect(f > 0 ? hx + 4 : hx + 1, hy + 4, 1, 1, T(OUT));                                                                 // eye, looking down at the cat
    var pat = opt.pat || 0;
    for (var k = 0; k < 4; k++) rect(cx + (3 + k) * f, by + 2 + Math.round(k * 0.75), 1, 1, shirt);                      // arm reaching out
    rect(f > 0 ? cx + 7 : cx - 8, by + 4 + pat, 2, 1, skin);                                                              // hand, patting
  }

  // Is the café open right now in Malaysia (UTC+8)? Tuesday to Sunday, 3:08 PM to 12:08 AM; closed all Monday (Sunday's night runs past midnight).
  function cafeOpen() {
    var d = new Date(Date.now() + 8 * 3600000), day = d.getUTCDay(), m = d.getUTCHours() * 60 + d.getUTCMinutes();
    if (m >= 15 * 60 + 8) return day !== 1;
    if (m < 8) return (day + 6) % 7 !== 1;
    return false;
  }
  function drawOpenStand(t, p) { // a neon sign on a little stand at the foot of the porch: OPEN or CLOSED lights up, the other word stays dark
    var glow = p.glow, nW = 27, nH = 16, nX = openStand.x - 13, yb = openStand.yb, nY = yb - 25, open = cafeOpen();
    var flick = reduce || Math.sin(t * 0.0031) > -0.96 || Math.floor(t / 70) % 2 === 0, on = 0.55 + 0.45 * glow;
    var gc = open ? '255,90,160' : '255,74,58', gy = open ? nY + 4 : nY + 11;
    if (glow > 0.1 && flick) { softGlow(nX + nW / 2, gy, 18, glow * 0.4, gc); softGlow(openStand.x, yb, 12, glow * 0.22, gc); }
    var leg = T('#4a4a52');
    rect(nX + 4, nY + nH, 1, yb - nY - nH, leg); rect(nX + nW - 5, nY + nH, 1, yb - nY - nH, leg);              // stand legs
    rect(nX + 2, yb - 1, 5, 1, leg); rect(nX + nW - 7, yb - 1, 5, 1, leg); rect(nX + 4, yb - 5, nW - 8, 1, leg);  // feet and crossbar
    rect(nX, nY, nW, nH, T('#1e1822'));
    var tube = flick ? css(lerpC(rgb(open ? '#c0507a' : '#b04040'), rgb(open ? '#ff5aa8' : '#ff5a4a'), on)) : T('#5a3a4a');
    var lit = flick ? css(lerpC(rgb(open ? '#d06a40' : '#c03a30'), rgb(open ? '#ff9a5a' : '#ff6a50'), on)) : T('#5a3a3a'), dark = T('#43303a');
    rect(nX, nY, nW, 1, tube); rect(nX, nY + nH - 1, nW, 1, tube); rect(nX, nY, 1, nH, tube); rect(nX + nW - 1, nY, 1, nH, tube);
    text('OPEN', nX + 6, nY + 2, open ? lit : dark, 1);
    text('CLOSED', nX + 2, nY + 9, open ? dark : lit, 1);
    rect(nX + 13, nY - 2, 1, 2, T('#2a2624'));                                                                    // power cord to the house
  }

  function drawCornerPoles(p) { // taller, thicker poles up front: wood post, a cap and a bracket for the strand
    cpoles.forEach(function (c) {
      rect(c.x, c.top, 3, c.base - c.top, T('#7a5a40')); rect(c.x + 2, c.top, 1, c.base - c.top, T('#5a4030')); rect(c.x, c.top, 1, c.base - c.top, T('#9a7656'));
      rect(c.x - 1, c.top - 1, 5, 1, T('#4a3428'));
    });
  }

  function drawStrands(t, p) {
    var on = p.glow > 0.05, wire = 'rgba(70,62,58,' + (0.3 + 0.3 * p.glow).toFixed(2) + ')';
    strands.forEach(function (s, si) {
      sag(s[0], s[1], s[2], s[3], s[4], function (x, y, i) {
        if (i % 4 === 0) {
          var tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 0.005 + i * 1.3 + si);
          if (on) { if (p.glow > 0.3 && i % 8 === 0) softGlow(x + 0.5, y + 0.5, 9, 0.42 * p.glow * tw); rect(x, y, 1, 1, 'rgba(255,236,176,' + (0.35 + 0.65 * p.glow * tw).toFixed(2) + ')'); }
          else rect(x, y, 1, 1, 'rgba(250,246,232,0.55)');
        } else if (i % 2 === 0) rect(x, y, 1, 1, wire);
      });
    });
  }

  /* ---------- Frame ---------- */
  var lastT = 0;
  function draw(t) {
    if (!W) return;
    var f = phase(), p = mix(f), dt = Math.min(200, t - lastT || 16); lastT = t;
    P_ = p; tintCache = {};
    var horizon = yardTop - 2, span = Math.max(10, house.top - skyTop);
    var sk = key4(SUN, f), mk = key4(MOON, f);
    // on phones the house fills the width, so the sun sets at the right edge
    var narrow = W < 300, sun = [(narrow ? sk[0] + 0.07 : sk[0]) * W, skyTop + sk[1] * (narrow ? 0.7 : 1) * (horizon - skyTop), sk[2]], moon = [mk[0] * W, skyTop + mk[1] * span, mk[2]];

    drawSky(p, sun, moon);
    if (p.stars > 0.02) for (var i = 0; i < stars.length; i++) {
      var s = stars[i], tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 0.002 + s.ph);
      ctx.globalAlpha = p.stars * tw; rect(s.x, s.y, 1, 1, '#fffdf7');
      if (s.b) { ctx.globalAlpha *= 0.35; rect(s.x - 1, s.y, 3, 1, '#fffdf7'); rect(s.x, s.y - 1, 1, 3, '#fffdf7'); }
    }
    ctx.globalAlpha = 1;
    var night = clamp((p.stars - 0.18) / 0.82, 0, 1); API.night = night;                                              // 0 at sunset, 1 at night: never both sun and moon
    if (night < 0.99 && sun[1] < horizon + sun[2]) { ctx.globalAlpha = 1 - night; disc(sun[0], sun[1], sun[2], p.s.sun); disc(sun[0] - 1, sun[1] - 1, sun[2] - 2, css(lerpC(p.c.sun, [255, 253, 247], 0.4))); ctx.globalAlpha = 1; }
    if (night > 0.01 && moon[1] < horizon + moon[2]) {
      ctx.globalAlpha = night;
      disc(moon[0], moon[1], moon[2], p.s.moon);
      var mx = Math.round(moon[0]), my = Math.round(moon[1]);
      rect(mx - 2, my - 1, 2, 2, p.s.moonShade); rect(mx + 1, my + 2, 2, 1, p.s.moonShade); rect(mx + 2, my - 3, 1, 1, p.s.moonShade);
      ctx.globalAlpha = 1;
    }
    for (i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      if (!reduce) { cl.x += cl.v * dt / 1000; if (cl.x > W + 20) cl.x = -40; }
      drawCloud(cl.x, cl.y, cl.s, p);
    }
    // backdrop: hazy hills, low shophouses, trees and the water tank
    var hz = css(lerpC(lerpC(rgb('#9fb8c8'), p.c.skyLow, 0.35), p.c.tint, p.tintA * 0.8));
    for (var x = 0; x < W; x++) rect(x, horizon - hills[x], 1, hills[x] + 2, hz);
    shops.forEach(function (sh) {
      var top = yardTop - sh.h; rect(sh.x, top, sh.w, sh.h, T(sh.col)); rect(sh.x, top, sh.w, 1, T('#a89a88'));
      for (var wy = top + 3; wy < yardTop - 6; wy += 7) for (var wx = sh.x + 2; wx < sh.x + sh.w - 3; wx += 5) rect(wx, wy, 3, 3, p.glow > 0.4 && (sh.seed + wx + wy) % 4 === 0 ? lit(p.glow * 0.8) : T('#8a98a4'));
    });
    bgTrees.forEach(function (tr) { disc(tr.x, tr.y + 1, tr.r, T('#3a6624')); disc(tr.x - 1, tr.y, tr.r - 1, T('#4f8030')); rect(tr.x - 3, tr.y - tr.r + 3, 3, 1, T('#6a9a40')); rect(tr.x, tr.y + tr.r, 2, yardTop - tr.y - tr.r, T('#5a4a3a')); });
    if (tower.x + 12 < W) {
      var tb = yardTop - 2, tt = tower.top;
      rect(tower.x, tt + 10, 1, tb - tt - 10, T('#a8acb0')); rect(tower.x + 9, tt + 10, 1, tb - tt - 10, T('#a8acb0'));
      for (var ty = tt + 12; ty < tb; ty += 6) for (var q = 0; q < 6; q++) { rect(tower.x + 1 + q + (q > 3 ? 1 : 0), ty + q, 1, 1, T('#8a8e94')); rect(tower.x + 8 - q, ty + q, 1, 1, T('#8a8e94')); }
      rect(tower.x - 1, tt, 12, 10, T('#c8ccd0')); rect(tower.x - 1, tt + 3, 12, 1, T('#a0a4a8')); rect(tower.x - 1, tt + 7, 12, 1, T('#a0a4a8')); rect(tower.x, tt - 1, 10, 1, T('#e0e2e4'));
    }
    // power lines and their pole
    rect(3, wires[0].y1 - 2, 2, yardTop - wires[0].y1 + 2, T('#5c4a3a')); rect(0, wires[0].y1 - 1, 9, 1, T('#5c4a3a'));
    wires.forEach(function (w) { sag(4, w.y1, W + 2, w.y2, w.sag, function (x, y) { rect(x, y, 1, 1, T('#2a2624')); }); });
    // neighbours, grounds, fences, then the café
    var haze = css(lerpC(p.c.skyLow, p.c.skyMid, 0.4), 0.42);
    drawTwoStorey(nbL, p, -1, haze); drawTwoStorey(nbR, p, 1, haze);
    drawGrounds(p);
    drawFences(p);
    drawHouse(t, p);
    lamps = scene.filter(function (it) { return it.f && it.f.kind === 'set' && (it.f.who[0] || it.f.who[1]); }).map(function (it) { var f = it.f; return { x: f.x + 2 * f.k, y: f.yb - 13 * f.k, r: 34 * f.k }; });
    if (p.glow > 0.1) lamps.forEach(function (l) { softGlow(l.x, l.y, l.r, 0.6 * p.glow); });   // lantern light on the ground, under every set so it never washes over nearer ones
    scene.sort(function (m, n) { return (m.q ? m.q.yb : m.yb) - (n.q ? n.q.yb : n.yb); });   // walkers move in depth, so re-sort each frame
    scene.forEach(function (it) { if (it.sign) drawOpenStand(t, p); else if (it.tent) drawTent(p); else if (it.f) drawFurniture(it.f, p, t); else drawStander(it.q, t, dt); });
    drawCornerPoles(p);
    drawStrands(reduce ? 0 : t, p);
    drawSign(reduce ? 0 : t, p);
    drawNap(reduce ? 0 : t, p);
    if (p.birds > 0.05 && !reduce) {
      ctx.globalAlpha = p.birds * (1 - p.stars);
      birds.forEach(function (bd) {
        bd.x += bd.v * dt / 1000; if (bd.x > W + 8) bd.x = -8;
        var up = Math.floor(t / 180 + bd.ph) % 2, bx = Math.round(bd.x), by = Math.round(bd.y);
        (up ? [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]] : [[0, 2], [1, 1], [2, 2], [3, 1], [4, 2]]).forEach(function (pt) { rect(bx + pt[0], by + pt[1], 1, 1, OUT); });
      });
      ctx.globalAlpha = 1;
    }
    if (p.stars > 0.3) flies.forEach(function (fl) {
      var fx = Math.round(fl.x + (reduce ? 0 : Math.sin(t * 0.0007 + fl.ph) * 6)), fy = Math.round(fl.y + (reduce ? 0 : Math.sin(t * 0.0011 + fl.ph * 2) * 3));
      ctx.globalAlpha = (p.stars - 0.3) / 0.7 * (reduce ? 0.8 : 0.5 + 0.5 * Math.sin(t * 0.004 + fl.ph));
      rect(fx, fy, 1, 1, '#eaf78c'); ctx.globalAlpha = 1;
    });
  }

  // The loop only runs while the hero is on screen and the scene isn't held still; off screen it stops completely.
  var visible = true, last = 0, prevT = 0, running = false;
  function start() { if (running || reduce || !visible) return; running = true; prevT = performance.now(); requestAnimationFrame(loop); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(hero);
  function loop(t) {
    if (!visible || reduce) { running = false; return; }
    clock += Math.min(100, t - prevT || 0); prevT = t;
    if (t - last >= 66) { last = t; draw(t); }
    requestAnimationFrame(loop);
  }
  API.setPaused = function (p) {                          // Cat Mode "Sleepy" freezes the whole scene where it is
    reduce = osReduce || !!p;
    if (reduce) draw(performance.now()); else start();
  };
  if ('ResizeObserver' in window) { var ro = new ResizeObserver(resize); ro.observe(hero); if (copy) ro.observe(copy); }
  else window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  resize();
  start();
})();
