// Fill these in to show the buttons in the Contact section. Empty = hidden.
const LINKEDIN_URL = "https://www.linkedin.com/in/mehmet-emircan-dede";
const EMAIL = "m.emircan.dede34@gmail.com";

const WORK_VIDEOS = [
  "5173", "5174", "5175", "5176", "5177", "5178", "5179", "5180", "5181", "5182",
  "5183", "5184", "5185", "5186", "5187", "5188", "5189", "5190", "5192",
  "5193", "5194", "5195", "5196", "5197", "5198", "5200", "5201", "5202"
].map((id) => ({
  src: `videos/work/${id}.mp4`,
  poster: `videos/work/posters/${id}.jpg`,
  title: ""
}));

function selectPreviewVideos(items, limit) {
  if (limit <= 0) return [];
  return items
    .filter((item) => item.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, limit);
}

function isModalBackdropClick(target, modal) {
  return target === modal;
}

function configurePreviewVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WORK_VIDEOS, configurePreviewVideo, selectPreviewVideos, isModalBackdropClick };
}

if (typeof document !== "undefined") (function () {
  "use strict";

  // Contact buttons
  const li = document.getElementById("linkedin");
  const em = document.getElementById("email");
  if (LINKEDIN_URL) { li.href = LINKEDIN_URL; li.hidden = false; }
  if (EMAIL) { em.href = "mailto:" + EMAIL; em.hidden = false; }
  document.getElementById("yr").textContent = new Date().getFullYear();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Playable-ad gallery
  const workGrid = document.getElementById("work-grid");
  const workModal = document.getElementById("work-modal");
  const modalVideo = workModal.querySelector("video");
  const modalClose = workModal.querySelector(".work-modal-close");
  const previewState = new Map();
  let lastWorkFocus = null;

  WORK_VIDEOS.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "work-card reveal";
    card.setAttribute("aria-label", item.title || `Open playable ad recording ${index + 1}`);

    const video = document.createElement("video");
    configurePreviewVideo(video);
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = item.poster;
    video.src = item.src;
    card.appendChild(video);

    if (item.title) {
      const title = document.createElement("h3");
      title.className = "work-card-title";
      title.textContent = item.title;
      card.appendChild(title);
    }

    card.addEventListener("click", () => {
      lastWorkFocus = card;
      previewState.forEach((state) => state.video.pause());
      modalVideo.src = item.src;
      modalVideo.poster = item.poster;
      modalVideo.muted = false;
      workModal.showModal();
      document.body.classList.add("modal-open");
      modalClose.focus();
      modalVideo.play().catch(() => {});
    });

    previewState.set(card, { video, ratio: 0 });
    workGrid.appendChild(card);
  });

  function syncWorkPreviews() {
    const selected = new Set(selectPreviewVideos(
      Array.from(previewState.values()),
      reduce || workModal.open ? 0 : 3
    ));
    previewState.forEach((state) => {
      if (selected.has(state)) state.video.play().catch(() => {});
      else state.video.pause();
    });
  }

  if ("IntersectionObserver" in window) {
    const workObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = previewState.get(entry.target);
        state.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      syncWorkPreviews();
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    previewState.forEach((state, card) => workObserver.observe(card));
  }

  function closeWorkModal() {
    if (!workModal.open) return;
    workModal.close();
  }

  function resetWorkModal() {
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalVideo.removeAttribute("poster");
    modalVideo.load();
    document.body.classList.remove("modal-open");
    syncWorkPreviews();
    if (lastWorkFocus) lastWorkFocus.focus();
    lastWorkFocus = null;
  }

  modalClose.addEventListener("click", closeWorkModal);
  workModal.addEventListener("close", resetWorkModal);
  workModal.addEventListener("click", (event) => {
    if (isModalBackdropClick(event.target, workModal)) closeWorkModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeWorkModal();
  });

  // Scroll reveal
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  // Stat count-up
  document.querySelectorAll("[data-count]").forEach((el) => {
    const to = +el.dataset.count;
    if (reduce || !("IntersectionObserver" in window)) return;
    el.textContent = "0";
    new IntersectionObserver((es, o) => {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      const t0 = performance.now();
      (function tick(t) {
        const k = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.6 }).observe(el);
  });

  // Hero particles: drift, follow the pointer, burst on tap
  const cv = document.getElementById("stage");
  const ctx = cv.getContext("2d");
  const COLORS = ["#7c5cff", "#22e6c7", "#ff4d8d", "#ffb23e"];
  const hint = document.getElementById("hint");
  let W = 0, H = 0, dpr = 1;
  let parts = [];
  let burst = [];
  const ptr = { x: -9999, y: -9999, on: false };
  let raf = 0, visible = true, last = 0, popped = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(110, Math.max(36, (W * H) / 14000)));
    parts = [];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: 2 + Math.random() * 4, c: COLORS[i % COLORS.length], sq: Math.random() < 0.4
      });
    }
    if (reduce) draw();
  }

  function step(dt) {
    for (const p of parts) {
      if (ptr.on) {
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < 22500 && d2 > 1) {
          const d = Math.sqrt(d2), f = (1 - d / 150) * 1.4;
          p.vx += (dx / d) * f * 0.15; p.vy += (dy / d) * f * 0.15;
        }
      }
      p.vx *= 0.985; p.vy *= 0.985;
      p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
    }
    for (let i = burst.length - 1; i >= 0; i--) {
      const b = burst[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 0.04 * dt; b.life -= dt;
      if (b.life <= 0) burst.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    // links between near particles and to the pointer
    for (let i = 0; i < parts.length; i++) {
      const a = parts[i];
      for (let j = i + 1; j < parts.length; j++) {
        const b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 8100) {
          ctx.globalAlpha = (1 - d2 / 8100) * 0.25;
          ctx.strokeStyle = a.c;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (ptr.on) {
        const dx = a.x - ptr.x, dy = a.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < 32400) {
          ctx.globalAlpha = (1 - d2 / 32400) * 0.5;
          ctx.strokeStyle = "#fff";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ptr.x, ptr.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 0.9;
    for (const p of parts) {
      ctx.fillStyle = p.c;
      if (p.sq) ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
    }
    for (const b of burst) {
      ctx.globalAlpha = Math.max(0, b.life / 50);
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.globalAlpha = 1;
  }

  function loop(t) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min((t - last) / 16.67 || 1, 3);
    last = t;
    step(dt); draw();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function pos(e) {
    const r = cv.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true;
  }
  // The canvas sits under the text, so listen on the hero section.
  const hero = cv.parentElement;
  hero.addEventListener("pointermove", pos, { passive: true });
  hero.addEventListener("pointerleave", () => { ptr.on = false; });
  hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a")) return;
    pos(e);
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + Math.random() * 0.4, s = 2 + Math.random() * 3;
      burst.push({ x: ptr.x, y: ptr.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: 2 + Math.random() * 2, c: COLORS[i % 4], life: 50 });
    }
    for (const p of parts) {
      const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy) || 1;
      if (d < 200) { p.vx += (dx / d) * 4; p.vy += (dy / d) * 4; }
    }
    popped++;
    if (popped === 1) hint.textContent = "Nice. Keep going.";
    else if (popped >= 10) hint.textContent = popped + " pops. Scroll down for the real games.";
    if (reduce) { step(1); draw(); }
  });

  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    visible ? start() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  window.addEventListener("resize", resize);

  resize();
  start();
})();
