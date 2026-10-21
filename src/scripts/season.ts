/* ==========================================================================
   Season effects: falling leaves (autumn) or snow (winter) on any
   <canvas data-season-fx="autumn|winter">, and the poke reaction on Dangos.
   Safe to call more than once. With reduced motion nothing moves.
   ========================================================================== */

const motionOn = () => document.documentElement.classList.contains("motion");

export function initSeason() {
  initPokes();
  initTimeOfDay();
  initHunt();
  if (!motionOn()) return;
  initDusk();
  document.querySelectorAll<HTMLCanvasElement>("canvas[data-season-fx]").forEach((c) => {
    if (c.dataset.ready) return;
    c.dataset.ready = "1";
    fall(c);
  });
}

/* --------------------------------------------------------------------------
   Time of day: on the homepage the light changes as you climb down the tree,
   from a cool morning, through a warm golden afternoon, to a lavender dusk.
   Only the light section colours move; text colours stay put.
   -------------------------------------------------------------------------- */

type Stop = { p: number; paper: string; paper2: string; birch: string; sage: string };
const DAY: Stop[] = [
  // the walk down the tree, from the hero's golden afternoon to dusk by the lake
  { p: 0.0, paper: "#f5ecda", paper2: "#ebdfc5", birch: "#fbf6ea", sage: "#ece5c6" }, // afternoon, the hero's light
  { p: 0.3, paper: "#f6ead3", paper2: "#ecdbbb", birch: "#fcf4e4", sage: "#eee2bd" }, // golden hour
  { p: 0.55, paper: "#f7e6d2", paper2: "#eed6bb", birch: "#fcf1e5", sage: "#efdcc0" }, // low sun
  { p: 0.74, paper: "#f5e2d8", paper2: "#ead0c4", birch: "#fbefe9", sage: "#ecd6cc" }, // sunset glow
  { p: 0.88, paper: "#ebe0e0", paper2: "#dccdd0", birch: "#f5eeee", sage: "#e2d6d8" }, // dusk rose
  { p: 1.0, paper: "#e4dfe6", paper2: "#d3cdd8", birch: "#f0edf2", sage: "#dbd6e0" }, // blue hour
];
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

function initTimeOfDay() {
  const root = document.documentElement;
  if (!document.querySelector("[data-hero]") || root.dataset.todReady) return;
  root.dataset.todReady = "1";
  root.classList.add("daylight");
  const footer = document.querySelector<HTMLElement>(".th-footer");
  let raf = 0, last = -1;
  const update = () => {
    raf = 0;
    const end = (footer ? footer.getBoundingClientRect().top + scrollY : document.body.scrollHeight) - innerHeight;
    const p = Math.round(Math.min(1, Math.max(0, scrollY / Math.max(1, end))) * 400) / 400;
    if (p === last) return;
    last = p;
    let i = 0;
    while (i < DAY.length - 2 && p > DAY[i + 1].p) i++;
    const a = DAY[i], b = DAY[i + 1];
    const t = Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p)));
    root.style.setProperty("--paper", mix(a.paper, b.paper, t));
    root.style.setProperty("--paper-2", mix(a.paper2, b.paper2, t));
    root.style.setProperty("--birch", mix(a.birch, b.birch, t));
    root.style.setProperty("--sage", mix(a.sage, b.sage, t));
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener("resize", () => { last = -1; update(); });
  update();
}

/* --------------------------------------------------------------------------
   Hidden Dangos: tap or click one to find it. Find them all and the
   northern lights come on over the campfire. Remembered for this visit.
   -------------------------------------------------------------------------- */

function initHunt() {
  const spots = Array.from(document.querySelectorAll<HTMLElement>("[data-hidden-dango]"));
  if (!spots.length || document.documentElement.dataset.huntReady) return;
  document.documentElement.dataset.huntReady = "1";
  const total = spots.length;
  const KEY = "dango-found";
  let found = new Set<string>();
  try { found = new Set(JSON.parse(sessionStorage.getItem(KEY) || "[]")); } catch {}
  const stage = document.querySelector<HTMLElement>("[data-stage]");

  const announce = () => {
    const n = spots.filter((s) => found.has(s.dataset.hiddenDango!)).length;
    dispatchEvent(new CustomEvent("dango:found", { detail: { found: n, total } }));
    if (n === total) stage?.classList.add("is-aurora");
  };
  spots.forEach((spot) => {
    const id = spot.dataset.hiddenDango!;
    if (found.has(id)) spot.classList.add("is-found");
    spot.querySelector("[data-dango]")?.addEventListener("click", () => {
      if (found.has(id)) return;
      found.add(id);
      spot.classList.add("is-found");
      try { sessionStorage.setItem(KEY, JSON.stringify([...found])); } catch {}
      announce();
    });
  });
  // let the guide's counter catch up once he exists
  setTimeout(announce, 0);
}

