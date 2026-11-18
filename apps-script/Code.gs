/**
 * @OnlyCurrentDoc
 * (Lets this script open only the Google Sheet it is attached to, never your other files.)
 */

/**
 * Chibiro Coffee: Cat Stamp Card backend (Google Apps Script, bound to a Google Sheet).
 * Built on the same system as the Chillbah Route Card, with Chibiro's own rules and look.
 *
 * How it stays safe
 * - No personal details. A card is a random code that lives on the customer's phone. The sheet keeps only a
 *   one-way fingerprint (SHA-256) of that code, the member number, the stamps and dates.
 * - Only staff can add stamps or give free drinks. Those actions run only for the Google account that owns
 *   this script, signed in on the café phone (Google checks the password and 2-step verification).
 * - The public web app can do two things with a card code: look the card up (so it updates live), and delete
 *   that card when the customer taps "Delete my card". A deleted card stops working at once and is logged as
 *   "deleted"; its row is kept for DELETE_GRACE_DAYS (so staff can restore it if it was deleted by mistake, or by
 *   someone who saw its QR code), then the nightly clean-up erases it for good.
 *
 * Rules
 * - 10 stamps = one free drink. Each stamp is one of the ten Chibiro cats. One visit is stamped per card
 *   per day (Kota Kinabalu time).
 * - Every card gets a member number (No.0001, No.0002, ...) with its first stamp. The number stays with the
 *   card for good, even after free drinks or an expiry.
 * - A card expires 1 month after its last stamp. If no new stamp is added by then, the unfinished card clears.
 * - Cards with no activity for 6 months are deleted, except a full card: its free drink waits for the customer.
 *
 * Setup: see STAMP-CARD-SETUP (the guide). Two deployments of this same script:
 *   Public: Execute as Me, Who has access: Anyone       → its URL goes in the site's config.js as api
 *   Staff:  Execute as Me, Who has access: Only myself  → its URL goes in the site's config.js as staff
 *   (config.js is read by both the main page and the staff scanner, so each link is written in one place only)
 */

var TZ = "Asia/Kuching";
var CARD_SIZE = 10;
var EXPIRE_MONTHS = 1;   // an unfinished card clears this many months after its LAST stamp
var KEEP_DAYS = 183;     // delete cards with no activity for about 6 months (never a full card with a free drink waiting)
var DELETE_GRACE_DAYS = 7;   // a card the customer deleted can be restored by staff for this many days, then it is erased
// The café phone's QR scanner on the website. The staff page links back to it for the next customer.
var SCANNER_URL = "https://nyleworks.github.io/Chibiro-Coffee/staff.html";

// The ten cat stamps, in order (the same cats as on the website)
var CATS = ["Calico", "Orange Tabby", "Siamese", "Tuxedo", "Scottish Fold",
  "Black Cat", "Tortoiseshell", "Grey Tabby", "Snow", "Ginger & White"];

// Drinks staff can pick when giving a free drink (from the menu on the website)
var DRINKS = ["Strawberry Matcha Latte", "Strawberry Cloud Matcha", "Tiramisu Latte", "Mont Blanc", "Sunset Americano",
  "Strawberricano", "Espresso Tonic", "Dirty Latte", "Strawberry Spanish Latte", "Mango Cafe Latte", "Chocolate Clouds",
  "Americano", "Cafe Latte", "Spanish Latte", "Mocha", "Caramel Latte", "Hazelnut Latte", "French Vanilla Latte",
  "Strawberry Cafe Latte", "Blueberry Latte", "Hot Americano", "Hot Cafe Latte", "Hot Spanish Latte", "Hot Mocha Latte",
  "Espresso", "Matcha Latte", "Hot Matcha Latte", "Blueberry Matcha", "Mango Matcha", "Matcha Cream Taro", "Taro Latte",
  "Hot Taro Latte", "Strawberry Cream Taro", "Chocolate", "Hot Chocolate Latte", "Triple Chocolate", "Strawberry Chocolate",
  "Peach Zest Tea", "Passion Zest Tea"];

var CARD_HEADERS = ["card", "member", "stamps", "stampDates", "lastStampDate", "freeDrinks", "createdAt", "lastActivity", "cardStart", "deletedAt"];
var LOG_HEADERS = ["time", "date", "member", "event", "stampNumber", "cat", "weekday", "hour", "drink", "daysToFill"];

// ---------------------------------------------------------------------------------------------------------
// Run once from the editor: creates the tabs, the Summary formulas and the nightly clean-up.
// ---------------------------------------------------------------------------------------------------------
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(TZ);
  var cards = ensureSheet_(ss, "Cards", CARD_HEADERS);
  cards.getRange("A:J").setNumberFormat("@");          // codes and dates stay as text
  var log = ensureSheet_(ss, "Log", LOG_HEADERS);
  log.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm");
  log.getRange("B:D").setNumberFormat("@");
  log.getRange("F:G").setNumberFormat("@");
  log.getRange("I:I").setNumberFormat("@");
  restyle();

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "housekeeping") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("housekeeping").timeBased().everyDays(1).atHour(4).inTimezone(TZ).create();
  Logger.log("Done. Staff actions will only work for " + Session.getEffectiveUser().getEmail() + ".");
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  } else if (sh.getLastColumn() < headers.length) {   // a tab made by an older version: add the new column headings
    var have = Math.max(1, sh.getLastColumn());
    sh.getRange(1, have + 1, 1, headers.length - have).setValues([headers.slice(have)]);
  }
  return sh;
}

// Summary layout. SHADOW_ROWS are 5 px tall (the pixel shadows under the boxes), so no figure may sit in them.
var SHADOW_ROWS = [14, 23, 28, 30];
var HOURS = [15, 16, 17, 18, 19, 20, 21, 22, 23, 0];   // opening hours, 3 PM to the 12 AM hour (the café closes at 12:08 AM)
var HOUR_ROWS = rowsBetween_(17, 29, 11);               // the 10 hours plus "Other hours"
var DRINK_ROWS = rowsBetween_(5, 29, 22);               // room for the 22 most-given free drinks
function rowsBetween_(from, to, n) {
  var out = [];
  for (var r = from; r <= to && out.length < n; r++) if (SHADOW_ROWS.indexOf(r) < 0) out.push(r);
  return out;
}
function hourLabel_(h) { return (h % 12 || 12) + (h < 12 ? " AM" : " PM"); }

