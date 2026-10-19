/* yvesspiri.net · the only script.

   1. error dialog: retry flickers it, ignore dismisses it for the session.
      It never blocks anything; it is decoration that happens to have buttons.
   2. the landing track: one audio element shared by the home page player and
      the dock in the corner. The file on the server is XOR-scrambled (see
      scripts/encode-landing.mjs): it is fetched on first hover or play,
      unscrambled with the key on the dock, and played from a blob URL.
   3. once the track has been started, internal links swap the page content
      in place instead of loading a new page, so the music keeps going. */
(function () {
  var dock = document.querySelector('.dock');
  var audio = new Audio();
  var loading = null;
  var started = false;
  var title = dock.getAttribute('data-title');
  var total = dock.querySelector('.dock-time').textContent;
  var playIcon = '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1l7 4-7 4z" fill="var(--ink)"/></svg>';
  var pauseIcon = '<svg width="12" height="12" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1h2.5v8H2zM5.5 1H8v8H5.5z" fill="var(--ink)"/></svg>';
  var player = null; // the home page player, when the home page is showing

  function fmt(s) {
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  // ---------- audio ----------

  function load() {
    if (!loading) {
      var key = dock.getAttribute('data-key').match(/../g).map(function (h) { return parseInt(h, 16); });
      loading = fetch(dock.getAttribute('data-src'))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(function (buf) {
          var b = new Uint8Array(buf);
          for (var i = 0; i < b.length; i++) b[i] ^= key[i % key.length];
          audio.src = URL.createObjectURL(new Blob([b], { type: 'audio/mp4' }));
        });
      loading.catch(function () { loading = null; setStatus('buffer underrun'); });
    }
    return loading;
  }

  function play() {
    if (!audio.src) {
      audio.load(); // inside the gesture, so iOS lets the later play() through
      setStatus('buffering');
    }
    load().then(function () { return audio.play(); }).catch(function () {});
  }
  function toggle() { if (audio.paused) play(); else audio.pause(); }

  function seek(f) {
    function go() { audio.currentTime = f * audio.duration; }
    load().then(function () {
      if (audio.duration) go(); else audio.addEventListener('loadedmetadata', go, { once: true });
      if (audio.paused) audio.play().catch(function () {});
    });
  }

  // ---------- ui: dock + home player ----------

  function setStatus(text) {
    var s = player && player.querySelector('.status');
    if (s) s.textContent = text || s.getAttribute('data-note');
  }

  function paint() {
    var playing = !audio.paused;
    var buttons = [dock.querySelector('.play')];
    if (player) buttons.push(player.querySelector('.play'));
    buttons.forEach(function (b) {
      b.innerHTML = playing ? pauseIcon : playIcon;
      b.setAttribute('aria-pressed', String(playing));
      b.setAttribute('aria-label', (playing ? 'Pause ' : 'Play ') + title);
    });
    var t = audio.currentTime && !audio.ended ? fmt(audio.currentTime) : total;
    var f = audio.duration ? audio.currentTime / audio.duration : 0;
    dock.querySelector('.dock-time').textContent = t;
    dock.querySelector('.dock-bar span').style.width = (f * 100) + '%';
    if (player) {
      player.querySelector('.time').textContent = t;
      var bars = player.querySelectorAll('.wave path');
      for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('on', i < f * bars.length);
    }
  }

  function bindPlayer() {
    player = document.querySelector('.player[data-player]');
    if (!player) return;
    var btn = player.querySelector('.play');
    var wave = player.querySelector('.wave');
    var status = player.querySelector('.status');
    status.setAttribute('data-note', status.textContent);
    btn.addEventListener('pointerenter', load);
    btn.addEventListener('focus', load);
    btn.addEventListener('click', toggle);
    wave.addEventListener('click', function (e) {
      var r = wave.getBoundingClientRect();
      seek((e.clientX - r.left) / r.width);
    });
    paint();
  }

  dock.querySelector('.play').addEventListener('click', toggle);
  audio.addEventListener('play', function () {
    started = true;
    dock.hidden = false;
    setStatus();
    paint();
  });
  ['pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(function (ev) { audio.addEventListener(ev, paint); });

  // lock screen, headphones and media keys
  if ('mediaSession' in navigator) {
    audio.addEventListener('play', function () {
      navigator.mediaSession.metadata = new MediaMetadata({ title: title, artist: dock.getAttribute('data-artist') });
    });
    navigator.mediaSession.setActionHandler('play', play);
    navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
    try {
      navigator.mediaSession.setActionHandler('seekto', function (d) { if (audio.duration) audio.currentTime = d.seekTime; });
    } catch (e) {}
  }

  // ---------- error dialog ----------

  function bindError() {
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
  }

  // ---------- page swaps, only while the track is in play ----------

  function swap(url, push) {
    return fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var main = doc.querySelector('main.page');
        if (!main) throw new Error('no page');
        document.querySelector('main.page').replaceWith(document.adoptNode(main));
        document.title = doc.title;
        if (push) history.pushState({ swapped: true }, '', url);
        window.scrollTo(0, 0);
        bindPage();
      })
      .catch(function () { location.href = url; });
  }

  document.addEventListener('click', function (e) {
    if (!started || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
    if (!/\/$/.test(a.pathname)) { // images and other files: a new tab, so the music keeps going
      e.preventDefault();
      window.open(a.href, '_blank', 'noopener');
      return;
    }
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    if (!history.state) history.replaceState({ swapped: true }, '');
    swap(a.href, true);
  });
  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.swapped) swap(location.href, false);
  });

  function bindPage() {
    bindPlayer();
    bindError();
  }
  bindPage();
})();
