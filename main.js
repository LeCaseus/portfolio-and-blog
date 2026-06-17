/* =========================================================================
   Chezter Vargas — interactivity
   ECG line, typewriter, clock, theme toggle, scroll-reveal, rail highlight
   ========================================================================= */

(() => {
  // ── Theme ─────────────────────────────────────────────────────────────
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('cv.theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', initialTheme);

  const themeBtn = document.querySelector('[data-theme-toggle]');
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    localStorage.setItem('cv.theme', t);
    if (themeBtn) themeBtn.textContent = t === 'dark' ? '☼ LIGHT' : '☾ DARK';
  };
  if (themeBtn) {
    themeBtn.textContent = initialTheme === 'dark' ? '☼ LIGHT' : '☾ DARK';
    themeBtn.addEventListener('click', () => {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // ── Clock (UTC) ───────────────────────────────────────────────────────
  const clocks = document.querySelectorAll('[data-clock]');
  const pad = (n) => String(n).padStart(2, '0');
  const tickClock = () => {
    const d = new Date();
    const s = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    clocks.forEach(el => el.textContent = s);
  };
  tickClock();
  setInterval(tickClock, 1000);

  // ── ECG line ──────────────────────────────────────────────────────────
  // Continuously draws a heartbeat trace that scrolls right-to-left.
  // REACTS to: scroll velocity (faster + taller spikes) and pointer over the
  // strip (hovering inflates amplitude; clicking spikes the trace = "stress").
  const ecgEl = document.querySelector('.ecg svg');
  const ecgWrap = document.querySelector('.ecg');
  const bpmEl = document.querySelector('[data-bpm]');
  if (ecgEl) {
    const W = 1200, H = 96;
    ecgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
    ecgEl.setAttribute('preserveAspectRatio', 'none');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    ecgEl.appendChild(path);

    const baseline = H * 0.55;
    // Reactive state
    let intensity = 1;      // 1.0 = calm, up to ~2.5 under stress
    let speedMul  = 1;      // base speed multiplier
    let lastScrollY = window.scrollY;
    let lastScrollT = performance.now();
    let pointerInside = false;
    let stressUntil = 0;

    // One heartbeat as relative offsets (x advance, y delta)
    const beatTpl = (k) => [
      [10, 0], [4, -2*k], [6, 2*k], [4, 0],
      [10, 0],
      [3, -4*k], [3, 14*k], [3, -42*k], [3, 32*k], [3, -4*k],
      [10, 0],
      [6, -2*k], [10, 6*k], [6, -4*k],
      [Math.max(8, 40 / Math.max(1, k)), 0],
    ];

    let pts = [];
    let cursorX = 0;
    const buildBeat = () => {
      let x = cursorX, y = baseline;
      for (const [dx, dy] of beatTpl(intensity)) {
        x += dx; y += dy;
        pts.push([x, y]);
      }
      cursorX = x + Math.random() * 14 / Math.max(1, intensity);
    };
    while (cursorX < W * 1.2) buildBeat();

    const render = () => {
      let d = '';
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        d += (i === 0 ? 'M' : 'L') + (x - scroll).toFixed(1) + ' ' + y.toFixed(1) + ' ';
      }
      path.setAttribute('d', d);
    };
    let scroll = 0;
    let last = performance.now();
    const BASE_SPEED = 80;
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t;
      // decay intensity toward target
      const target =
        (performance.now() < stressUntil) ? 2.4 :
        pointerInside ? 1.6 :
        1 + Math.min(1.2, scrollEnergy * 0.012);
      intensity += (target - intensity) * Math.min(1, dt * 4);
      speedMul   = 1 + (intensity - 1) * 0.6;
      // scroll energy decay
      scrollEnergy *= Math.max(0, 1 - dt * 2.2);

      scroll += BASE_SPEED * speedMul * dt;
      while (pts.length > 4 && pts[1][0] - scroll < -20) pts.shift();
      while (cursorX - scroll < W * 1.2) buildBeat();
      render();
      requestAnimationFrame(loop);
    };

    // scroll energy = |dY/dt|, smoothed
    let scrollEnergy = 0;
    window.addEventListener('scroll', () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScrollY);
      const dt = Math.max(16, now - lastScrollT);
      scrollEnergy = Math.min(120, scrollEnergy * 0.6 + (dy / dt) * 60);
      lastScrollY = window.scrollY;
      lastScrollT = now;
    }, { passive: true });

    if (ecgWrap) {
      ecgWrap.addEventListener('pointerenter', () => { pointerInside = true; });
      ecgWrap.addEventListener('pointerleave', () => { pointerInside = false; });
      ecgWrap.addEventListener('pointerdown', () => {
        stressUntil = performance.now() + 900;
      });
      // touch
      ecgWrap.addEventListener('touchstart', () => {
        pointerInside = true;
        stressUntil = performance.now() + 900;
      }, { passive: true });
      ecgWrap.addEventListener('touchend', () => { pointerInside = false; });
    }

    requestAnimationFrame(loop);

    // animated BPM number — scales with intensity
    if (bpmEl) {
      const update = () => {
        const base = 64 + (intensity - 1) * 42;
        const bpm = Math.round(base + Math.sin(Date.now() / 4200) * 3 + Math.random() * 2);
        bpmEl.textContent = Math.max(58, Math.min(168, bpm));
      };
      update();
      setInterval(update, 700);
    }
  }

  // ── Typewriter ────────────────────────────────────────────────────────
  const twEl = document.querySelector('[data-typewriter]');
  if (twEl) {
    const lines = JSON.parse(twEl.getAttribute('data-typewriter'));
    const cursor = '<span class="cursor"></span>';
    let li = 0, ci = 0, mode = 'type', pause = 0;
    const tick = () => {
      const cur = lines[li];
      if (mode === 'type') {
        ci++;
        if (ci > cur.length) { mode = 'hold'; pause = 38; }
      } else if (mode === 'hold') {
        pause--;
        if (pause <= 0) mode = (li === lines.length - 1) ? 'done' : 'erase';
      } else if (mode === 'erase') {
        ci--;
        if (ci <= 0) { mode = 'type'; li = (li + 1) % lines.length; }
      }
      twEl.innerHTML = cur.slice(0, ci) + cursor;
      if (mode !== 'done') {
        const d = mode === 'type' ? 32 + Math.random() * 30
              : mode === 'erase' ? 14
              : 60;
        setTimeout(tick, d);
      } else {
        twEl.innerHTML = cur + cursor;
      }
    };
    tick();
  }

  // ── Scroll-reveal ─────────────────────────────────────────────────────
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  // ── Rail active channel highlight ─────────────────────────────────────
  const railLinks = document.querySelectorAll('.rail a');
  const sections = [...document.querySelectorAll('section[id]')];
  const onScroll = () => {
    const y = window.scrollY + window.innerHeight * 0.35;
    let active = sections[0]?.id;
    for (const s of sections) {
      if (s.offsetTop <= y) active = s.id;
    }
    railLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + active));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* =========================================================================
   Dynamic content loaders
   Readings from posts/index.json · Notes from notes/index.json
   ========================================================================= */