function buildSummary_(ss) {
  var sh = ss.getSheetByName("Summary") || ss.insertSheet("Summary", 0);
  sh.clear();
  sh.getBandings().forEach(function (b) { b.remove(); });
  sh.clearConditionalFormatRules();
  var visit = 'Log!D2:D="stamp"';
  var c = function (ev) { return '=COUNTIF(Log!D2:D, "' + ev + '")'; };
  // A4:B13 is also shown on the staff page (staffSummary), so keep those 10 rows where they are.
  var stats = [
    // ROWS(UNIQUE(FILTER())) inside IFERROR gives 0 on an empty Log (COUNTUNIQUE would count FILTER's #N/A as 1)
    ["Members (cards with a number)", '=IFERROR(ROWS(UNIQUE(FILTER(Log!C2:C, ' + visit + ', Log!C2:C<>""))), 0)'],
    ["Active members, last 30 days", '=IFERROR(ROWS(UNIQUE(FILTER(Log!C2:C, ' + visit + ', Log!C2:C<>"", Log!A2:A>=NOW()-30))), 0)'],
    ["Stamps this week (from Monday)", '=COUNTIFS(Log!D2:D, "stamp", Log!A2:A, ">="&(TODAY()-WEEKDAY(TODAY(), 3)))'],
    ["Stamps this month", '=COUNTIFS(Log!D2:D, "stamp", Log!A2:A, ">="&(EOMONTH(TODAY(), -1)+1))'],
    ["Stamps, all time", c("stamp")],
    ["Free drinks this month", '=COUNTIFS(Log!D2:D, "free_drink", Log!A2:A, ">="&(EOMONTH(TODAY(), -1)+1))'],
    ["Free drinks, all time", c("free_drink")],
    ["Cards that expired unfinished", c("expired")],
    ["Average days to fill a card", '=IFERROR(ROUND(AVERAGEIF(Log!D2:D, "free_drink", Log!J2:J), 1), "-")'],
    ["Newest member number", '=IFERROR(TEXT(MAX(ARRAYFORMULA(VALUE(FILTER(Log!C2:C, Log!C2:C<>"")))), "0000"), "-")']
  ];
  var days = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) {
    return [d, '=COUNTIFS(Log!D2:D, "stamp", Log!G2:G, "' + d + '")'];
  });
  var cats = CATS.map(function (name, i) {
    return [(i + 1) + ". " + name, '=COUNTIFS(Log!D2:D, "stamp", Log!E2:E, ' + (i + 1) + ')'];
  });

  // Layout: title bar, then boxes in columns A:B, E:F and I:J. Narrow columns C, G, K carry the pixel drop
  // shadow; D and H are gaps. SHADOW_ROWS are the thin shadow rows under the boxes.
  sh.getRange("A1").setValue("CHIBIRO CAT STAMP CARD");
  sh.getRange("A2").setValue("Updates by itself from the Log tab. Please don't edit this tab.");
  sh.getRange("A3").setValue("The numbers");
  sh.getRange(4, 1, stats.length, 2).setValues(stats);
  sh.getRange("A16").setValue("Stamps by day (open Tue–Sun)");
  sh.getRange(17, 1, days.length, 2).setValues(days);
  sh.getRange("E3").setValue("Cats collected");
  sh.getRange(4, 5, cats.length, 2).setValues(cats);
  sh.getRange("E16").setValue("Stamps by hour");
  // One row per opening hour, 3 PM through to the 12 AM hour (so midnight comes last, not first), then any other hour.
  // The rows step around SHADOW_ROWS (the thin shadow rows under the boxes in A:B), so no hour is ever squashed out of sight.
  var hourCells = [];
  HOURS.forEach(function (h, i) {
    var r = HOUR_ROWS[i];
    sh.getRange(r, 5, 1, 2).setValues([[hourLabel_(h), '=COUNTIFS(Log!D2:D, "stamp", Log!H2:H, ' + h + ')']]);
    hourCells.push("F" + r);
  });
  var other = HOUR_ROWS[HOURS.length];
  sh.getRange(other, 5, 1, 2).setValues([["Other hours", '=COUNTIF(Log!D2:D, "stamp")-SUM(' + hourCells.join(",") + ')']]);
  sh.getRange("I3").setValue("Free drinks by drink");
  sh.getRange("A25").setValue("Deleted cards");
  sh.getRange(26, 1, 2, 2).setValues([["Deleted by customers, all time", '=COUNTIF(Log!D2:D, "deleted")-COUNTIF(Log!D2:D, "restored")'],
    ["Deleted this month", '=COUNTIFS(Log!D2:D, "deleted", Log!A2:A, ">="&(EOMONTH(TODAY(), -1)+1))']]);
  // The drinks list is worked out in hidden columns M:N, then shown row by row in I:J, stepping around SHADOW_ROWS.
  sh.getRange("M1").setFormula("=IFERROR(QUERY(Log!D2:I, \"select I, count(D) where D = 'free_drink' and I <> '' group by I order by count(D) desc label I 'Drink', count(D) 'Free drinks'\", 0), \"\")");
  sh.getRange(4, 9, 1, 2).setValues([["Drink", "Free drinks"]]);
  DRINK_ROWS.forEach(function (r, k) {
    var src = k + 2;   // M2 holds the most-given drink, M3 the next, and so on
    sh.getRange(r, 9, 1, 2).setFormulas([['=IF(LEN(M' + src + '), M' + src + ', ' + (k ? '""' : '"None yet"') + ')', '=IF(LEN(M' + src + '), N' + src + ', "")']]);
  });
  sh.hideColumns(13, 2);
  styleSummary_(sh);
}

