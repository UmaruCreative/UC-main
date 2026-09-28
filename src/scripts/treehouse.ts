/* ==========================================================================
   Treehouse motion engine
   Everything is driven by data attributes so pages stay plain HTML.
   With reduced motion (no .motion class on <html>) only the essentials run.
   ========================================================================== */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

const motionOn = () => document.documentElement.classList.contains("motion");
const canHover = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

let lenis: Lenis | null = null;

export function initMotion() {
  const motion = motionOn();

  if (motion) initSmoothScroll();
  initAnchors();
  initRail();

  if (!motion) return;

  initSplit();
  initReveals();
  initCounts();
  initDraw();
  initParallax();
  initMagnetic();
  initTilt();
  initHero();
  initRentOwn();
  initRooms();
  initLookout();
  initLadder();
  initLanternField();
  initBuild();
  initMarquee();

  // Fonts shift line heights; recalculate once they land
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

/* --------------------------------------------------------------------------
   Smooth scroll
   -------------------------------------------------------------------------- */

function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener("th:lock", () => lenis?.stop());
  window.addEventListener("th:unlock", () => lenis?.start());
}

function scrollToTarget(target: HTMLElement | number) {
  if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
  else if (typeof target === "number") window.scrollTo({ top: target });
  else target.scrollIntoView();
}

function initAnchors() {
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href*='#']");
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    scrollToTarget(el);
    history.pushState(null, "", url.hash);
  });
  if (location.hash) {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) setTimeout(() => scrollToTarget(el), 300);
  }
}

/* --------------------------------------------------------------------------
   Ladder rail
   -------------------------------------------------------------------------- */

function initRail() {
  const rail = document.querySelector<HTMLElement>("[data-rail]");
  if (!rail) return;
  const rungsEl = rail.querySelector<HTMLOListElement>("[data-rail-rungs]")!;
  const lantern = rail.querySelector<HTMLElement>("[data-rail-lantern]")!;
  const label = rail.querySelector<HTMLElement>("[data-rail-label]")!;
  const alt = rail.querySelector<HTMLElement>("[data-rail-alt]")!;
  const floors = $$("[data-floor]");
  if (!floors.length) return;

  const items = floors.map((floor, i) => {
    const li = document.createElement("li");
    li.style.top = `${(i / (floors.length - 1)) * 100}%`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", `${rail.dataset.goto ?? "Go to"} ${floor.dataset.floor}`);
    btn.addEventListener("click", () => scrollToTarget(floor));
    const tip = document.createElement("span");
    tip.className = "rail__tip";
    tip.textContent = floor.dataset.floor ?? "";
    li.append(btn, tip);
    rungsEl.append(li);
    return li;
  });

  const maxAlt = 18;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    lantern.style.transform = `translateY(calc(${p} * ${rail.clientHeight}px - 50%))`;
    alt.textContent = (maxAlt * (1 - p)).toFixed(1);

    let active = 0;
    floors.forEach((f, i) => {
      if (f.getBoundingClientRect().top < innerHeight * 0.5) active = i;
    });
    items.forEach((li, i) => li.classList.toggle("is-active", i === active));
    const text = floors[active].dataset.floor ?? "";
    if (label.textContent !== text) label.textContent = text;

    const mid = innerHeight / 2;
    const night = $$("[data-night]").some((n) => {
      const r = n.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    rail.classList.toggle("is-night", night);
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* --------------------------------------------------------------------------
   Split headings into masked words
   -------------------------------------------------------------------------- */

function splitWords(root: HTMLElement) {
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? "";
        if (!text.trim()) return;
        const frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(" "));
            return;
          }
          const outer = document.createElement("span");
          outer.className = "sw";
          const inner = document.createElement("span");
          inner.className = "sw-i";
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== "BR") {
        walk(child);
      }
    });
  };
  walk(root);
  return $$(".sw-i", root);
}