/* --------------------------------------------------------------------------
   Hero dusk: as the hero scrolls away it turns to dusk (the existing overlay);
   --dusk lets the mushrooms' light pools and the Dangos' glow follow along.
   -------------------------------------------------------------------------- */

function initDusk() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero || hero.dataset.duskReady) return;
  hero.dataset.duskReady = "1";
  let raf = 0;
  const update = () => {
    raf = 0;
    const p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.85)));
    hero.style.setProperty("--dusk", p.toFixed(3));
  };
  window.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* --------------------------------------------------------------------------
   Poke a Dango: hover with a mouse, tap on a phone
   -------------------------------------------------------------------------- */

function initPokes() {
  if (!motionOn()) return;
  const hover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  document.querySelectorAll<SVGGElement>("[data-dango]").forEach((d) => {
    if (d.dataset.ready) return;
    d.dataset.ready = "1";
    const boing = () => {
      if (d.classList.contains("is-boing")) return;
      d.classList.add("is-boing");
      setTimeout(() => d.classList.remove("is-boing"), 900);
    };
    if (hover) d.addEventListener("pointerenter", boing);
    d.addEventListener("click", boing);
  });
}

/* --------------------------------------------------------------------------
   Falling leaves / snow
   -------------------------------------------------------------------------- */

type Bit = {
  x: number;
  y: number;
  vy: number;
  sway: number;
  swaySpeed: number;
  p: number;
  r: number;
  spin: number;
  rot: number;
  flip: number;
  color: string;
  kind: number;
};

const LEAF_COLORS = ["#d4622e", "#e8963a", "#f2c14e", "#b8432a", "#c9a03b", "#e07b39"];

function fall(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const host = canvas.parentElement as HTMLElement;
  const snow = canvas.dataset.seasonFx === "winter";
  const density = parseFloat(canvas.dataset.density ?? "1");
  // Where the bits may start, as a share of the width (keeps the headline side calm)
  const fromX = parseFloat(canvas.dataset.from ?? "0");

  let w = 0,
    h = 0,
    dpr = 1,
    raf = 0,
    running = false,
    visible = false;
  let bits: Bit[] = [];

  const make = (anywhere: boolean): Bit => {
    const wide = w >= 760;
    const x0 = wide ? fromX * w : 0;
    return {
      x: x0 + Math.random() * (w - x0),
      y: anywhere ? Math.random() * h : -20 - Math.random() * 60,
      vy: snow ? 0.35 + Math.random() * 0.6 : 0.45 + Math.random() * 0.55,
      sway: snow ? 8 + Math.random() * 16 : 18 + Math.random() * 30,
      swaySpeed: 0.008 + Math.random() * 0.012,
      p: Math.random() * Math.PI * 2,
      r: snow ? 1.2 + Math.random() * 2.4 : 5 + Math.random() * 5,
      spin: (Math.random() - 0.5) * 0.04,
      rot: Math.random() * Math.PI * 2,
      flip: Math.random() * Math.PI * 2,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      kind: Math.random() < 0.45 ? 1 : 0,
    };
  };

  const resize = () => {
    const oldW = w;
    dpr = Math.min(2, devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (oldW === w && bits.length) return; // phone address bar showing or hiding: keep the bits
    const base = snow ? (w < 700 ? 40 : 90) : w < 700 ? 7 : 16;
    bits = Array.from({ length: Math.round(base * density) }, () => make(true));
  };

  // A simple leaf: almond shape with a midrib. kind 1 is a rounder birch leaf.
  const leaf = (b: Bit) => {
    const r = b.r;
    ctx.save();
    ctx.translate(b.x + Math.sin(b.p) * b.sway, b.y);
    ctx.rotate(b.rot);
    ctx.scale(Math.cos(b.flip) * 0.8 + 0.2 * Math.sign(Math.cos(b.flip) || 1), 1);
    ctx.fillStyle = b.color;
    ctx.beginPath();
    if (b.kind === 1) {
      ctx.ellipse(0, 0, r * 0.75, r, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(0, -r * 1.3);
      ctx.quadraticCurveTo(r * 1.1, -r * 0.2, 0, r * 1.2);
      ctx.quadraticCurveTo(-r * 1.1, -r * 0.2, 0, -r * 1.3);
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(90, 50, 25, 0.45)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.lineTo(0, r * 1.5);
    ctx.stroke();
    ctx.restore();
  };

  const flake = (b: Bit) => {
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(b.x + Math.sin(b.p) * b.sway, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < bits.length; i++) {
      const b = bits[i];
      b.p += b.swaySpeed;
      b.y += b.vy;
      b.rot += b.spin;
      b.flip += 0.03;
      if (b.y > h + 20) bits[i] = make(false);
      snow ? flake(b) : leaf(b);
    }
    raf = requestAnimationFrame(tick);
  };

  const sync = () => {
    const should = visible && !document.hidden;
    if (should && !running) {
      running = true;
      tick();
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", sync);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(host);
}
