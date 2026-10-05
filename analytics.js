// PostHog for thoughts.help, plus "where did this visitor come from".
// Event names and the source/ct scheme live in thoughts2/ANALYTICS.md.
// Cookieless: nothing is stored in the browser, so no consent banner. The
// source travels in the URL instead (utm_source on internal links, ct on the
// App Store link).
(function () {
  var HOST = 'https://eu.i.posthog.com';
  var TOKEN = 'phc_otuBCULZc69mS6FwD8749BdycKpMvDGWZwgrCwuQu3Z2';
  // Provider token (App Store Connect → App Analytics → Campaigns → "Generate link", the pt= value).
  // Any ct works without registering it first; Apple shows a campaign once 5+ Apple Accounts installed via it.
  var PT = '129377804';
  var APP_ID = 'id6809778958';
  var APP = 'https://apps.apple.com/us/app/thoughts-easy-voice-memory/' + APP_ID;

  // Referrer host → source. Suffix match, first match wins (gemini before google).
  var HOSTS = [
    ['youtube.com', 'youtube'], ['youtu.be', 'youtube'],
    ['tiktok.com', 'tiktok'],
    ['instagram.com', 'instagram'],
    ['facebook.com', 'facebook'], ['fb.com', 'facebook'], ['fb.me', 'facebook'],
    ['reddit.com', 'reddit'], ['redd.it', 'reddit'],
    ['chatgpt.com', 'chatgpt'], ['openai.com', 'chatgpt'], ['claude.ai', 'claude'],
    ['perplexity.ai', 'perplexity'], ['gemini.google.com', 'gemini'], ['copilot.microsoft.com', 'copilot'],
    ['bing.com', 'bing'], ['duckduckgo.com', 'duckduckgo'], ['yahoo.com', 'yahoo'],
    ['ecosia.org', 'ecosia'], ['search.brave.com', 'brave'],
    ['t.co', 'x'], ['x.com', 'x'], ['twitter.com', 'x'],
    ['threads.net', 'threads'], ['threads.com', 'threads'],
    ['linkedin.com', 'linkedin'], ['lnkd.in', 'linkedin']
  ];
  // Source → Apple campaign (ct). Coarse on purpose: Apple hides small numbers.
  // Anything not listed is its own ct (youtube → youtube, a hand-tagged newsletter → newsletter).
  var GROUPS = {
    google: 'search', bing: 'search', duckduckgo: 'search', yahoo: 'search', ecosia: 'search', brave: 'search',
    chatgpt: 'ai', claude: 'ai', perplexity: 'ai', gemini: 'ai', copilot: 'ai',
    x: 'social', threads: 'social', linkedin: 'social'
  };

  // Short utm_source values apps add themselves (Instagram shares as utm_source=ig) → canonical source.
  var ALIASES = { ig: 'instagram', fb: 'facebook', yt: 'youtube' };

  function hostSource(host) {
    host = host.toLowerCase().replace(/^www\./, '');
    for (var i = 0; i < HOSTS.length; i++) {
      var d = HOSTS[i][0];
      if (host === d || host.slice(-d.length - 1) === '.' + d) return HOSTS[i][1];
    }
    return /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host) ? 'google' : null;
  }
  // A tag from a URL: lowercase, [a-z0-9-], ≤40 chars (Apple's ct limit).
  // Domain-looking values (ChatGPT adds utm_source=chatgpt.com) go through the host table.
  function clean(v) {
    v = (v || '').trim().toLowerCase();
    if (v.indexOf('.') !== -1) v = hostSource(v) || v;
    v = v.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return ALIASES[v] || v || null;
  }

  // Source: the link's utm_source, else a known external referrer, else a click ID the
  // platform appended, else none (= website). Click IDs come after the referrer because
  // gclid/wbraid/gbraid are Google Ads IDs: a google.com referrer should still read as search.
  var q = new URLSearchParams(location.search);
  var source = clean(q.get('utm_source'));
  if (!source && document.referrer) {
    try {
      var r = new URL(document.referrer);
      if (r.hostname !== location.hostname) source = hostSource(r.hostname);
    } catch (e) {}
  }
  if (!source) {
    if (q.has('ttclid')) source = 'tiktok';
    else if (q.has('gclid') || q.has('wbraid') || q.has('gbraid')) source = 'youtube';
  }
  var content = clean(q.get('v'));
  var isGo = /\/go(\.html)?$/.test(location.pathname);
  if (isGo && !source) source = 'go';
  var ct = source ? GROUPS[source] || source : 'website';

  function appUrl(href) {
    var u = new URL(href || APP);
    if (PT) u.searchParams.set('pt', PT);
    u.searchParams.set('ct', ct);
    u.searchParams.set('mt', '8'); // as Apple's generated links have it (8 = apps)
    return u.href;
  }
  function carry(u) {
    if (source) u.searchParams.set('utm_source', source);
    if (content) u.searchParams.set('v', content);
    return u.href;
  }
  // beacon: the page is about to navigate away, so send now and survive the unload.
  function track(name, props, beacon) {
    if (on) posthog.capture(name, props || {}, beacon ? { transport: 'sendBeacon', send_instantly: true } : undefined);
  }
  window.thoughtsTrack = track;

  // PostHog is off on local dev hosts.
  var on = TOKEN && !/^(localhost|127\.0\.0\.1|)$/.test(location.hostname);

  // /go?utm_source=youtube&v=romance: log the hop, then on to the App Store. App Store only, so a
  // stripped /go still lands somewhere sensible; website links point at the page itself with ?utm_source=.
  // location.replace keeps /go out of history: Back returns to YouTube, not through /go again.
  var gone = false, dest;
  function leave() { if (!gone) { gone = true; location.replace(dest); } }
  if (isGo) {
    dest = appUrl();
    if (!on) return leave();
    setTimeout(leave, 1500); // PostHog blocked or slow: go anyway
  }

  if (on) {
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

    posthog.init(TOKEN, {
      api_host: HOST,
      cookieless_mode: 'always',
      autocapture: false,
      capture_pageview: false, // sent below, after the source properties are registered
      capture_pageleave: !isGo,
      disable_session_recording: true,
      // A capture made inside loaded is dropped; the queued link_opened below runs right after it.
      loaded: function () { if (isGo) setTimeout(leave, 0); }
    });
    // Ad blockers fail the script load outright: don't sit out the 1.5 s.
    if (isGo) { var ps = document.querySelector('script[src*="posthog.com"]'); if (ps) ps.onerror = leave; }
    // On every event from this page load; re-derived from the URL on each page.
    posthog.register({ platform: 'web', source: source || 'website', ct: ct });
    if (content) posthog.register({ content: content });
    if (isGo) track('link_opened', {}, true);
    else posthog.capture('$pageview', {}, { send_instantly: true }); // not batched: a quick click-through would drop it
  }
  if (isGo) return;

  // Links: the App Store gets ct (+ pt); internal pages carry the source forward.
  var links = document.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    var a = links[i], href = a.getAttribute('href');
    if (href.charAt(0) === '#' || /^(mailto|tel):/i.test(href)) continue;
    var u = new URL(a.href);
    if (u.hostname === 'apps.apple.com' && u.pathname.indexOf(APP_ID) !== -1) a.href = appUrl(a.href);
    else if (u.origin === location.origin && (source || content)) a.href = carry(u);
  }

  // App Store: nav pill vs index hero badge vs a page's own badge.
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var u = new URL(a.href);
    if (u.hostname === 'apps.apple.com' && u.pathname.indexOf(APP_ID) !== -1) {
      track('appstore_clicked', { location: a.classList.contains('pill') ? 'nav' : a.id === 'appstore' ? 'hero' : page }, true);
    } else if (/^https?:$/.test(u.protocol) && u.hostname !== location.hostname) {
      track('outbound_clicked', { host: u.hostname }, true);
    }
  });

  // FAQ: <details> on index and pricing. index = 0-based position on the page.
  var faqs = document.querySelectorAll('details');
  for (var j = 0; j < faqs.length; j++) (function (d, j) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_opened', { page: page, index: j }); });
  })(faqs[j], j);
})();