function initSplit() {
  const style = document.createElement("style");
  style.textContent =
    ".sw{display:inline-block;overflow:hidden;vertical-align:top;padding:0.08em 0.02em 0.1em;margin:-0.08em -0.02em -0.1em}.sw-i{display:inline-block;will-change:transform}";
  document.head.append(style);

  $$("[data-split]").forEach((el) => {
    if (el.closest("[data-hero]")) return; // hero runs its own intro
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115, rotate: 4 });
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () =>
        gsap.to(words, { yPercent: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.045 }),
    });
  });
}

/* --------------------------------------------------------------------------
   Reveals, staggers, counters, strokes, parallax
   -------------------------------------------------------------------------- */

function initReveals() {
  $$("[data-reveal]").forEach((el) => {
    const delay = parseFloat(el.dataset.delay ?? "0");
    gsap.to(el, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.1,
      delay,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
  $$("[data-stagger]").forEach((el) => {
    gsap.to(el.children, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: parseFloat(el.dataset.stagger || "0.09"),
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

function initCounts() {
  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count ?? el.textContent ?? "0");
    const decimals = parseInt(el.dataset.decimals ?? "0", 10);
    const obj = { v: 0 };
    const fmt = (v: number) =>
      v.toLocaleString(document.documentElement.lang || "en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    el.textContent = fmt(0);
    gsap.to(obj, {
      v: end,
      duration: 2,
      ease: "power3.out",
      onUpdate: () => (el.textContent = fmt(obj.v)),
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
}

function prepStroke(path: SVGGeometryElement) {
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  return len;
}

function initDraw() {
  $$("[data-draw]").forEach((group) => {
    const paths = $$<SVGGeometryElement>("path, line, polyline, circle, rect, ellipse", group).filter(
      (p) => getComputedStyle(p).stroke !== "none"
    );
    paths.forEach(prepStroke);
    const scrub = group.dataset.draw === "scrub";
    gsap.to(paths, {
      strokeDashoffset: 0,
      duration: 2.2,
      ease: "power2.inOut",
      stagger: 0.06,
      scrollTrigger: scrub
        ? { trigger: group, start: "top 85%", end: "bottom 60%", scrub: 1 }
        : { trigger: group, start: "top 85%", once: true },
    });
  });
}

function initParallax() {
  $$("[data-parallax]").forEach((el) => {
    const speed = parseFloat(el.dataset.parallax ?? "0.2");
    gsap.fromTo(
      el,
      { y: () => -speed * 120 },
      {
        y: () => speed * 120,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      }
    );
  });
}

function initMagnetic() {
  if (!canHover()) return;
  $$("[data-magnetic]").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.28);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener("pointerleave", () => {
      xTo(0);
      yTo(0);
    });
  });
}

function initTilt() {
  if (!canHover()) return;
  $$("[data-tilt]").forEach((el) => {
    const rx = gsap.quickTo(el, "rotateX", { duration: 0.8, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotateY", { duration: 0.8, ease: "power3.out" });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 7);
      rx(-py * 7);
      el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
      el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
    });
    el.addEventListener("pointerleave", () => {
      rx(0);
      ry(0);
    });
  });
}

/* --------------------------------------------------------------------------
   Hero: layered forest, intro, fireflies
   -------------------------------------------------------------------------- */

function initHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero) return;

  const heading = hero.querySelector<HTMLElement>("[data-split]");
  const words = heading ? splitWords(heading) : [];
  const layers = $$("[data-depth]", hero);
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });

  gsap.set(words, { yPercent: 115, rotate: 5 });
  intro
    .from(layers, { y: (i, el) => 80 + parseFloat((el as HTMLElement).dataset.depth ?? "0") * 260, opacity: 0, duration: 2, stagger: 0.08 }, 0)
    .from("[data-hero-sky]", { opacity: 0, duration: 1.6, ease: "power2.out" }, 0)
    .to(words, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.06 }, 0.35)
    .from($$("[data-hero-in]", hero), { y: 24, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.8)
    .from("[data-hero-window]", { opacity: 0, duration: 0.4, ease: "steps(3)" }, 1.4);

  // Scroll: layers slide at different speeds, the scene dims into dusk
  layers.forEach((layer) => {
    const d = parseFloat(layer.dataset.depth ?? "0");
    gsap.to(layer, {
      yPercent: d * 38,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  });
  gsap.to("[data-hero-copy]", {
    yPercent: -30,
    opacity: 0.2,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to("[data-hero-dusk]", {
    opacity: 1,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
  });

  // Pointer parallax on the scene
  if (canHover()) {
    const movers = layers.map((l) => ({
      d: parseFloat(l.dataset.depth ?? "0"),
      x: gsap.quickTo(l, "x", { duration: 1.2, ease: "power3.out" }),
    }));
    hero.addEventListener("pointermove", (e) => {
      const px = e.clientX / innerWidth - 0.5;
      movers.forEach((m) => m.x(-px * m.d * 60));
    });
  }

  const canvas = hero.querySelector<HTMLCanvasElement>("[data-fireflies]");
  if (canvas) fireflies(canvas, hero);
}

function fireflies(canvas: HTMLCanvasElement, host: HTMLElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let w = 0,
    h = 0,
    dpr = 1,
    running = false,
    raf = 0;
  const count = innerWidth < 700 ? 22 : 46;
  type Fly = { x: number; y: number; vx: number; vy: number; r: number; p: number; s: number };
  let flies: Fly[] = [];

  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Wide screens: fireflies live on the treehouse side. Narrow: below the text.
    const wide = w >= 760;
    flies = Array.from({ length: count }, () => ({
      x: wide ? w * 0.5 + Math.random() * w * 0.5 : Math.random() * w,
      y: wide ? h * 0.35 + Math.random() * h * 0.65 : h * 0.72 + Math.random() * h * 0.28,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.2,
      r: 1 + Math.random() * 1.8,
      p: Math.random() * Math.PI * 2,
      s: 0.01 + Math.random() * 0.025,
    }));
  };

  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    for (const f of flies) {
      f.p += f.s;
      f.vx += (Math.random() - 0.5) * 0.02;
      f.vy += (Math.random() - 0.5) * 0.02;
      f.vx *= 0.98;
      f.vy *= 0.98;
      f.x += f.vx;
      f.y += f.vy;
      const minX = w >= 760 ? w * 0.48 : -10;
      const minY = w >= 760 ? h * 0.25 : h * 0.68;
      if (f.x < minX) f.x = w + 10;
      if (f.x > w + 10) f.x = minX;
      if (f.y < minY) f.vy += 0.01;
      if (f.y > h + 10) f.y = h * 0.4;
      const a = 0.35 + Math.sin(f.p) * 0.35;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 7);
      g.addColorStop(0, `rgba(255, 214, 130, ${a})`);
      g.addColorStop(1, "rgba(255, 214, 130, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255, 240, 200, ${Math.min(1, a + 0.3)})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  };

  resize();
  window.addEventListener("resize", resize);
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      tick();
    } else if (!entry.isIntersecting && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }).observe(host);
}

/* --------------------------------------------------------------------------
   Rented tower vs owned treehouse
   -------------------------------------------------------------------------- */

function initRentOwn() {
  const root = document.querySelector<HTMLElement>("[data-rent]");
  if (!root) return;
  const stamps = $$("[data-stamp]", root);
  const windows = $$("[data-tower-window]", root);
  const yours = root.querySelector("[data-your-window]");
  const checks = $$("[data-own]", root);
  const houseGlow = root.querySelector("[data-house-glow]");
  const meter = root.querySelector<HTMLElement>("[data-rent-meter]");

  const mm = gsap.matchMedia();
  mm.add("(min-width: 960px)", () => {
    gsap.set(stamps, { opacity: 0, scale: 1.6, rotate: (i) => [-8, 6, -4, 9][i % 4] });
    gsap.set(checks, { opacity: 0.25 });
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: "+=180%",
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
      },
    });
    stamps.forEach((s, i) => {
      const at = i * 1;
      tl.to(s, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, at)
        .to(windows.filter((_, j) => j % stamps.length === i), { opacity: 0.12, duration: 0.6, stagger: 0.01 }, at)
        .to(checks[i] ?? [], { opacity: 1, duration: 0.4 }, at + 0.2)
        .to(checks[i]?.querySelector(".own-tick") ?? [], { scale: 1, duration: 0.4, ease: "back.out(3)" }, at + 0.25);
    });
    if (yours) tl.to(yours, { fill: "#8a8f8b", duration: 0.5 }, stamps.length - 0.8);
    if (houseGlow) tl.fromTo(houseGlow, { opacity: 0.2 }, { opacity: 1, duration: stamps.length }, 0);
    if (meter) tl.fromTo(meter, { scaleX: 0 }, { scaleX: 1, duration: stamps.length, ease: "none" }, 0);
    return () => gsap.set([...stamps, ...checks], { clearProps: "all" });
  });
  mm.add("(max-width: 959px)", () => {
    gsap.from(stamps, {
      opacity: 0,
      scale: 1.5,
      stagger: 0.2,
      ease: "back.out(2)",
      scrollTrigger: { trigger: stamps[0]?.parentElement ?? root, start: "top 75%", once: true },
    });
  });
}

/* --------------------------------------------------------------------------
   Rooms: scrollytelling, the matching room lights up
   -------------------------------------------------------------------------- */

function initRooms() {
  const root = document.querySelector<HTMLElement>("[data-rooms]");
  if (!root) return;
  const cards = $$("[data-room]", root);
  const zones = $$("[data-zone]", root);
  const setLit = (id: string) => {
    zones.forEach((z) => z.classList.toggle("is-lit", z.dataset.zone === id));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.room === id));
    root.dataset.lit = id;
  };
  cards.forEach((card) => {
    ScrollTrigger.create({
      trigger: card,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && setLit(card.dataset.room!),
    });
    if (canHover()) card.addEventListener("pointerenter", () => setLit(card.dataset.room!));
  });
  setLit(cards[0]?.dataset.room ?? "");
}

