// Local prices on the pricing page (thoughts2/PLAN-STORE-LOCALIZATION.md P2 + P3).
// prices.json comes from `thoughts2/scripts/store_listing prices` (Apple's live price per
// territory). The App Store charges by the country of the visitor's Apple Account, which a
// website can't know, so this is a guess, and the page says the App Store shows the exact
// price. Without JavaScript or prices.json the page keeps its US prices.
//
// Loaded before analytics.js (both defer), so the guess is ready for the $pageview.
(function () {
  var KEY = 'price_country';
  var lang = document.documentElement.lang || 'en';

  function load() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(c) { try { localStorage.setItem(KEY, c); } catch (e) {} }
  function code(c) { return typeof c === 'string' && /^[A-Z]{2}$/.test(c) ? c : null; }

  // The guess, in order: picked earlier → time zone → region in the browser's languages → US.
  function guess() {
    var c = code(load());
    if (c) return { country: c, source: 'picked' };
    try {
      c = code((window.TZ_COUNTRY || {})[Intl.DateTimeFormat().resolvedOptions().timeZone]);
      if (c) return { country: c, source: 'timezone' };
    } catch (e) {}
    var langs = navigator.languages || [navigator.language];
    for (var i = 0; i < langs.length; i++) {
      var m = /^[a-z]{2,3}(?:-[A-Za-z]{4})?-([A-Za-z]{2})(?:-|$)/.exec(langs[i] || '');
      if (m) return { country: m[1].toUpperCase(), source: 'language' };
    }
    return { country: 'US', source: 'default' };
  }

  var g = guess();
  // Read by analytics.js and registered on every event from this page.
  window.thoughtsPageProps = { price_country: g.country, price_country_source: g.source };

  var names;
  try { names = new Intl.DisplayNames([lang], { type: 'region' }); } catch (e) {}
  function name(c) { try { return (names && names.of(c)) || c; } catch (e) { return c; } }

  function money(amount, currency, fraction) {
    var n = Number(amount);
    try {
      var o = { style: 'currency', currency: currency };
      if (fraction != null) o.maximumFractionDigits = o.minimumFractionDigits = fraction;
      else if (n === Math.round(n)) o.minimumFractionDigits = o.maximumFractionDigits = 0; // ₹199, as the App Store shows it
      return new Intl.NumberFormat(lang, o).format(n);
    } catch (e) {
      return currency + ' ' + n;
    }
  }
  function digits(currency) {
    try { return new Intl.NumberFormat(lang, { style: 'currency', currency: currency }).resolvedOptions().maximumFractionDigits; }
    catch (e) { return 2; }
  }

  var el = {};
  var table;

  function render() {
    var row = table[g.country];
    var sold = !!(row && row.sold);
    var p = sold ? row : table.US;
    var fd = digits(p.currency);
    el.weekly.textContent = money(p.weekly, p.currency);
    el.annual.textContent = money(p.annual, p.currency);
    el.weeklyUnit.textContent = p.currency + ' / week';
    el.annualUnit.textContent = p.currency + ' / year';
    // Long amounts (₫2,499,000) step down a size so they stay inside the card.
    el.weekly.parentNode.classList.toggle('long', el.weekly.textContent.length > 8);
    el.annual.parentNode.classList.toggle('long', el.annual.textContent.length > 8);
    // Whole-number prices (¥300, ₹199) get a whole-number "about … a week" too.
    var whole = Number(p.weekly) % 1 === 0 && Number(p.annual) % 1 === 0;
    el.perWeek.textContent = money(Number(p.annual) / 52, p.currency, whole ? 0 : Math.min(fd, 2));
    var save = Math.round((1 - Number(p.annual) / (Number(p.weekly) * 52)) * 100);
    el.save.hidden = !(save >= 5);
    el.save.textContent = 'Save ' + save + '%';

    el.country.textContent = name(g.country);
    el.notSold.hidden = sold;
    el.notSoldCountry.textContent = name(g.country);
  }

  function picker() {
    var sel = el.select;
    var list = Object.keys(table).map(function (c) { return [c, name(c)]; });
    list.sort(function (a, b) { return a[1].localeCompare(b[1], lang); });
    sel.textContent = '';
    for (var i = 0; i < list.length; i++) {
      var o = document.createElement('option');
      o.value = list[i][0];
      o.textContent = list[i][1];
      sel.appendChild(o);
    }
    if (!table[g.country]) {
      // A guessed country Apple doesn't sell in at all (no row): still shown as the current one.
      var x = document.createElement('option');
      x.value = g.country; x.textContent = name(g.country);
      sel.insertBefore(x, sel.firstChild);
    }
    sel.value = g.country;
  }

  function start() {
    ['weekly', 'annual', 'weeklyUnit', 'annualUnit', 'perWeek', 'save', 'country', 'change',
     'select', 'notSold', 'notSoldCountry', 'usdLine', 'localLine'].forEach(function (k) {
      el[k] = document.getElementById('price-' + k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }));
    });
    if (!el.weekly) return;

    fetch('prices.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (t) {
      if (!t || !t.US) return;
      table = t;
      picker();
      render();
      el.usdLine.hidden = true;
      el.localLine.hidden = false;

      el.change.addEventListener('click', function () {
        el.select.hidden = false;
        el.change.setAttribute('aria-expanded', 'true');
        el.select.focus();
      });
      el.select.addEventListener('change', function () {
        g = { country: el.select.value, source: 'picked' };
        save(g.country);
        render();
        window.thoughtsPageProps = { price_country: g.country, price_country_source: g.source };
        if (window.posthog && posthog.register) posthog.register(window.thoughtsPageProps);
        if (window.thoughtsTrack) thoughtsTrack('price_country_picked', { price_country: g.country });
      });
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
