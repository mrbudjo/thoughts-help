// Scripted phone demo: four "Try it now" beats, then start over.
(function () {
  var phone = document.getElementById('phone');
  if (!phone) return;
  var mic = document.getElementById('mic'), type = document.getElementById('type');
  var typed = document.getElementById('typed');
  var bMic = document.getElementById('banner-mic'), bType = document.getElementById('banner-type');
  var dots = document.getElementById('dots').children;
  var cards = phone.querySelectorAll('[data-show]');
  var heardEl = document.querySelector('.listening');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var s = { step: 0, phase: 'idle', shown: -1 };
  var timers = [];
  function later(fn, ms) { timers.push(setTimeout(fn, reduce ? 0 : ms)); }

  function show(name) {
    for (var i = 0; i < cards.length; i++) cards[i].classList.toggle('on', cards[i].getAttribute('data-show') === name);
  }
  function render() {
    phone.setAttribute('data-step', s.step);
    phone.setAttribute('data-phase', s.phase);
    var view = s.phase === 'idle' ? 'home' : s.phase === 'result' ? ['answer1', 'saved', 'answer2', 'list'][s.shown] : s.phase === 'listening' ? 'none' : s.phase;
    show(view);
    var idle = s.phase === 'idle' || s.phase === 'result';
    var text = s.step === 4 ? 'Start over' : 'Try it now';
    bMic.classList.toggle('on', idle && s.step !== 2);
    bType.classList.toggle('on', idle && s.step === 2);
    bMic.firstElementChild.textContent = text;
    bType.firstElementChild.textContent = text;
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', s.step > i);
  }
  function stream(el, text, done) {
    var words = text.split(' '), i = 0;
    el.textContent = 'Listening\u2026';
    function tick() {
      i++; el.textContent = words.slice(0, i).join(' ');
      if (i < words.length) later(tick, 140 + Math.random() * 90); else later(done, 800);
    }
    later(tick, 1100);
  }
  function typeOut(el, text, done) {
    var i = 0; el.textContent = '';
    function tick() {
      i++; el.textContent = text.slice(0, i);
      if (i < text.length) later(tick, 55 + Math.random() * 60); else later(done, 600);
    }
    later(tick, 400);
  }
  function listen(text, step) {
    s.phase = 'listening'; render();
    stream(heardEl, text, function () { s.phase = 'result'; s.shown = step; s.step = step + 1; render(); });
  }
  function busy() { return s.phase === 'listening' || s.phase === 'typing'; }

  mic.addEventListener('click', function () {
    if (busy()) return;
    if (s.step === 0) listen('What did I like here?', 0);
    else if (s.step === 1) listen('I parked on level 3, next to the blue pillar.', 1);
    else if (s.step === 2) type.click();
    else if (s.step === 3) listen('Add curtain rods and a bath mat to the IKEA list.', 3);
    else { s = { step: 0, phase: 'idle', shown: -1 }; typed.textContent = ''; render(); }
  });
  type.addEventListener('click', function () {
    if (busy() || s.step !== 2) return;
    s.phase = 'typing'; render();
    typeOut(typed, 'where did I park', function () { s.phase = 'result'; s.shown = 2; s.step = 3; render(); });
  });
  render();
})();
