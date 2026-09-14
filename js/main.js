/* Revolve Hair Studio — interactions
   Vanilla ports of a few Template Effects: FilmGrain, hero changing text,
   InfiniteMovingCards (reviews), ImageTextReveal (intro lines), DropText
   (hero headline), LogoCarousel (brand shelf), Lamp (reviews header),
   ZoomSlider (lookbook) and StickyContentWrapper (your appointment). */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- Drop text (port of drop-text.tsx) ---------- */
  var dropBlocks = Array.prototype.slice.call(document.querySelectorAll('[data-drop]'));
  dropBlocks.forEach(function (block) {
    var text = block.textContent;
    block.setAttribute('aria-label', text);
    block.textContent = '';
    Array.prototype.forEach.call(text, function (ch) {
      var span = document.createElement('span');
      span.className = 'drop-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      // random stagger, as the original's staggerFrom: "random"
      span.style.setProperty('--d', (0.15 + Math.random() * 0.55).toFixed(2) + 's');
      block.appendChild(span);
    });
  });
  function dropIn() {
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      requestAnimationFrame(function () { dropBlocks.forEach(function (b) { b.classList.add('is-dropped'); }); });
    });
  }

  /* ---------- Intro veil ---------- */
  var veil = document.getElementById('pageVeil');
  var hero = document.getElementById('hero');
  function openPage() {
    if (veil) veil.classList.add('is-done');
    if (hero) hero.classList.add('is-in');
    var heroLamp = document.getElementById('heroLamp');
    if (heroLamp) window.setTimeout(function () { heroLamp.classList.add('is-lit'); }, 300);
    dropIn();
  }
  if (reduceMotion) { openPage(); }
  else { window.setTimeout(openPage, 900); }
  window.addEventListener('load', function () { window.setTimeout(openPage, 200); });

  /* ---------- Header state ---------- */
  var header = document.getElementById('siteHeader');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById('menuToggle');
  var menu = document.getElementById('mobileMenu');
  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in-view'); revealObs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Count up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var start = null;
    var dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); countObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { countObs.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute('data-count'); });
  }

  /* ---------- Film grain (port of FilmGrain.tsx) ---------- */
  var MAX_TEXELS = 2000000;
  function paintGrain(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var w = canvas.width, h = canvas.height;
    if (w * h > MAX_TEXELS) {
      var k = Math.sqrt(MAX_TEXELS / (w * h));
      w = Math.max(1, Math.round(w * k));
      h = Math.max(1, Math.round(h * k));
    }
    var image = ctx.createImageData(w, h);
    var pixels = new Uint32Array(image.data.buffer);
    for (var i = 0; i < pixels.length; i++) {
      var v = (Math.random() * 256) | 0;
      pixels[i] = (0xff000000 | (v << 16) | (v << 8) | v) >>> 0;
    }
    ctx.putImageData(image, 0, 0);
  }
  var grains = document.querySelectorAll('[data-grain]');
  if (grains.length) {
    // one small tile, painted once, repeated as a background: far cheaper than
    // a blended full-section canvas per section
    var tile = document.createElement('canvas');
    tile.width = 180; tile.height = 180;
    tile.style.width = '180px'; tile.style.height = '180px';
    paintGrain(tile);
    var tileUrl = tile.toDataURL('image/png');
    grains.forEach(function (el) {
      el.style.opacity = el.getAttribute('data-amount') || '0.08';
      el.style.backgroundImage = 'url(' + tileUrl + ')';
    });
  }

  /* ---------- Hero changing text (port of code-hero-changing-text) ---------- */
  var swap = document.getElementById('wordSwap');
  if (swap && !reduceMotion) {
    var words = Array.prototype.slice.call(swap.querySelectorAll('.word'));
    var idx = 0;
    // size the box to the widest word so the layout never jumps
    var setHeight = function () {
      var maxW = 0;
      words.forEach(function (w) { maxW = Math.max(maxW, w.offsetWidth); });
      swap.style.minWidth = maxW + 'px';
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    window.setInterval(function () {
      var current = words[idx];
      idx = (idx + 1) % words.length;
      var next = words[idx];
      current.classList.remove('is-active');
      current.classList.add('is-leaving');
      next.classList.add('is-active');
      window.setTimeout(function () { current.classList.remove('is-leaving'); }, 800);
    }, 2600);
  }

  /* ---------- Parallax ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function updateParallax() {
    ticking = false;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var applied = parseFloat(el.dataset.py || '0');
      // measure from the untransformed position so the offset does not feed back on itself
      var top = rect.top - applied;
      if (top + rect.height < -300 || top > vh + 300) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
      var center = top + rect.height / 2 - vh / 2;
      var y = center * speed * -1;
      el.dataset.py = y;
      el.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
    });
  }
  if (!reduceMotion && !isTouch && parallaxEls.length) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); } }, { passive: true });
    updateParallax();
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.18).toFixed(1) + 'px,' + (y * 0.28).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- Image text reveal (port of code-scroll-text-reveal) ---------- */
  var revealLines = document.querySelectorAll('.reveal-line');
  var follower = document.getElementById('imgFollower');
  var followerImg = follower ? follower.querySelector('img') : null;
  if (revealLines.length) {
    var revealWidth = function () { return window.innerWidth < 768 ? 96 : Math.min(300, window.innerWidth * 0.2); };
    var lineData = Array.prototype.map.call(revealLines, function (line) {
      return { line: line, span: line.querySelector('.img-reveal') };
    });
    var updateReveal = function () {
      var vh = window.innerHeight;
      var target = revealWidth();
      lineData.forEach(function (d) {
        if (!d.span) return;
        var top = d.line.getBoundingClientRect().top;
        // scrub from top:85% of viewport to top:40%
        var start = vh * 0.85, end = vh * 0.4;
        var p = (start - top) / (start - end);
        p = Math.max(0, Math.min(1, p));
        d.span.style.width = (target * p).toFixed(1) + 'px';
      });
    };
    if (reduceMotion) {
      lineData.forEach(function (d) { if (d.span) d.span.style.width = revealWidth() + 'px'; });
    } else {
      var revTick = false;
      var onRev = function () { if (!revTick) { revTick = true; requestAnimationFrame(function () { revTick = false; updateReveal(); }); } };
      window.addEventListener('scroll', onRev, { passive: true });
      window.addEventListener('resize', onRev);
      updateReveal();
    }
    if (follower && !isTouch) {
      var fx = 0, fy = 0, tx = 0, ty = 0, following = false, followRaf = 0;
      var loop = function () {
        fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12;
        follower.style.left = fx + 'px'; follower.style.top = fy + 'px';
        // keep easing for a moment after leave so it settles, then stop the loop entirely
        if (following || Math.abs(tx - fx) + Math.abs(ty - fy) > 0.5) followRaf = requestAnimationFrame(loop);
        else followRaf = 0;
      };
      window.addEventListener('mousemove', function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!following) { fx = tx; fy = ty; }
        else if (!followRaf) followRaf = requestAnimationFrame(loop);
      });
      lineData.forEach(function (d) {
        if (!d.span) return;
        d.span.addEventListener('mouseenter', function () {
          followerImg.src = d.span.getAttribute('data-img');
          follower.classList.add('is-active'); following = true;
          if (!followRaf) followRaf = requestAnimationFrame(loop);
        });
        d.span.addEventListener('mouseleave', function () { follower.classList.remove('is-active'); following = false; });
      });
    }
  }

  /* ---------- Infinite moving cards (port of infinite-moving-cards) ---------- */
  document.querySelectorAll('.scroller').forEach(function (scroller) {
    var track = scroller.querySelector('.scroller-track');
    if (!track) return;
    Array.prototype.slice.call(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    var dir = scroller.getAttribute('data-direction') === 'right' ? 'reverse' : 'normal';
    var speed = scroller.getAttribute('data-speed');
    var dur = speed === 'fast' ? '40s' : speed === 'slow' ? '110s' : '70s';
    track.style.setProperty('--direction', dir);
    track.style.setProperty('--duration', dur);
    if (reduceMotion) track.style.animation = 'none';
  });

  /* ---------- Gallery filter + lightbox ---------- */
  var chips = document.querySelectorAll('.chip[data-filter]');
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  var masonry = document.getElementById('masonry');
  var moreBtn = document.getElementById('galleryMore');
  var INITIAL_TILES = 20;
  tiles.forEach(function (t, i) { if (i >= INITIAL_TILES) t.classList.add('is-extra'); });
  function expandGallery() {
    if (!masonry || masonry.classList.contains('is-expanded')) return;
    masonry.classList.add('is-expanded');
    if (moreBtn) moreBtn.parentNode.classList.add('is-done');
    tiles.forEach(function (t, i) { if (t.classList.contains('is-extra')) { t.style.animationDelay = ((i - INITIAL_TILES) % 10) * 40 + 'ms'; t.classList.add('is-entering'); } });
  }
  if (moreBtn) moreBtn.addEventListener('click', expandGallery);
  if (tiles.length <= INITIAL_TILES && moreBtn) moreBtn.parentNode.classList.add('is-done');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter');
      if (f !== 'all') expandGallery();
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-selected', String(c === chip)); });
      tiles.forEach(function (t, i) {
        var show = f === 'all' || t.getAttribute('data-cat') === f;
        t.classList.toggle('is-hidden', !show);
        t.classList.remove('is-entering');
        if (show) { void t.offsetWidth; t.style.animationDelay = (i % 8) * 40 + 'ms'; t.classList.add('is-entering'); }
      });
    });
  });

  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbIndex = 0;
  function visibleTiles() { return tiles.filter(function (t) { return !t.classList.contains('is-hidden') && getComputedStyle(t).display !== 'none'; }); }
  function showTile(i) {
    var list = visibleTiles();
    if (!list.length) return;
    lbIndex = (i + list.length) % list.length;
    var t = list[lbIndex];
    var img = t.querySelector('img');
    lbImg.src = img.src; lbImg.alt = img.alt;
    var cap = t.querySelector('figcaption');
    lbCap.textContent = cap ? cap.textContent.replace(/\s+/g, ' ').trim() : '';
  }
  function openLb(i) { showTile(i); lightbox.classList.add('is-open'); lightbox.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeLb() { lightbox.classList.remove('is-open'); lightbox.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  if (lightbox) {
    tiles.forEach(function (t) {
      t.setAttribute('tabindex', '0');
      t.setAttribute('role', 'button');
      t.addEventListener('click', function () { openLb(visibleTiles().indexOf(t)); });
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(visibleTiles().indexOf(t)); } });
    });
    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', function () { showTile(lbIndex - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { showTile(lbIndex + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') showTile(lbIndex - 1);
      if (e.key === 'ArrowRight') showTile(lbIndex + 1);
    });
  }

  /* ---------- Accordion: one open at a time ---------- */
  var acc = document.getElementById('accordion');
  if (acc) {
    acc.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) acc.querySelectorAll('details').forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  /* ---------- Hours: highlight today ---------- */
  var hoursItems = document.querySelectorAll('.hours li');
  if (hoursItems.length === 7) {
    var day = new Date().getDay(); // 0 = Sunday
    var map = [6, 0, 1, 2, 3, 4, 5]; // list starts on Monday
    hoursItems[map[day]].classList.add('is-today');
  }

  /* ---------- Brand carousel (port of logo-carousel.tsx) ---------- */
  var brandWrap = document.getElementById('brandCarousel');
  if (brandWrap) {
    var brands = brandWrap.getAttribute('data-brands').split('|');
    var colCount = brandWrap.clientWidth < 420 ? 2 : 3;
    brandWrap.style.gridTemplateColumns = 'repeat(' + colCount + ', minmax(0, 1fr))';
    // shuffle, then deal round-robin into columns and pad short columns
    var shuffled = brands.slice().sort(function () { return Math.random() - 0.5; });
    var columns = [];
    for (var c = 0; c < colCount; c++) columns.push([]);
    shuffled.forEach(function (b, i) { columns[i % colCount].push(b); });
    var maxLen = Math.max.apply(null, columns.map(function (col) { return col.length; }));
    columns.forEach(function (col) { while (col.length < maxLen) col.push(shuffled[Math.floor(Math.random() * shuffled.length)]); });

    var makeName = function (text, cls) {
      var el = document.createElement('span');
      el.className = 'brand-name ' + cls;
      el.textContent = text;
      return el;
    };
    var setColActive = function (col, i) {
      col.names.forEach(function (nm, k) {
        var wasActive = nm.classList.contains('is-active');
        nm.classList.remove('is-leaving');
        if (k === i) { nm.classList.add('is-active'); }
        else { nm.classList.remove('is-active'); if (wasActive) nm.classList.add('is-leaving'); }
      });
    };
    // safety net for browsers without container units: shrink any name wider than its column
    var fitName = function (el) {
      var col = el.parentNode;
      if (!col) return;
      var size = parseFloat(getComputedStyle(el).fontSize);
      var guard = 0;
      var textWidth = function () {
        var range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect().width;
      };
      while (textWidth() > col.clientWidth - 24 && size > 11 && guard < 20) {
        size -= 1; el.style.fontSize = size + 'px'; guard++;
      }
    };
    var cols = columns.map(function (list, i) {
      var col = document.createElement('div');
      col.className = 'brand-col';
      var names = list.map(function (b) { var el = makeName(b, ''); col.appendChild(el); return el; });
      brandWrap.appendChild(col);
      names.forEach(fitName);
      var entry = { el: col, list: list, names: names, index: 0 };
      // stagger the first appearance like the original's column delay
      window.setTimeout(function () { setColActive(entry, 0); }, 120 + i * 200);
      return entry;
    });
    if (!reduceMotion) {
      // named brandTick etc. so they cannot collide with the lookbook's tick() below (all vars share the IIFE scope)
      var brandCycle = 2800, brandDelay = 200, brandTick = 100, brandElapsed = 0;
      window.setInterval(function () {
        brandElapsed += brandTick;
        cols.forEach(function (col, i) {
          var adjusted = (brandElapsed + i * brandDelay) % (brandCycle * col.list.length);
          var next = Math.floor(adjusted / brandCycle);
          if (next === col.index) return;
          col.index = next;
          setColActive(col, next);
        });
      }, brandTick);
    }
  }

  /* ---------- Lamp (port of lamp.tsx) ---------- */
  var lamp = document.getElementById('lamp');
  if (lamp) {
    if ('IntersectionObserver' in window && !reduceMotion) {
      var lampObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { lamp.classList.add('is-lit'); lampObs.disconnect(); } });
      }, { threshold: 0.4 });
      lampObs.observe(lamp);
    } else {
      lamp.classList.add('is-lit');
    }
  }

  /* ---------- Lookbook (port of zoom-slider.tsx) ---------- */
  var lookbook = document.getElementById('lookbook');
  var strip = document.getElementById('lookbookStrip');
  var caption = document.getElementById('lookbookCaption');
  if (lookbook && strip) {
    var cards = Array.prototype.slice.call(strip.querySelectorAll('.lb-card'));
    var count = cards.length;
    var sticky = lookbook.querySelector('.lookbook-sticky');
    var lbState = { current: 0, target: 0, drag: 0, dragging: false, lastX: 0, lastY: 0, velocity: 0, active: -1 };
    var dims = {};
    var lerp = function (a, b, n) { return a + (b - a) * n; };
    var measure = function () {
      var vw = window.innerWidth, vh = window.innerHeight;
      var mobile = vw < 640, tablet = vw >= 640 && vw < 1025;
      dims.vw = vw; dims.vh = vh;
      dims.wMax = mobile ? 250 : tablet ? 440 : 560;
      dims.hMax = Math.round(vh * (mobile ? 0.5 : 0.62));
      dims.hMin = mobile ? 80 : 50;
      dims.step = dims.wMax;
      dims.bottom = vh - (mobile ? 120 : 130);
      dims.ease = 2 * vw;
      dims.loop = count * dims.step;
    };
    measure();
    window.addEventListener('resize', measure);
    // quadratic ease in the left zone, linear after: the "zoom" of the original
    var mapVtoX = function (v) {
      if (v <= 0) return 0;
      if (v >= dims.ease) return v - dims.ease / 2;
      return (v * v) / (2 * dims.ease);
    };
    var position = function (offset) {
      var norm = ((offset % dims.loop) + dims.loop) % dims.loop;
      var startIndex = Math.floor(norm / dims.step);
      var frac = (norm % dims.step) / dims.step;
      var bestScale = 0, best = -1;
      for (var i = 0; i < count; i++) {
        var ci = (startIndex + i) % count;
        var vOff = (i - frac) * dims.step;
        var x = mapVtoX(vOff);
        var nx = mapVtoX(vOff + dims.step);
        var w = nx - x;
        var scale = w / dims.wMax;
        var h = dims.hMin + scale * (dims.hMax - dims.hMin);
        var card = cards[ci];
        card.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + (dims.bottom - h).toFixed(1) + 'px,0)';
        var img = card.firstElementChild;
        img.style.width = w.toFixed(1) + 'px';
        img.style.height = h.toFixed(1) + 'px';
        if (x < dims.vw * 0.7 && scale > bestScale) { bestScale = scale; best = ci; }
      }
      if (best !== lbState.active) setActive(best);
    };
    var setActive = function (i) {
      lbState.active = i;
      cards.forEach(function (c, k) { c.classList.toggle('is-active', k === i); });
      if (!caption || i < 0) return;
      var c = cards[i];
      caption.classList.remove('is-in');
      void caption.offsetWidth;
      caption.querySelector('.lc-num > span').textContent = c.getAttribute('data-num');
      caption.querySelector('.lc-title > span').textContent = c.getAttribute('data-title');
      caption.querySelector('.lc-desc > span').textContent = c.getAttribute('data-desc');
      requestAnimationFrame(function () { caption.classList.add('is-in'); });
    };
    var scrollBase = function () {
      var rect = lookbook.getBoundingClientRect();
      var travel = lookbook.offsetHeight - dims.vh;
      var p = Math.max(0, Math.min(1, -rect.top / travel));
      // one and a half loops across the pinned distance
      return p * dims.loop * 1.5;
    };
    var running = false;
    var tick = function () {
      if (!lbState.dragging && Math.abs(lbState.velocity) > 0.1 && !reduceMotion) {
        lbState.drag += lbState.velocity;
        lbState.velocity *= 0.92;
      } else if (!lbState.dragging) { lbState.velocity = 0; }
      lbState.target = scrollBase() + lbState.drag;
      lbState.current = lerp(lbState.current, lbState.target, reduceMotion ? 1 : lbState.dragging ? 0.22 : 0.09);
      position(lbState.current);
      var rect = lookbook.getBoundingClientRect();
      running = rect.bottom > -200 && rect.top < dims.vh + 200;
      if (running || Math.abs(lbState.current - lbState.target) > 0.5) requestAnimationFrame(tick);
      else running = false;
    };
    var wake = function () { if (!running) { running = true; requestAnimationFrame(tick); } };
    window.addEventListener('scroll', wake, { passive: true });
    wake();
    // drag / swipe with momentum
    var begin = function (x, y) { lbState.dragging = true; lbState.lastX = x; lbState.lastY = y; lbState.velocity = 0; sticky.classList.add('is-dragging'); wake(); };
    var move = function (x, y, dir) {
      if (!lbState.dragging) return;
      var dx = x - lbState.lastX, dy = y - lbState.lastY;
      var raw = Math.abs(dx) >= Math.abs(dy) ? -dx : 0; // horizontal only, so vertical swipes still scroll the page
      var d = raw * dir;
      lbState.drag += d;
      lbState.velocity = lerp(lbState.velocity, d, 0.5);
      lbState.lastX = x; lbState.lastY = y;
    };
    var end = function () { lbState.dragging = false; sticky.classList.remove('is-dragging'); };
    sticky.addEventListener('mousedown', function (e) { if (e.button === 0) { e.preventDefault(); begin(e.clientX, e.clientY); } });
    window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY, 1); });
    window.addEventListener('mouseup', end);
    sticky.addEventListener('touchstart', function (e) { begin(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    sticky.addEventListener('touchmove', function (e) { move(e.touches[0].clientX, e.touches[0].clientY, 1); }, { passive: true });
    sticky.addEventListener('touchend', end);
    sticky.addEventListener('touchcancel', end);
  }

  /* ---------- Your appointment (port of sticky-content-wrapper.tsx) ---------- */
  var journey = document.getElementById('journey');
  if (journey) {
    var steps = Array.prototype.slice.call(journey.querySelectorAll('.journey-step'));
    var dots = Array.prototype.slice.call(journey.querySelectorAll('.journey-dots li'));
    var imgs = Array.prototype.slice.call(journey.querySelectorAll('.journey-img'));
    var n = steps.length;
    imgs.forEach(function (im, i) { im.style.zIndex = String(n - i); });
    var jActive = 0;
    var setStep = function (i) {
      if (i === jActive) return;
      jActive = i;
      steps.forEach(function (st, k) { st.classList.toggle('is-active', k === i); st.classList.toggle('is-past', k < i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('is-mobile-active', k === i); });
    };
    imgs[0].classList.add('is-mobile-active');
    var isStacked = function () { return window.innerWidth <= 900; };
    var jTick = false;
    var updateJourney = function () {
      jTick = false;
      if (isStacked()) return;
      var rect = journey.getBoundingClientRect();
      var travel = journey.offsetHeight - window.innerHeight;
      var p = Math.max(0, Math.min(1, -rect.top / travel));
      // hold on the first and last steps a little longer than the middle ones
      var seg = p * (n - 1);
      setStep(Math.min(n - 1, Math.round(seg)));
      for (var i = 0; i < n - 1; i++) {
        var t = Math.max(0, Math.min(1, seg - i));
        // the current photo wipes away from the bottom while easing larger, revealing the next one beneath
        var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        imgs[i].style.clipPath = 'inset(0 0 ' + (eased * 100).toFixed(2) + '% 0)';
        imgs[i].style.transform = 'scale(' + (1 + eased * 0.08).toFixed(3) + ')';
      }
    };
    var onJourney = function () { if (!jTick) { jTick = true; requestAnimationFrame(updateJourney); } };
    window.addEventListener('scroll', onJourney, { passive: true });
    window.addEventListener('resize', onJourney);
    updateJourney();
    // stacked layout: swap the photo as each step scrolls into view
    if ('IntersectionObserver' in window) {
      var stepObs = new IntersectionObserver(function (entries) {
        if (!isStacked()) return;
        entries.forEach(function (entry) { if (entry.isIntersecting) setStep(steps.indexOf(entry.target)); });
      }, { rootMargin: '-40% 0px -40% 0px' });
      steps.forEach(function (st) { stepObs.observe(st); });
    }
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