/* --------------------------------------------------------------------------
   Lookout: tree rings, bars, sparkline
   -------------------------------------------------------------------------- */

function initLookout() {
  $$("[data-rings]").forEach((svg) => {
    const rings = $$<SVGPathElement>("[data-ring]", svg);
    const label = svg.parentElement?.querySelector<HTMLElement>("[data-ring-week]");
    rings.forEach(prepStroke);
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: "top 80%", end: "bottom 40%", scrub: 1 } });
    rings.forEach((r, i) => {
      tl.to(r, { strokeDashoffset: 0, duration: 1, ease: "power1.inOut", onUpdate: () => label && (label.textContent = String(i + 1).padStart(2, "0")) }, i * 0.6);
    });
    const core = svg.querySelector("[data-ring-core]");
    if (core) tl.from(core, { scale: 0, transformOrigin: "50% 50%", duration: 0.6 }, 0);
  });

  $$("[data-bars]").forEach((wrap) => {
    const bars = $$("[data-bar]", wrap);
    gsap.from(bars, {
      scaleX: 0,
      transformOrigin: "0 50%",
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: wrap, start: "top 85%", once: true },
    });
  });

  $$("[data-report]").forEach((card) => {
    gsap.from($$("[data-report-row]", card), {
      opacity: 0,
      x: -16,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.07,
      scrollTrigger: { trigger: card, start: "top 75%", once: true },
    });
  });
}

