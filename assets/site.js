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
      Rows that point at a window on the page (cover.jpg, a track) jump to it;
      a track of an album also loads into the album's player.
   5. film clips: loop silently while on screen; the sound button unmutes
      one and silences the landing track and embeds (and vice versa).
   6. on a desktop (mouse, wide screen) windows can be dragged by their
      title bar, and the one you touch comes to the front. A move only
      offsets a window from where the layout put it, so the layout stays,
      and it is remembered: the directory's everywhere, any other window's
      on its own page.
   7. internal links swap the page content in place instead of loading a
      new page, with Mac OS 9 zoom rectangles, so the music keeps going. A
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
    muteClips();
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
      muteClips();
      dock.hidden = true;
      embed = f;
      started = true;
    }, 0);
  });

  // the old page stays, invisible; only the playing embed shows, in the corner
  function dockEmbed(main) {
    main.classList.add('ghost');
    // a moved window would become the fixed player's containing block
    var moved = embed.closest('.window');
    if (moved) moved.style.transform = '';
    main.querySelectorAll('video').forEach(function (v) { v.pause(); });
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

  // ---------- rows that point at a window on the page ----------

  // cover.jpg, a track, a clip: the row jumps to its window (unless it is
  // already in full view), and the window blinks so you see where it is. A track of an
  // album also loads that track into the album's Bandcamp player. Bandcamp
  // offers no way to start it from outside, so it waits for its play button.
  document.addEventListener('click', function (e) {
    var a = e.target.closest('main.page:not(.ghost) a.row[href^="#"]');
    if (!a) return;
    var win = document.getElementById(a.getAttribute('href').slice(1));
    if (!win) return;
    var src = a.getAttribute('data-track');
    var f = src && win.querySelector('iframe');
    if (f && f.src !== src) {
      if (f === embed) embed = null; // loading another track stops this one
      f.src = src;
    }
    // already in full view (side column on a wide screen): blink, don't scroll
    var box = win.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) e.preventDefault();
    win.classList.remove('called');
    void win.offsetWidth; // restart the blink
    win.classList.add('called');
  });

  // ---------- film clips ----------

  // Clips loop silently while on screen, like GIFs. The sound button unmutes
  // one at a time and silences the landing track and any embed.
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var watcher = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting && !calm) v.play().catch(function () {});
      else if (!e.isIntersecting && v.muted) v.pause();
    });
  }, { threshold: 0.5 }) : null;

  function setSound(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('span').textContent = on ? 'sound on' : 'sound off';
  }

  function muteClips() {
    document.querySelectorAll('.window.clip video').forEach(function (v) {
      if (v.muted) return;
      v.muted = true;
      setSound(v.closest('.clip').querySelector('.sound'), false);
      if (calm) v.pause();
    });
  }

  function bindClips() {
    document.querySelectorAll('main.page:not(.ghost) .window.clip').forEach(function (win) {
      var v = win.querySelector('video');
      var btn = win.querySelector('.sound');
      if (watcher) watcher.observe(v);
      btn.addEventListener('click', function () {
        if (!v.muted) { muteClips(); return; }
        muteClips();
        audio.pause();
        stopEmbed();
        v.muted = false;
        setSound(btn, true);
        v.play().catch(function () {});
      });
    });
  }

  // ---------- page swaps ----------

  // Internal links swap main.page in place instead of loading a new page,
  // so the glass, the dock and whatever is playing stay and nothing
  // flashes. Pages are fetched on hover, so most swaps are instant. Like
  // the Mac OS 9 Finder opening a folder, outline rectangles zoom out from
  // the row you clicked to the window that opens, and back in for ../.
  var cache = {};
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  function get(url) {
    var key = url.split('#')[0];
    if (!cache[key]) {
      cache[key] = fetch(key).then(function (r) {
        if (!r.ok && r.status !== 404) throw new Error(r.status);
        return r.text();
      });
      cache[key].catch(function () { delete cache[key]; });
    }
    return cache[key];
  }

  function internal(a) {
    return a && !a.target && !a.hasAttribute('download') && a.origin === location.origin && /\/$/.test(a.pathname);
  }

  // the window a page is about: the first one beside the directory
  function focusWindow(main) {
    return main.querySelector('.desk > .side > .window') ||
      main.querySelector('.desk .window:not(.directory)') ||
      main.querySelector('.desk .window');
  }

  function zoom(from, to) {
    if (calm.matches || !from || !to) return Promise.resolve();
    return new Promise(function (done) {
      var layer = document.createElement('div');
      layer.className = 'zoom';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
      var steps = 6; // from the row itself to the window itself
      for (var i = 1; i <= steps; i++) (function (i) {
        setTimeout(function () {
          var k = 1 - Math.pow(1 - (i - 1) / (steps - 1), 2); // big steps first, settling in
          var r = document.createElement('span');
          r.style.left = from.left + (to.left - from.left) * k + 'px';
          r.style.top = from.top + (to.top - from.top) * k + 'px';
          r.style.width = from.width + (to.width - from.width) * k + 'px';
          r.style.height = from.height + (to.height - from.height) * k + 'px';
          layer.appendChild(r);
          setTimeout(function () { r.remove(); }, 60);
          if (i === steps) setTimeout(function () { layer.remove(); done(); }, 60);
        }, (i - 1) * 22);
      })(i);
    });
  }

  function swap(html, url, push, from) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var main = doc.querySelector('main.page');
    if (!main) throw new Error('no page');
    var current = document.querySelector('main.page:not(.ghost)');
    main = document.adoptNode(main);
    if (from && !calm.matches) main.classList.add('unveil'); // windows wait for the zoom
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
    var win = focusWindow(main);
    return zoom(from, win && win.getBoundingClientRect()).then(function () {
      main.classList.remove('unveil');
    });
  }

  function go(a) {
    var url = a.href;
    if (!history.state) history.replaceState({ swapped: true }, '');
    var row = a.closest('.row');
    var from = (row || a).getBoundingClientRect();
    var up = row && row.textContent.trim().indexOf('../') === 0;
    if (row) row.classList.add('opening'); // selected while it opens
    document.documentElement.classList.add('busy');
    var current = document.querySelector('main.page:not(.ghost)');
    var win = up && focusWindow(current);
    // ../ closes: the zoom runs from the window back into the row first
    var closing = up ? zoom(win && win.getBoundingClientRect(), from) : Promise.resolve();
    Promise.all([get(url), closing])
      .then(function (r) { return swap(r[0], url, true, up ? null : from); })
      .catch(function () { location.href = url; })
      .then(function () { document.documentElement.classList.remove('busy'); });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a[href]');
    if (!a || a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
    if (!internal(a)) {
      if (!started) return; // a file: it opens as usual
      e.preventDefault(); // once something plays, files open in a new tab so it keeps going
      window.open(a.href, '_blank', 'noopener');
      return;
    }
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    go(a);
  });
  ['pointerover', 'focusin'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (internal(a) && a.pathname !== location.pathname) get(a.href).catch(function () {});
    });
  });
  window.addEventListener('popstate', function (e) {
    if (!e.state || !e.state.swapped) return;
    var url = location.href;
    get(url).then(function (html) { return swap(html, url, false, null); }).catch(function () { location.reload(); });
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

  // ---------- moving windows (desktop only) ----------

  // Like the spatial Finder, every window remembers its own place for the
  // browser session. The directory is the one window on every page, so it
  // keeps its place everywhere; any other window keeps its place on its own
  // page (data-path on main.page, the same for /music/ and its first
  // entry), and a page you have not arranged opens in its plain layout.
  // On a new page the directory starts behind the other windows, so moving
  // it never covers what the page is about.
  var desktop = window.matchMedia('(pointer: fine) and (min-width: 761px)');
  var placed = {};
  try { placed = JSON.parse(sessionStorage.getItem('ys-spots')) || {}; } catch (e) {}
  var front = 10; // z-index of the window most recently touched
  Object.keys(placed).forEach(function (k) { front = Math.max(front, placed[k][2] || 0); });

  function keyOf(win) {
    if (win.classList.contains('directory')) return 'directory';
    var main = win.closest('main.page');
    var all = [].slice.call(main.querySelectorAll('.desk .window'));
    return (main.getAttribute('data-path') || location.pathname) + ' ' + all.indexOf(win);
  }
  function save() {
    try { sessionStorage.setItem('ys-spots', JSON.stringify(placed)); } catch (e) {}
  }
  // box: where the layout puts the window. The title bar stays within reach:
  // below the top of the page, and at least 80px inside the viewport.
  function place(win, box, x, y) {
    var vw = document.documentElement.clientWidth;
    x = Math.min(Math.max(x, 80 - box.right), vw - 80 - box.left);
    y = Math.max(y, -(box.top + window.scrollY));
    win.style.transform = x || y ? 'translate(' + x + 'px,' + y + 'px)' : '';
    win.dataset.x = x; win.dataset.y = y; // the offset actually applied
    return [x, y];
  }
  function layoutBox(win) {
    var r = win.getBoundingClientRect();
    var x = +win.dataset.x || 0, y = +win.dataset.y || 0;
    return { left: r.left - x, right: r.right - x, top: r.top - y };
  }

  function bindWindows() {
    if (!desktop.matches) return;
    var wins = [].slice.call(document.querySelectorAll('main.page:not(.ghost) .desk .window'));
    var boxes = wins.map(function (w) { return w.getBoundingClientRect(); });
    wins.forEach(function (w, i) {
      var p = placed[keyOf(w)];
      if (!p) return;
      place(w, boxes[i], p[0], p[1]);
      if (p[2] && !w.classList.contains('directory')) w.style.zIndex = p[2];
    });
  }

  function setDesktop() {
    document.documentElement.classList.toggle('can-move', desktop.matches);
    if (desktop.matches) { bindWindows(); return; }
    document.querySelectorAll('.desk .window').forEach(function (w) {
      w.style.transform = w.style.zIndex = '';
      delete w.dataset.x; delete w.dataset.y;
    });
  }
  if (desktop.addEventListener) desktop.addEventListener('change', setDesktop);
  document.documentElement.classList.toggle('can-move', desktop.matches);

  document.addEventListener('pointerdown', function (e) {
    if (!desktop.matches || e.button !== 0) return;
    var win = e.target.closest('main.page:not(.ghost) .desk .window');
    if (!win) return;
    var key = keyOf(win);
    var p = placed[key] || (placed[key] = [0, 0, 0]);
    win.style.zIndex = p[2] = ++front;
    save();
    var bar = e.target.closest('.titlebar');
    if (!bar || bar.parentElement !== win) return;
    e.preventDefault(); // no text selection while dragging
    var x0 = e.clientX, y0 = e.clientY;
    var box = layoutBox(win);
    var dx = +win.dataset.x || 0, dy = +win.dataset.y || 0;
    bar.setPointerCapture(e.pointerId);
    win.classList.add('moving');
    function move(ev) {
      var xy = place(win, box, dx + ev.clientX - x0, dy + ev.clientY - y0);
      p[0] = xy[0]; p[1] = xy[1];
    }
    function end() {
      win.classList.remove('moving');
      save();
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
      bar.removeEventListener('pointercancel', end);
    }
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  });

  function bindPage() {
    bindPlayer();
    bindThemes();
    bindGlitch();
    bindClips();
    bindWindows();
  }
  bindPage();
})();
