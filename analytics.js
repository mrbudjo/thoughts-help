// PostHog for thoughts.help. Event names live in thoughts2/ANALYTICS.md.
// Cookieless: nothing is stored in the browser, so no consent banner.
(function () {
  var HOST = 'https://eu.i.posthog.com';
  var TOKEN = 'phc_otuBCULZc69mS6FwD8749BdycKpMvDGWZwgrCwuQu3Z2';
  if (!TOKEN || location.hostname === 'localhost') return;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init(TOKEN, {
    api_host: HOST,
    cookieless_mode: 'always',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
  });
  posthog.register({ platform: 'web' });

  function track(name, props) { posthog.capture(name, props || {}); }

  // App Store: nav pill vs badge; badge location by page.
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#appstore') !== -1) {
      track('appstore_clicked', { location: a.classList.contains('pill') ? 'nav' : page === 'index' ? 'hero' : page });
    } else if (/^https?:/.test(href) && a.hostname !== location.hostname) {
      track('outbound_clicked', { host: a.hostname });
    }
  });

  // FAQ: <details> on index and pricing. index = 0-based position on the page.
  var faqs = document.querySelectorAll('details');
  for (var i = 0; i < faqs.length; i++) (function (d, i) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_opened', { page: page, index: i }); });
  })(faqs[i], i);

  window.thoughtsTrack = track;
})();
