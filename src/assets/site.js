/* yvesspiri.net · the only script.

   1. the landing track: one audio element shared by the home page player and
      the dock in the corner. The file on the server is XOR-scrambled (see
      scripts/encode-landing.mjs): it is fetched on first hover or play,
      unscrambled with the key on the dock, and played from a blob URL.
   2. embeds (Bandcamp, SoundCloud, Vimeo): only one thing plays at a time.
      Bandcamp has no player API, so a click into an embed (focus moving into
      its iframe) counts as it starting, and reloading the iframe stops it.
   3. appearance: the header swatches switch the colour theme (data-theme on
      <html>, remembered in localStorage; an inline script in <head> applies
      it before first paint).
   4. glitches: one random row per page view twitches, in a rotating style.
   5. once anything has been started, internal links swap the page content
      in place instead of loading a new page, so the music keeps going. A
      playing embed cannot be moved without reloading, so its old page stays
      in the document, invisible, with just that player pinned to the corner. */
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
    stopEmbed();
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

  // ---------- embeds ----------

  var embed = null; // the iframe that was last started

  function stopEmbed() {
    if (!embed) return;
    var ghost = embed.closest('main.ghost');
    if (ghost) ghost.remove();
    else {
      embed.src = embed.src; // reload: the only way to stop a Bandcamp player
      embed.closest('.inset').classList.remove('docked');
    }
    embed = null;
  }

  window.addEventListener('blur', function () {
    setTimeout(function () {
      var f = document.activeElement;
      if (!f || f.tagName !== 'IFRAME' || !f.closest('.inset') || f === embed) return;
      stopEmbed();
      audio.pause();
      dock.hidden = true;
      embed = f;
      started = true;
    }, 0);
  });

  // the old page stays, invisible; only the playing embed shows, in the corner
  function dockEmbed(main) {
    main.classList.add('ghost');
    // no aria-hidden: visibility: hidden already hides the rest, and the player stays reachable
    var inset = embed.closest('.inset');
    inset.classList.add('docked');
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'bevel undock';
    close.textContent = 'close';
    close.setAttribute('aria-label', 'Close player');
    close.addEventListener('click', stopEmbed);
    inset.appendChild(close);
  }

  // ---------- page swaps, only once something has been played ----------

  function swap(url, push) {
    return fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var main = doc.querySelector('main.page');
        if (!main) throw new Error('no page');
        var current = document.querySelector('main.page:not(.ghost)');
        main = document.adoptNode(main);
        if (embed && current.contains(embed)) {
          var old = document.querySelector('main.ghost');
          if (old) old.remove();
          current.before(main);
          dockEmbed(current);
        } else {
          current.replaceWith(main);
        }
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

  // ---------- appearance ----------

  function defaultTheme() { var g = document.querySelector('.themes'); return g ? g.getAttribute('data-default') : ''; }
  function currentTheme() { return document.documentElement.getAttribute('data-theme') || defaultTheme(); }

  function bindThemes() {
    var swatches = document.querySelectorAll('main.page:not(.ghost) .swatch');
    function mark() {
      swatches.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-theme-id') === currentTheme())); });
    }
    swatches.forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-theme-id');
        if (id === defaultTheme()) document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', id);
        try { localStorage.setItem('ys-theme', id); } catch (e) {}
        mark();
      });
    });
    mark();
  }

  // ---------- glitches ----------

  // One row per page view gets a glitch: the row is random, the kind
  // rotates through the list from view to view (remembered across visits).
  var GLITCHES = ['jitter', 'flicker', 'slip', 'chroma', 'stutter'];

  function bindGlitch() {
    var rows = [].filter.call(document.querySelectorAll('main.page:not(.ghost) .rows a.row'), function (r) {
      return !r.hasAttribute('aria-current') && r.textContent.trim().indexOf('../') !== 0;
    });
    if (!rows.length) return;
    var n = 0;
    try { n = (parseInt(localStorage.getItem('ys-glitch'), 10) || 0) + 1; localStorage.setItem('ys-glitch', n); }
    catch (e) { n = Math.floor(Math.random() * GLITCHES.length); }
    var r = rows[Math.floor(Math.random() * rows.length)];
    r.classList.add('glitch-' + GLITCHES[n % GLITCHES.length]);
  }

  function bindPage() {
    bindPlayer();
    bindThemes();
    bindGlitch();
  }
  bindPage();
})();