// ---------------------------------------------------------------------------------------------------------
// Look: the website's pixel style (cream paper, roast-brown outlines, strawberry and matcha, pixel fonts,
// hard drop shadows). Run restyle() from the editor any time to repaint all three tabs. It never touches data.
// ---------------------------------------------------------------------------------------------------------
var LOOK = {
  cream: "#fdf6e3", paper: "#f4e4c1", paper2: "#e8d3a6", roast: "#2c1a12", soft: "#6b4a3a",
  matcha: "#6b8e23", matchaDeep: "#4a6b14", foam: "#dce8b8", berry: "#e57373", berryDeep: "#b23a48", milk: "#f9d5d0",
  ginger: "#e8943a", pixel: "Press Start 2P", body: "Pixelify Sans"
};

function restyle() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  buildSummary_(ss);
  var cards = ss.getSheetByName("Cards"), log = ss.getSheetByName("Log");
  if (cards) styleTable_(cards, CARD_HEADERS.length, LOOK.matchaDeep, LOOK.cream, [250, 80, 70, 300, 110, 90, 190, 190, 190, 190]);
  if (log) { styleTable_(log, LOG_HEADERS.length, LOOK.berry, LOOK.roast, [140, 100, 80, 110, 100, 130, 80, 60, 200, 90]); styleLog_(log); }
  if (cards) cards.getRange("B2:B").setFontFamily(LOOK.pixel).setFontSize(9).setFontColor(LOOK.berryDeep).setHorizontalAlignment("center");
}

function paint_(sh) {
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns())
    .setBackground(LOOK.cream).setFontFamily(LOOK.body).setFontColor(LOOK.roast).setFontSize(11).setVerticalAlignment("middle");
}

