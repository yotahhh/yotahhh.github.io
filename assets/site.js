/* yvesspiri.net · minimal behaviour: the atmospheric error dialog and the
   home page player.
   Error dialog:
   retry: brief flicker, dialog stays. ignore: dismissed for the session.
   It never blocks anything; it is decoration that happens to have buttons. */
(function () {
  var dialog = document.querySelector('.error');
  if (!dialog) return;
  try { if (sessionStorage.getItem('ys-error-ignored') === '1') dialog.hidden = true; } catch (e) {}
  dialog.addEventListener('click', function (e) {
    var action = e.target.getAttribute('data-error');
    if (action === 'ignore') {
      dialog.hidden = true;
      try { sessionStorage.setItem('ys-error-ignored', '1'); } catch (err) {}
    } else if (action === 'retry') {
      dialog.style.visibility = 'hidden';
      setTimeout(function () { dialog.style.visibility = ''; }, 180);
    }
  });
})();

/* home page player. The track on the server is XOR-scrambled (see
   scripts/encode-landing.mjs): it is fetched on first hover or play,
   unscrambled with the key on the element, and played from a blob URL. */
(function () {
  var player = document.querySelector('.player[data-src]');
  if (!player) return;
  var btn = player.querySelector('.play');
  var time = player.querySelector('.time');
  var status = player.querySelector('.status');
  var wave = player.querySelector('.wave');
  var bars = wave.querySelectorAll('path');
  var note = status.textContent;
  var total = time.textContent;
  var audio = new Audio();
  var loading = null;
  var playIcon = '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1l7 4-7 4z" fill="var(--ink)"/></svg>';
  var pauseIcon = '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1h2.5v8H2zM5.5 1H8v8H5.5z" fill="var(--ink)"/></svg>';

  function fmt(s) {
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  function load() {
    if (!loading) {
      var key = player.getAttribute('data-key').match(/../g).map(function (h) { return parseInt(h, 16); });
      loading = fetch(player.getAttribute('data-src'))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(function (buf) {
          var b = new Uint8Array(buf);
          for (var i = 0; i < b.length; i++) b[i] ^= key[i % key.length];
          audio.src = URL.createObjectURL(new Blob([b], { type: 'audio/mp4' }));
        });
      loading.catch(function () { loading = null; status.textContent = 'buffer underrun'; });
    }
    return loading;
  }

  // start fetching as soon as someone shows intent
  btn.addEventListener('pointerenter', load);
  btn.addEventListener('focus', load);

  btn.addEventListener('click', function () {
    if (!audio.paused) { audio.pause(); return; }
    if (!audio.src) {
      audio.load(); // inside the gesture, so iOS lets the later play() through
      status.textContent = 'buffering';
    }
    load().then(function () { return audio.play(); }).catch(function () {});
  });

  // click the waveform to seek
  wave.addEventListener('click', function (e) {
    var f = (e.clientX - wave.getBoundingClientRect().left) / wave.getBoundingClientRect().width;
    function seek() { audio.currentTime = f * audio.duration; }
    load().then(function () {
      if (audio.duration) seek(); else audio.addEventListener('loadedmetadata', seek, { once: true });
      if (audio.paused) audio.play().catch(function () {});
    });
  });

  audio.addEventListener('play', function () { btn.innerHTML = pauseIcon; btn.setAttribute('aria-pressed', 'true'); status.textContent = note; });
  audio.addEventListener('pause', function () { btn.innerHTML = playIcon; btn.setAttribute('aria-pressed', 'false'); });
  audio.addEventListener('ended', function () { time.textContent = total; });
  audio.addEventListener('timeupdate', function () {
    time.textContent = fmt(audio.currentTime);
    var played = audio.duration ? (audio.currentTime / audio.duration) * bars.length : 0;
    for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('on', i < played);
  });
})();
