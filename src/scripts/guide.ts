/* ==========================================================================
   The guide: a Dango riding a falling leaf beside you down the homepage.
   Scroll fast and he holds on and spins; scroll up and the wind lifts him;
   stop and he sways and turns to look at what you are reading. At the
   bottom he flies to the campfire and lands next to the coffee friend.
   ========================================================================== */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function initGuide() {
  const el = document.querySelector<HTMLElement>("[data-guide]");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const stage = document.querySelector<HTMLElement>("[data-stage]");
  if (!el || !hero || !stage || el.dataset.ready) return;
  if (!document.documentElement.classList.contains("motion")) return; // reduced motion: he simply waits at the campfire
  el.dataset.ready = "1";

  const body = el.querySelector<HTMLElement>("[data-guide-body]")!;
  const count = el.querySelector<HTMLElement>("[data-guide-count]")!;
  const spotArt = () => stage.querySelector<SVGGraphicsElement>("#sd-guide .dango__art");
  const H = parseFloat(el.dataset.dangoH ?? "64");
  const FEET_X = 52, FEET_Y = 78; // where his feet sit inside the 104 x 100 drawing

  stage.classList.add("await-guide");
  el.style.transformOrigin = "0 0";
  body.style.transformOrigin = `${FEET_X}px ${FEET_Y}px`;

  let mode: "away" | "ride" | "land" | "landed" = "away";
  let x = innerWidth + 80, y = -160, s = 0.8, op = 0;
  let lastScroll = scrollY, vs = 0, lift = 0, tilt = 0, spin = 0, spinVel = 0, idle = 0, look = 0, t = 0;
  let prev = performance.now();

  const baseScale = () => parseFloat(getComputedStyle(el).getPropertyValue("--gs")) || 0.8;
  const rest = () => {
    const sc = baseScale();
    const w = innerWidth;
    const margin = w >= 1320 ? 74 : w >= 760 ? 10 : -14;
    return { x: w - margin - FEET_X * sc * 0.75, y: innerHeight * 0.44, s: sc };
  };

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    t += dt;

    const v = scrollY - lastScroll;
    lastScroll = scrollY;
    vs = lerp(vs, v, 0.2);
    idle = Math.abs(v) < 0.5 ? idle + dt : 0;

    const heroGone = hero.getBoundingClientRect().bottom < innerHeight * 0.5;
    const sr = stage.getBoundingClientRect();
    const stageIn = sr.top < innerHeight * 0.42 && sr.bottom > innerHeight * 0.55;
    const stageOut = sr.top > innerHeight * 0.68;

    // Decide what he is doing
    if (mode === "landed" && stageOut) {
      stage.classList.remove("is-landed");
      stage.classList.add("await-guide");
      mode = "ride";
      op = 1;
    } else if ((mode === "ride" || mode === "land") && stageIn) {
      mode = "land";
    } else if (mode === "land" && !stageIn) {
      mode = "ride";
    } else if (mode === "away" && heroGone) {
      mode = "ride";
      const r = rest();
      x = r.x + 60; y = -140; // jumps in from the treehouse side
    } else if (mode === "ride" && !heroGone) {
      mode = "away";
    }

    let tx = x, ty = y, ts = s, rot = 0;
    if (mode === "ride" || mode === "away") {
      const r = rest();
      // Riding: wind from your scrolling
      if (vs < -1) lift = Math.max(lift + vs * 0.7, -110); else lift *= 0.93;
      tilt = lerp(tilt, clamp(vs * 1.1, -28, 28), 0.12);
      if (Math.abs(vs) > 26) spinVel = lerp(spinVel, Math.sign(vs) * 13, 0.08);
      else { spinVel *= 0.88; if (Math.abs(spinVel) < 0.5) spin = lerp(spin, Math.round(spin / 360) * 360, 0.08); }
      spin += spinVel;
      look = lerp(look, idle > 1.2 ? -12 : 0, idle > 1.2 ? 0.03 : 0.12);
      const sway = Math.sin(t * 1.4) * 6, bob = Math.sin(t * 0.9) * 6;
      tx = r.x + look * 0.6 + Math.sin(t * 0.6) * 4;
      ty = r.y + lift + bob;
      ts = r.s;
      rot = sway + tilt + spin + look;
      if (mode === "away") { tx = r.x + 60; ty = -160; }
      const k = mode === "away" ? 0.08 : 0.14;
      x = lerp(x, tx, k); y = lerp(y, ty, k); s = lerp(s, ts, 0.1);
      op = lerp(op, mode === "away" ? 0 : 1, 0.12);
    } else if (mode === "land") {
      const art = spotArt();
      if (art) {
        const a = art.getBoundingClientRect();
        tx = a.left + a.width / 2;
        ty = a.bottom;
        ts = a.height / H;
      }
      spin = lerp(spin, Math.round(spin / 360) * 360, 0.15);
      rot = spin + Math.sin(t * 2) * 4;
      x = lerp(x, tx, 0.11); y = lerp(y, ty, 0.11); s = lerp(s, ts, 0.11);
      op = 1;
      if (Math.hypot(tx - x, ty - y) < 4 && Math.abs(ts - s) < 0.04) {
        mode = "landed";
        stage.classList.add("is-landed");
        stage.classList.remove("await-guide");
      }
    }
    if (mode === "landed") op = 0;

    el.classList.toggle("is-on", op > 0.02);
    el.style.opacity = op.toFixed(3);
    el.style.transform = `translate3d(${(x - FEET_X * s).toFixed(1)}px, ${(y - FEET_Y * s).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    body.style.transform = `rotate(${rot.toFixed(2)}deg)`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // Found Dangos ride along with him as a little counter
  addEventListener("dango:found", (e) => {
    const { found, total } = (e as CustomEvent).detail;
    count.textContent = `${found} / ${total}`;
    count.classList.toggle("is-on", found > 0);
  });
}