// A boxed panel: thick roast outline, a coloured pixel-font header row, and a hard roast shadow right and below.
function box_(sh, row, col, rows, cols, headBg, headInk) {
  var all = sh.getRange(row, col, rows, cols);
  all.setBackground(LOOK.paper);
  all.setBorder(true, true, true, true, null, null, LOOK.roast, SpreadsheetApp.BorderStyle.SOLID_THICK);
  if (rows > 2) sh.getRange(row + 1, col, rows - 1, cols).setBorder(null, null, null, null, null, true, LOOK.paper2, SpreadsheetApp.BorderStyle.DASHED);
  sh.getRange(row, col, 1, cols).setBackground(headBg).setFontColor(headInk).setFontFamily(LOOK.pixel).setFontSize(9)
    .setBorder(null, null, true, null, null, null, LOOK.roast, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.getRange(row + 1, col + cols, rows, 1).setBackground(LOOK.roast);
  sh.getRange(row + rows, col + 1, 1, cols).setBackground(LOOK.roast);
}

function styleSummary_(sh) {
  paint_(sh);
  sh.setTabColor(LOOK.berry);
  var W = { 1: 300, 2: 90, 3: 5, 4: 18, 5: 220, 6: 80, 7: 5, 8: 18, 9: 220, 10: 90, 11: 5 };
  for (var k in W) sh.setColumnWidth(Number(k), W[k]);
  // Title bar across the top, like the site's nav
  sh.setRowHeight(1, 56);
  sh.getRange("A1:K1").setBackground(LOOK.roast).setBorder(true, true, true, true, null, null, LOOK.roast, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.getRange("A1").setFontFamily(LOOK.pixel).setFontSize(16).setFontColor(LOOK.cream);
  sh.getRange("A2").setFontColor(LOOK.soft);
  sh.setRowHeight(2, 30);
  [3, 16].forEach(function (r) { sh.setRowHeight(r, 32); });
  SHADOW_ROWS.forEach(function (r) { sh.setRowHeight(r, 5); });   // includes 28, under Deleted cards, and 30, under the tall boxes
  sh.setRowHeight(15, 16);
  // Boxes in column A:B
  box_(sh, 3, 1, 11, 2, LOOK.berry, LOOK.roast);
  box_(sh, 16, 1, 7, 2, LOOK.foam, LOOK.roast);
  [[4, 10], [17, 6]].forEach(function (b) {
    sh.getRange(b[0], 2, b[1], 1).setFontFamily(LOOK.pixel).setFontSize(11).setFontColor(LOOK.matchaDeep).setHorizontalAlignment("right");
    for (var r = b[0]; r < b[0] + b[1]; r++) sh.setRowHeight(r, 28);
  });
  // Deleted cards (A25:B27): customers who tapped "Delete my card" on the website
  sh.setRowHeight(25, 32);
  box_(sh, 25, 1, 3, 2, LOOK.milk, LOOK.berryDeep);
  sh.getRange(26, 2, 2, 1).setFontFamily(LOOK.pixel).setFontSize(11).setFontColor(LOOK.berryDeep).setHorizontalAlignment("right");
  [26, 27].forEach(function (r) { sh.setRowHeight(r, 28); });
  // Cats collected (E3:F13) and the two query boxes
  box_(sh, 3, 5, 11, 2, LOOK.matchaDeep, LOOK.cream);
  sh.getRange(4, 6, 10, 1).setFontFamily(LOOK.pixel).setFontSize(11).setFontColor(LOOK.berryDeep).setHorizontalAlignment("right");
  box_(sh, 16, 5, 14, 2, LOOK.ginger, LOOK.roast);
  box_(sh, 3, 9, 27, 2, LOOK.milk, LOOK.roast);
  // Stamps by hour (E17:F29) and Free drinks by drink (I4:J29): only their own rows are formatted, never past the box
  sh.getRange(4, 9, 1, 2).setFontFamily(LOOK.pixel).setFontSize(7).setFontColor(LOOK.soft).setBackground(LOOK.paper2);
  [[HOUR_ROWS, 6], [DRINK_ROWS, 10]].forEach(function (q) {
    q[0].forEach(function (r) { sh.getRange(r, q[1]).setFontFamily(LOOK.pixel).setFontSize(10).setFontColor(LOOK.matchaDeep).setHorizontalAlignment("right"); });
  });
}

// Cards and Log: pixel-font header bar, cream rows banded like the menu cards, roast outline and shadow.
function styleTable_(sh, cols, headBg, headInk, widths) {
  paint_(sh);
  sh.setTabColor(headBg);
  sh.getBandings().forEach(function (b) { b.remove(); });
  var rows = sh.getMaxRows();
  var table = sh.getRange(1, 1, rows, cols);
  table.setBackground(null);
  table.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    .setHeaderRowColor(headBg).setFirstRowColor(LOOK.cream).setSecondRowColor(LOOK.paper);
  table.setBorder(true, true, true, true, true, null, LOOK.paper2, SpreadsheetApp.BorderStyle.SOLID);
  table.setBorder(true, true, true, true, null, null, LOOK.roast, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.getRange(1, 1, 1, cols).setFontFamily(LOOK.pixel).setFontSize(8).setFontColor(headInk)
    .setBorder(null, null, true, null, null, null, LOOK.roast, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sh.setRowHeight(1, 36);
  sh.setFrozenRows(1);
  // Hard shadow strip beside the table
  if (sh.getMaxColumns() <= cols) sh.insertColumnAfter(cols);
  sh.setColumnWidth(cols + 1, 5);
  sh.getRange(2, cols + 1, rows - 1, 1).setBackground(LOOK.roast);
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
}

// Log: colour each event (stamp = matcha, free drink = strawberry, expired = paper).
function styleLog_(sh) {
  var ev = sh.getRange("D2:D");
  ev.setFontFamily(LOOK.pixel).setFontSize(7);
  var rule = function (text, bg, ink) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(text).setBackground(bg).setFontColor(ink).setRanges([ev]).build();
  };
  sh.setConditionalFormatRules([
    rule("stamp", LOOK.foam, LOOK.matchaDeep), rule("free_drink", LOOK.berry, LOOK.roast), rule("expired", LOOK.paper2, LOOK.soft),
    rule("deleted", LOOK.milk, LOOK.berryDeep), rule("restored", LOOK.foam, LOOK.matchaDeep)
  ]);
  sh.getRange("C2:C").setFontFamily(LOOK.pixel).setFontSize(8).setFontColor(LOOK.berryDeep).setHorizontalAlignment("center");
  sh.getRange("E2:E").setHorizontalAlignment("center");
}

// ---------------------------------------------------------------------------------------------------------
// Web app entry points
// ---------------------------------------------------------------------------------------------------------

// GET: the staff page (only for the owner's Google account), otherwise a plain status reply.
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (isStaff_()) return staffPage_(validCode_(p.card) ? p.card : "");
  return json_({ ok: true, service: "chibiro-cat-stamp-card" });
}

// POST from the website: look up a card by its code, or delete it (the customer tapped "Delete my card").
function doPost(e) {
  try {
    var body = (e && e.postData && e.postData.contents) || "{}";
    if (body.length > 200) return json_({ ok: false, error: "bad_request" });   // a real lookup is about 60 characters
    var req = JSON.parse(body);
    if (req.action === "card") return json_(lookup_(req.card));
    if (req.action === "delete") return json_(deleteCard_(req.card));
    return json_({ ok: false, error: "bad_request" });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Each answer is kept for a few seconds, so a busy café (or someone hammering the link) reads the sheet far less.
// Staff actions clear the card's saved answer straight away, so a new stamp still shows at once.
// A code with no card yet (a brand-new card, or a made-up code) is kept longer, so made-up codes can't keep the sheet busy.
// Sheet reads are also capped per minute: past the cap, lookups get "busy" for the rest of that minute (the page retries).
var LOOKUP_CACHE_SECONDS = 5, UNKNOWN_CACHE_SECONDS = 30, SHEET_READS_PER_MINUTE = 600;
function lookup_(code) {
  if (!validCode_(code)) return { ok: false, error: "bad_card" };
  var id = fingerprint_(code), cache = CacheService.getScriptCache(), saved = cache.get("v:" + id);
  if (saved) return JSON.parse(saved);
  if (!sheetReadAllowed_(cache)) return { ok: false, error: "busy" };
  var found = findCard_(cardsSheet_(), id), out;
  if (found && found.data.deletedAt) out = { ok: true, card: view_(blankCard_("")), deleted: true, restoreUntil: restoreUntil_(found.data) };
  else out = { ok: true, card: view_(found ? found.data : blankCard_("")) };
  cache.put("v:" + id, JSON.stringify(out), found ? LOOKUP_CACHE_SECONDS : UNKNOWN_CACHE_SECONDS);
  return out;
}
// A rough count of sheet reads this minute (no lock: an exact count isn't needed, only a ceiling)
function sheetReadAllowed_(cache) {
  var key = "reads:" + Math.floor(Date.now() / 60000), n = Number(cache.get(key) || 0);
  if (n >= SHEET_READS_PER_MINUTE) return false;
  cache.put(key, String(n + 1), 120);
  return true;
}
function forget_(code) { CacheService.getScriptCache().remove("v:" + fingerprint_(code)); }

// "Delete my card" on the website: only someone holding the card's code can do this. The card stops working at once
// and the Log gets a "deleted" row (member number and how many stamps it had), so it shows in the sheet. The row stays,
// marked with deletedAt, for DELETE_GRACE_DAYS: staff can restore it in that time (staffRestore), in case it was deleted
// by mistake or by someone who saw the card's QR code. Then housekeeping erases the row for good.
// The member number is never handed out again (nextMember_ also reads the Log).
function deleteCard_(code) {
  if (!validCode_(code)) return { ok: false, error: "bad_card" };
  return withLock_(function () {
    var sh = cardsSheet_(), found = findCard_(sh, fingerprint_(code)), until = null;
    if (found) {
      var c = found.data, now = new Date();
      if (!c.deletedAt) {
        expire_(c, now);   // a card that had already run out is logged as "expired" first, as the nightly clean-up would
        log_(now, c.member, "deleted", c.stamps, "", "");
        c.deletedAt = now.toISOString();
        saveCard_(sh, found);
      }
      until = restoreUntil_(c);
    }
    forget_(code);
    return { ok: true, deleted: true, restoreUntil: until };
  });
}
// The last moment staff can still restore a deleted card
function restoreUntil_(c) { return c.deletedAt ? new Date(new Date(c.deletedAt).getTime() + DELETE_GRACE_DAYS * 864e5).toISOString() : null; }

// ---------------------------------------------------------------------------------------------------------
// Staff actions, called from the staff page with google.script.run. Each one checks the signed-in account.
// ---------------------------------------------------------------------------------------------------------
function staffCard(code) {
  requireStaff_();
  if (!validCode_(code)) return { ok: false, error: "bad_card" };
  var id = fingerprint_(code), found = findCard_(cardsSheet_(), id);
  var card = view_(found ? found.data : blankCard_(""));
  if (found && found.data.deletedAt) return { ok: true, card: card, deleted: true, deletedAt: found.data.deletedAt, restoreUntil: restoreUntil_(found.data) };
  if (!card.stampedToday && found && stampedTodayInLog_(found.data.member)) card.stampedToday = true;
  return { ok: true, card: card };
}

function staffStamp(code) {
  requireStaff_();
  if (!validCode_(code)) return { ok: false, error: "bad_card" };
  var out = withLock_(function () {
    var sh = cardsSheet_(), id = fingerprint_(code);
    var found = findCard_(sh, id) || { row: 0, data: blankCard_(id) };
    var c = found.data, now = new Date(), today = todayStr_();
    if (c.deletedAt) return { ok: false, error: "deleted", card: view_(c) };
    expire_(c, now);
    if (c.stamps >= CARD_SIZE) { saveCard_(sh, found); return { ok: false, error: "full", card: view_(c) }; }
    if (c.lastStampDate === today || (c.member && stampedTodayInLog_(c.member))) {
      c.lastStampDate = today; saveCard_(sh, found);
      return { ok: false, error: "today", card: view_(c) };
    }
    // The member number comes with the very first stamp and stays with the card for good
    var isNew = false;
    if (!c.member) { c.member = nextMember_(); isNew = true; }
    if (c.stamps === 0) c.cardStart = now.toISOString();
    c.stamps += 1;
    c.stampDates.push(today);
    c.lastStampDate = today;
    c.lastActivity = now.toISOString();
    saveCard_(sh, found);
    log_(now, c.member, "stamp", c.stamps, "", "");
    return { ok: true, newMember: isNew, card: view_(c) };
  });
  forget_(code);
  return out;
}

function staffFreeDrink(code, drink) {
  requireStaff_();
  if (!validCode_(code)) return { ok: false, error: "bad_card" };
  drink = DRINKS.indexOf(drink) >= 0 ? drink : "";
  var out = withLock_(function () {
    var sh = cardsSheet_(), id = fingerprint_(code);
    var found = findCard_(sh, id);
    if (!found) return { ok: false, error: "not_full", card: view_(blankCard_("")) };
    var c = found.data, now = new Date();
    if (c.deletedAt) return { ok: false, error: "deleted", card: view_(c) };
    if (c.stamps < CARD_SIZE) return { ok: false, error: "not_full", card: view_(c) };
    var days = c.cardStart ? Math.max(0, Math.round((now - new Date(c.cardStart)) / 864e5)) : "";
    resetCard_(c);
    c.freeDrinks += 1; c.lastActivity = now.toISOString();
    saveCard_(sh, found);
    log_(now, c.member, "free_drink", "", drink, days);
    return { ok: true, card: view_(c) };
  });
  forget_(code);
  return out;
}

// Brings back a card its owner deleted, within DELETE_GRACE_DAYS (the card is just as it was when it was deleted)
function staffRestore(code) {
  requireStaff_();
  if (!validCode_(code)) return { ok: false, error: "bad_card" };
  var out = withLock_(function () {
    var sh = cardsSheet_(), found = findCard_(sh, fingerprint_(code));
    if (!found || !found.data.deletedAt) return { ok: false, error: "not_deleted", card: view_(found ? found.data : blankCard_("")) };
    var c = found.data, now = new Date();
    if (now.getTime() > new Date(restoreUntil_(c)).getTime()) return { ok: false, error: "too_late", card: view_(c) };
    c.deletedAt = ""; c.lastActivity = now.toISOString();
    saveCard_(sh, found);
    log_(now, c.member, "restored", c.stamps, "", "");
    return { ok: true, card: view_(c) };
  });
  forget_(code);
  return out;
}

function staffSummary() {
  requireStaff_();
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Summary");
  if (!sh) return { ok: false };
  var v = sh.getRange("A4:B13").getDisplayValues();
  return { ok: true, rows: v.filter(function (r) { return r[0]; }) };
}

function staffDrinks() { requireStaff_(); return DRINKS; }   // no longer called by the staff page (the list is built in); kept for an open old page

// ---------------------------------------------------------------------------------------------------------
// Nightly clean-up (time trigger made by setup): clears expired cards and deletes long-unused ones.
// ---------------------------------------------------------------------------------------------------------
function housekeeping() {
  withLock_(function () {
    var sh = cardsSheet_(), now = new Date();
    var values = sh.getDataRange().getValues();
    var cutoff = now.getTime() - KEEP_DAYS * 864e5;
    for (var r = values.length - 1; r >= 1; r--) {
      var found = { row: r + 1, data: toCard_(values[r]) };
      var c = found.data;
      if (c.deletedAt) {   // deleted by the customer: erased for good once the restore window has passed
        if (now.getTime() > new Date(c.deletedAt).getTime() + DELETE_GRACE_DAYS * 864e5) sh.deleteRow(r + 1);
        continue;
      }
      var last = c.lastActivity ? new Date(c.lastActivity).getTime() : 0;
      if (last && last < cutoff && c.stamps < CARD_SIZE) { sh.deleteRow(r + 1); continue; }   // a full card keeps its free drink
      if (expire_(c, now)) saveCard_(sh, found);
    }
  });
}

// ---------------------------------------------------------------------------------------------------------
// Card rules
// ---------------------------------------------------------------------------------------------------------

// A card runs out 1 month after its last stamp (a new stamp pushes the date back).
// Worked out in Kota Kinabalu time (UTC+8, no daylight saving) whatever the script's own time zone is: the card runs
// until 11:59:59 PM on the same day of the month, or the month's last day when it is shorter (31 Jan -> 28 Feb, not 3 Mar).
function expiryOf_(c) {
  if (!c.lastStampDate || !c.stamps) return null;
  var p = c.lastStampDate.split("-"), y = Number(p[0]), m = Number(p[1]) - 1 + EXPIRE_MONTHS, day = Number(p[2]);
  if (!y || isNaN(m) || !day) return null;
  y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  var monthEnd = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(day, monthEnd), 23 - 8, 59, 59));   // 23:59:59 at UTC+8
}

function resetCard_(c) { c.stamps = 0; c.cardStart = ""; c.stampDates = []; }

// Clears an unfinished card once its time is up and logs it. Returns true if it changed the card.
function expire_(c, now) {
  var end = expiryOf_(c);
  if (c.stamps > 0 && c.stamps < CARD_SIZE && end && now > end) {
    if (c.member) log_(now, c.member, "expired", c.stamps, "", "");
    resetCard_(c);
    return true;
  }
  return false;
}

// What the customer's card and the staff page show. An expired card shows as empty without being saved.
function view_(c) {
  var stamps = c.stamps, end = expiryOf_(c), dates = c.stampDates;
  if (stamps > 0 && stamps < CARD_SIZE && end && new Date() > end) { stamps = 0; end = null; dates = []; }
  return {
    member: c.member || 0,
    stamps: stamps,
    size: CARD_SIZE,
    dates: dates.slice(0, stamps),
    expires: stamps > 0 && stamps < CARD_SIZE && end ? end.toISOString() : null,
    stampedToday: c.lastStampDate === todayStr_(),
    freeDrinks: c.freeDrinks
  };
}

// The next member number, kept in the script's properties (only ever called inside the lock)
function nextMember_() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty("lastMember") || 0);
  if (!n) {   // first run, or the property was lost: carry on from the highest number in the Cards tab AND the Log tab
    // (the Log too, because cards unused for 6 months are deleted, and their numbers must never be handed out again)
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    [[ss.getSheetByName("Cards"), 2], [ss.getSheetByName("Log"), 3]].forEach(function (t) {
      var sh = t[0], last = sh ? sh.getLastRow() : 0;
      if (last > 1) sh.getRange(2, t[1], last - 1, 1).getValues().forEach(function (r) { n = Math.max(n, Number(r[0]) || 0); });
    });
  }
  n += 1;
  props.setProperty("lastMember", String(n));
  return n;
}