/* --------------------------------------------------------------------------
   Security: the ladder is pulled up as you read
   -------------------------------------------------------------------------- */

function initLadder() {
  const root = document.querySelector<HTMLElement>("[data-ladder]");
  if (!root) return;
  const rope = root.querySelector("[data-ladder-rope]");
  const lock = root.querySelector("[data-ladder-lock]");
  const status = root.querySelector<HTMLElement>("[data-ladder-status]");
  const down = status?.textContent ?? "";
  if (rope) {
    gsap.fromTo(
      rope,
      { yPercent: 0 },
      {
        yPercent: -78,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top 30%",
          end: "bottom 70%",
          scrub: 1,
          onUpdate: (self) => {
            if (!status) return;
            const text = self.progress > 0.92 ? status.dataset.up ?? down : down;
            if (status.textContent !== text) status.textContent = text;
            status.classList.toggle("is-up", self.progress > 0.92);
          },
        },
      }
    );
  }
  if (lock) {
    gsap.from(lock, {
      rotate: -25,
      scale: 0.6,
      opacity: 0,
      ease: "back.out(2)",
      scrollTrigger: { trigger: root, start: "bottom 95%", end: "bottom 70%", scrub: 1 },
    });
  }
  const planks = $$("[data-plank]", root);
  planks.forEach((p) => {
    gsap.from(p, {
      opacity: 0,
      y: 40,
      rotate: (Math.random() - 0.5) * 3,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: p, start: "top 88%", once: true },
    });
  });
}