// ── Readings (CH-03) ──────────────────────────────────────────────────
(async () => {
  const strip = document.querySelector('.readings .strip');
  if (!strip) return;
  try {
    const posts = await fetch('/api/posts').then(r => r.json());
    strip.innerHTML = posts.map(p => `
      <a class="read" href="blog.html#/${p.slug}">
        <span class="date">${p.date}</span>
        <span class="tag">${p.tags}</span>
        <span class="ttl">${p.title}</span>
        <span class="arrow">↗</span>
      </a>
    `).join('');
  } catch {
    strip.innerHTML = '<div class="note">// no readings found.</div>';
  }
})();

// ── Notes (CH-05) ─────────────────────────────────────────────────────
(async () => {
  const log = document.querySelector('.notes .log');
  if (!log) return;
  try {
    const notes = await fetch('/api/notes').then(r => r.json());

    // update entry count in the log bar
    const countEl = log.querySelector('[data-note-count]');
    if (countEl) countEl.textContent = String(notes.length).padStart(3, '0');

    const foot = log.querySelector('.log-foot');
    const entries = notes.map(n => {
      const tags = n.tags?.length
        ? `<div class="tags">${n.tags.map(t => `<span>${t}</span>`).join('')}</div>`
        : '';
      // use marked.parseInline if available, otherwise treat as plain text
      const msg = typeof marked !== 'undefined'
        ? marked.parseInline(n.msg)
        : n.msg;
      return `
        <div class="entry-row">
          <div class="ts">${n.ts}</div>
          <div class="lvl" data-lvl="${n.lvl}">${n.label}</div>
          <div class="msg">${msg}${tags}</div>
        </div>
      `;
    }).join('');

    // insert entries before the footer line
    foot.insertAdjacentHTML('beforebegin', entries);
  } catch (e) {
    console.error('[notes] load failed:', e);
  }
})();