// Before launch, after clearing test rows from Cards and Log: run this once from the editor, so the next member number
// carries on from the highest number still in those tabs (No.0001 when both are empty). Safe at any time: a number that
// is still in the Cards or Log tab is never handed out again.
function resetForLaunch() {
  PropertiesService.getScriptProperties().deleteProperty("lastMember");
  Logger.log("Done. The next member number follows the highest number in the Cards and Log tabs.");
}
function resetMemberNumbers() { resetForLaunch(); }   // the same thing, under its earlier name

// ---------------------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------------------

// The signed-in Google account must be the account that owns this script.
function isStaff_() {
  var me = Session.getEffectiveUser().getEmail();
  var active = Session.getActiveUser().getEmail();
  return !!me && !!active && active === me;
}
function requireStaff_() { if (!isStaff_()) throw new Error("Staff only. Open the staff page signed in to the Chibiro Google account."); }

// Card codes are 22 random URL-safe characters (128 bits) made on the customer's phone
function validCode_(code) { return typeof code === "string" && /^[A-Za-z0-9_-]{22}$/.test(code); }

// One-way fingerprint: the sheet never holds the code itself, so a copy of the sheet can't be used to stamp cards
function fingerprint_(code) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, "chibiro:" + code, Utilities.Charset.UTF_8)
    .map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("").slice(0, 32);
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function cardsSheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards"); }