function initLanternField() {
  if (!canHover()) return;
  $$("[data-lantern-field]").forEach((el) => {
    const xTo = gsap.quickTo(el, "--lx", { duration: 0.9, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "--ly", { duration: 0.9, ease: "power3.out" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
    });
  });
}

/* --------------------------------------------------------------------------
   Process: the treehouse draws itself, one step at a time
   -------------------------------------------------------------------------- */

function initBuild() {
  const root = document.querySelector<HTMLElement>("[data-build]");
  if (!root) return;
  const steps = $$("[data-step]", root);
  const parts = $$("[data-part]", root);
  const bar = root.querySelector<HTMLElement>("[data-build-progress]");

  parts.forEach((part) => {
    $$<SVGGeometryElement>("path, line, rect, circle, polyline", part).forEach(prepStroke);
  });

  const show = (n: number) => {
    steps.forEach((s, i) => s.classList.toggle("is-active", i === n));
    parts.forEach((part) => {
      const idx = parseInt(part.dataset.part ?? "0", 10);
      const on = idx <= n;
      if (part.dataset.state === String(on)) return;
      part.dataset.state = String(on);
      gsap.to($$("path, line, rect, circle, polyline", part), {
        strokeDashoffset: on ? 0 : (i, el) => (el as SVGGeometryElement).getTotalLength(),
        duration: on ? 1.4 : 0.6,
        ease: "power2.inOut",
        stagger: on ? 0.05 : 0,
      });
      gsap.to($$("[data-fill]", part), { opacity: on ? 1 : 0, duration: 0.8, delay: on ? 0.8 : 0 });
    });
  };

  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top 60%",
      end: "bottom 60%",
      onToggle: (self) => self.isActive && show(i),
    });
  });
  if (bar) {
    gsap.fromTo(bar, { scaleY: 0 }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: steps[0], start: "top 60%", endTrigger: steps[steps.length - 1], end: "bottom 60%", scrub: true },
    });
  }
}

/* --------------------------------------------------------------------------
   Drifting ticker
   -------------------------------------------------------------------------- */

function initMarquee() {
  $$("[data-marquee]").forEach((track) => {
    const speed = parseFloat(track.dataset.marquee || "40");
    const tween = gsap.to(track, { xPercent: -50, ease: "none", duration: speed, repeat: -1 });
    ScrollTrigger.create({
      trigger: track,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        gsap.to(tween, { timeScale: 1 + Math.min(4, Math.abs(self.getVelocity()) / 400), duration: 0.2, overwrite: true });
        gsap.to(tween, { timeScale: 1, duration: 1.2, delay: 0.2, overwrite: false });
      },
    });
  });
}