function blankCard_(id) {
  return { id: id, member: 0, stamps: 0, stampDates: [], lastStampDate: "", freeDrinks: 0, createdAt: new Date().toISOString(),
    lastActivity: "", cardStart: "", deletedAt: "" };
}

function toCard_(r) {
  var dates = String(r[3] || "").split(",").filter(function (s) { return s; });
  return { id: String(r[0]), member: Number(r[1]) || 0, stamps: Number(r[2]) || 0, stampDates: dates, lastStampDate: dayStr_(r[4]),
    freeDrinks: Number(r[5]) || 0, createdAt: String(r[6] || ""), lastActivity: String(r[7] || ""), cardStart: String(r[8] || ""),
    deletedAt: String(r[9] || "") };
}

function findCard_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return null;
  var cell = sh.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  if (!cell) return null;
  var row = cell.getRow();
  return { row: row, data: toCard_(sh.getRange(row, 1, 1, CARD_HEADERS.length).getValues()[0]) };
}

function saveCard_(sh, found) {
  var c = found.data;
  var vals = [[c.id, c.member ? pad_(c.member) : "", String(c.stamps), c.stampDates.join(","), c.lastStampDate, String(c.freeDrinks),
    c.createdAt, c.lastActivity, c.cardStart, c.deletedAt || ""]];
  if (found.row) sh.getRange(found.row, 1, 1, CARD_HEADERS.length).setValues(vals);
  else found.row = addRow_(sh, vals[0]);
}

// Member numbers: 0001 ... 9999, then 10000 and up in full (never cut back to four digits)
function pad_(n) { n = Number(n) || 0; return n < 10000 ? ("000" + n).slice(-4) : String(n); }

// Adds a row under the last one. setup() formats the first 1,000 rows (text stays text, so member 0001 never turns into
// the number 1). When a tab runs out of rows, 500 more are added with the same formats.
var ROW_FORMATS = {
  Cards: [[1, CARD_HEADERS.length, "@"]],
  Log: [[1, 1, "yyyy-mm-dd hh:mm"], [2, 3, "@"], [6, 2, "@"], [9, 1, "@"]]
};
function addRow_(sh, values) {
  var r = sh.getLastRow() + 1, max = sh.getMaxRows();
  if (r > max) {
    sh.insertRowsAfter(max, 500);
    (ROW_FORMATS[sh.getName()] || []).forEach(function (f) { sh.getRange(max + 1, f[0], 500, f[1]).setNumberFormat(f[2]); });
  }
  sh.getRange(r, 1, 1, values.length).setValues([values]);
  return r;
}

function log_(now, member, event, stampNumber, drink, days) {
  addRow_(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log"), [
    now, Utilities.formatDate(now, TZ, "yyyy-MM-dd"), member ? pad_(member) : "", event, stampNumber,
    event === "stamp" && stampNumber ? CATS[stampNumber - 1] : "",
    Utilities.formatDate(now, TZ, "EEE"), Number(Utilities.formatDate(now, TZ, "H")), drink, days
  ]);
}

// Second check for one visit a day: the Log tab. Its time column is a real date, so this works even if the
// Cards tab's lastStampDate cell was ever changed or misread. Looks at this member's latest few Log rows.
function stampedTodayInLog_(member) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Log");
  var last = sh ? sh.getLastRow() : 0;
  if (last < 2 || !member) return false;
  // Finds the member as text (0001) and, in case Sheets ever turned a cell into a plain number, as 1 too
  var col = sh.getRange(2, 3, last - 1, 1), cells = col.createTextFinder(pad_(member)).matchEntireCell(true).findAll();
  if (String(member) !== pad_(member)) cells = cells.concat(col.createTextFinder(String(member)).matchEntireCell(true).findAll());
  cells.sort(function (a, b) { return a.getRow() - b.getRow(); });
  var today = todayStr_();
  for (var i = cells.length - 1; i >= 0 && i >= cells.length - 6; i--) {
    var v = sh.getRange(cells[i].getRow(), 1, 1, 4).getValues()[0];
    if (String(v[3]) === "stamp" && dayStr_(v[0]) === today) return true;
  }
  return false;
}
function todayStr_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"); }
// The sheet should keep dates as text, but if Sheets ever turns one into a real date, read it back the same way.
function dayStr_(v) {
  if (v instanceof Date) return isNaN(v) ? "" : Utilities.formatDate(v, TZ, "yyyy-MM-dd");
  var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(v || "").trim());
  return m ? m[1] + "-" + ("0" + m[2]).slice(-2) + "-" + ("0" + m[3]).slice(-2) : String(v || "");
}

// ---------------------------------------------------------------------------------------------------------
// The staff page (Chibiro's pixel look: cream, roast outlines, strawberry and matcha)
// ---------------------------------------------------------------------------------------------------------
function staffPage_(code) {
  // The drinks list and the scanner link go into the page itself, so a scan needs one call to the sheet, not two
  var html = STAFF_HTML_.split("__CARD__").join(JSON.stringify(code))
    .split("__DRINKS__").join(JSON.stringify(DRINKS).replace(/</g, "\\u003c"))
    .split("__SCANNER__").join(JSON.stringify(SCANNER_URL));
  return HtmlService.createHtmlOutput(html)
    .setTitle("Chibiro staff")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

var STAFF_HTML_ = [
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><base target="_top">',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;700&display=swap">',
  '<style>',
  ':root{--roast:#2c1a12;--soft:#6b4a3a;--cream:#fdf6e3;--paper:#f4e4c1;--paper2:#e8d3a6;--berry:#e57373;--berryDeep:#b23a48;--milk:#f9d5d0;--matcha:#4a6b14;--foam:#dce8b8}',
  '*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--roast);font:18px/1.45 "Pixelify Sans",system-ui,sans-serif}',
  '.wrap{max-width:460px;margin:0 auto;padding:20px 16px 40px}',
  'h1,h2,.px{font-family:"Press Start 2P",ui-monospace,monospace;font-weight:400;text-transform:uppercase}',
  'h1{font-size:16px;line-height:24px;margin:0 0 4px}h2{font-size:12px;margin:0 0 12px}',
  '.sub{color:var(--soft);margin:0 0 18px;font-size:16px}',
  '.box{border:4px solid var(--roast);padding:16px;background:#fffdf7;box-shadow:6px 6px 0 var(--roast);margin-bottom:18px}',
  '.head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}',
  '.no{padding:6px 8px;background:var(--milk);border:2px solid var(--roast);font:12px/1.2 "Press Start 2P",monospace;text-align:center}',
  '.no small{display:block;font-size:8px;color:var(--soft);margin-bottom:2px}',
  '.cats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:4px 0 14px;padding:0;list-style:none}',
  '.cats li{aspect-ratio:1;border:2px dashed var(--soft);background:var(--cream);display:grid;place-items:center;font:12px/1 "Press Start 2P",monospace;color:var(--paper2)}',
  '.cats li.on{border:2px solid var(--roast);background:var(--berry);color:var(--roast)}',
  '.cats li.free{border:2px solid var(--matcha);background:var(--foam);color:var(--matcha);font-size:8px}',
  '.count{font:16px/1 "Press Start 2P",monospace;margin:0 0 8px}',
  '.note{color:var(--soft);margin:6px 0 0;font-size:16px}',
  'button,select{font:inherit}',
  '.btn{display:block;width:100%;margin-top:16px;padding:16px;border:4px solid var(--roast);background:var(--berry);color:var(--roast);font:16px/1 "Press Start 2P",monospace;text-transform:uppercase;cursor:pointer;box-shadow:4px 4px 0 var(--roast)}',
  '.btn:active{transform:translate(4px,4px);box-shadow:none}.btn:disabled{opacity:.4}',
  '.btn.green{background:var(--matcha);color:var(--cream)}.btn.plain{background:var(--paper)}a.btn{text-align:center;text-decoration:none;line-height:1.4}',
  'select{width:100%;margin-top:14px;padding:12px;border:4px solid var(--roast);background:#fff}',
  '.done{margin-top:16px;padding:14px;background:var(--matcha);color:var(--cream);font-weight:700}',
  '.warn{margin-top:16px;padding:14px;border:4px solid var(--roast);background:var(--milk);font-weight:700}',
  'table{width:100%;border-collapse:collapse;font-size:16px}td{padding:8px 0;border-bottom:2px dashed var(--paper2)}td:last-child{text-align:right;font:12px "Press Start 2P",monospace;color:var(--matcha)}',
  '.busy{opacity:.5;pointer-events:none}',
  '</style></head><body><div class="wrap">',
  '<h1>Chibiro staff</h1><p class="sub">Cat Stamp Card</p>',
  '<div id="app"><p class="note">Loading…</p></div>',
  '</div><script>',
  'var CARD=__CARD__,SIZE=10,app=document.getElementById("app"),drinks=__DRINKS__,SCANNER=__SCANNER__;',
  'var CATS=["Calico","Orange Tabby","Siamese","Tuxedo","Scottish Fold","Black Cat","Tortoiseshell","Grey Tabby","Snow","Ginger & White"];',
  'function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}',
  'function pad(n){n=Number(n)||0;return n<10000?("000"+n).slice(-4):String(n)}',
  'function call(fn,args,done){app.classList.add("busy");var r=google.script.run.withSuccessHandler(function(x){app.classList.remove("busy");done(x)}).withFailureHandler(function(e){app.classList.remove("busy");app.innerHTML="<p class=warn>"+esc(e.message||e)+"</p>"});r[fn].apply(r,args)}',
  'var MSG={full:"This card is full. Give the free drink.",today:"This card already has today\'s stamp. One visit a day.",not_full:"This card doesn\'t have 10 stamps yet.",bad_card:"That QR code isn\'t a Chibiro card.",deleted:"This card was deleted by its owner.",not_deleted:"This card isn\'t deleted, so there is nothing to restore.",too_late:"Too late to restore: it was deleted more than 7 days ago."};',
  'function day(t){return new Date(t).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Kuching"})}',
  'function show(card,msg,ok){var h="<div class=box><div class=head><h2 style=margin:0>Member card</h2><div class=no><small>MEMBER</small>No."+(card.member?pad(card.member):"----")+"</div></div><ol class=cats>";',
  'for(var i=0;i<SIZE;i++){var on=i<card.stamps;h+="<li class=\\""+(on?"on":i===SIZE-1?"free":"")+"\\" title=\\""+esc(CATS[i])+"\\">"+(on?"&#10003;":i===SIZE-1?"FREE":(i+1))+"</li>"}',
  'h+="</ol><p class=count>"+card.stamps+" of "+SIZE+" cats</p>";',
  'if(card.stamps>0&&card.stamps<SIZE)h+="<p class=note>Next cat: "+esc(CATS[card.stamps])+"</p>";',
  'if(card.expires)h+="<p class=note>Card expires "+day(card.expires)+" unless it gets a new stamp</p>";',
  'if(!card.member)h+="<p class=note>New card: its member number comes with this first stamp.</p>";',
  'if(card.freeDrinks)h+="<p class=note>Free drinks so far: "+card.freeDrinks+"</p>";',
  'if(msg)h+="<p class="+(ok?"done":"warn")+">"+esc(msg)+"</p>";',
  'if(card.stamps>=SIZE){h+="<select id=drink><option value=\\"\\">Which drink? (optional)</option>";drinks.forEach(function(d){h+="<option>"+esc(d)+"</option>"});h+="</select><button class=\\"btn green\\" id=free>Give free drink</button>"}',
  'else if(!ok||ok==="restored"){h+="<button class=btn id=stamp"+(card.stampedToday?" disabled":"")+">Add stamp</button>";if(card.stampedToday&&!msg)h+="<p class=note>Already stamped today. One visit a day.</p>"}',
  'h+="</div><a class=\\"btn plain\\" href=\\""+esc(SCANNER)+"\\">Scan next card</a><p class=note>Opens the staff scanner. Scan cards there, not with the phone\'s own camera app.</p>";app.innerHTML=h;',
  'var s=document.getElementById("stamp");if(s)s.onclick=function(){call("staffStamp",[CARD],function(r){var m;if(r.ok){m="Stamp added: "+CATS[r.card.stamps-1]+". "+r.card.stamps+" of "+SIZE+".";if(r.newMember)m+=" New member No."+pad(r.card.member)+"!"}else if(r.error==="deleted")return load();else m=MSG[r.error]||"Something went wrong.";show(r.card||card,m,r.ok)})};',
  'var f=document.getElementById("free");if(f)f.onclick=function(){call("staffFreeDrink",[CARD,document.getElementById("drink").value],function(r){if(!r.ok&&r.error==="deleted")return load();show(r.card||card,r.ok?"Free drink given. A new card has started.":MSG[r.error]||"Something went wrong.",r.ok)})}}',
  'function summary(){call("staffSummary",[],function(r){var h="<div class=box><p class=note style=\\"margin-top:0\\">To stamp a card, open the staff scanner and scan the customer\'s QR code there.</p><a class=\\"btn green\\" href=\\""+esc(SCANNER)+"\\">Open the staff scanner</a></div><h1 style=\\"font-size:12px\\">Numbers</h1><table>";',
  '(r.rows||[]).forEach(function(x){h+="<tr><td>"+esc(x[0])+"</td><td>"+esc(x[1])+"</td></tr>"});app.innerHTML=h+"</table><p class=note>More detail is in the Summary tab of the Google Sheet.</p>"})}',
  'function gone(r){var c=r.card,h="<div class=box><div class=head><h2 style=margin:0>Deleted card</h2><div class=no><small>MEMBER</small>No."+(c.member?pad(c.member):"----")+"</div></div>";',
  'h+="<p class=count>"+c.stamps+" of "+SIZE+" cats</p><p class=warn>The owner deleted this card on "+esc(day(r.deletedAt))+". It can\'t get stamps or free drinks now.</p>";',
  'h+="<p class=note>If it was deleted by mistake, you can bring it back until "+esc(day(r.restoreUntil))+". After that it is erased for good.</p><button class=\\"btn green\\" id=restore>Restore card</button>";',
  'h+="</div><a class=\\"btn plain\\" href=\\""+esc(SCANNER)+"\\">Scan next card</a>";app.innerHTML=h;',
  'document.getElementById("restore").onclick=function(){call("staffRestore",[CARD],function(x){if(x.ok)show(x.card,"Card restored. It works again, with its "+x.card.stamps+" stamp"+(x.card.stamps===1?"":"s")+".","restored");else if(x.error==="too_late")app.innerHTML="<p class=warn>"+esc(MSG.too_late)+"</p><a class=\\"btn plain\\" href=\\""+esc(SCANNER)+"\\">Scan next card</a>";else load()})}}',
  'function load(){call("staffCard",[CARD],function(r){if(r.ok&&r.deleted)gone(r);else if(r.ok)show(r.card);else app.innerHTML="<p class=warn>"+esc(MSG[r.error]||"Something went wrong.")+"</p>"})}',
  'if(CARD)load();else summary();',
  '</script></body></html>'
].join("\n");
