/* Shape maths for the forest: chanterelles, funnel chanterelles, conks.
   Everything is computed at build time, so the browser only gets plain SVG paths. */

export type Pt = [number, number];

/** Small seeded random so every build draws the same forest */
export function rng(seed: number) {
  let s = Math.floor(Math.abs(seed) * 9973) % 2147483646 || 7;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const f = (n: number) => n.toFixed(1);

/** Smooth path through points (Catmull-Rom as cubic Béziers) */
export function smooth(pts: Pt[], closed = false, move = true): string {
  const n = pts.length;
  const P = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = move ? `M${f(pts[0][0])} ${f(pts[0][1])}` : "";
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + (closed ? " Z" : "");
}

/* --------------------------------------------------------------------------
   Chanterelle (kantarelli): side view, soft S-bent stem that widens into a
   tilted, lobed cap whose rim rolls down. Units: rim about 138 above ground.
   -------------------------------------------------------------------------- */
export function chanterelle({ lean = 1, tall = 1, seed = 0 }: { lean?: number; tall?: number; seed?: number }) {
  const H = 138 * tall;
  const cx = (t: number) => lean * (9 * Math.sin(Math.PI * t) - 3.5 * Math.sin(2 * Math.PI * t));
  const prof: Pt[] = [[0, 9], [0.15, 10.5], [0.3, 12.5], [0.45, 15.5], [0.58, 20], [0.69, 27], [0.78, 36], [0.86, 48], [0.92, 60]];
  const rimTilt = -14 * tall;
  const xL = -72 + cx(1), xR = 72 + cx(1);
  const base = (x: number) => -H + rimTilt * ((x - xL) / (xR - xL) - 0.5);
  const lobe = (x: number) => 3.6 * Math.sin(x * 0.09 + 1 + seed) + 2.2 * Math.sin(x * 0.21 + seed * 2);
  const droop = (x: number) => 7 * Math.pow(Math.abs((x - (xL + xR) / 2) / ((xR - xL) / 2)), 3);
  const front: Pt[] = [], back: Pt[] = [];
  for (let i = 0; i <= 18; i++) { const x = xL + ((xR - xL) * i) / 18; front.push([x, base(x) + lobe(x) + droop(x)]); }
  for (let i = 0; i <= 14; i++) { const x = xL + 6 + ((xR - 6 - (xL + 6)) * i) / 14; back.push([x, base(x) - 8 - 1.8 * Math.sin(x * 0.07 + seed) + droop(x) * 0.5]); }
  const fL = front[0], fR = front[front.length - 1];
  const left: Pt[] = prof.map(([t, w]) => [cx(t) - w, -t * H]);
  const right: Pt[] = prof.map(([t, w]) => [cx(t) + w, -t * H] as Pt).reverse();

  const body = smooth([...left, fL]) + " " + smooth(front, false, false).trim() + " " + smooth([fR, ...right], false, false).trim() + " Z";
  const capBack = smooth(back);
  const bl = back[back.length - 1], b0 = back[0];
  const cap = `${capBack} C ${f(xR + 5)} ${f(bl[1] + 2)}, ${f(xR + 5)} ${f(fR[1] - 2)}, ${f(fR[0])} ${f(fR[1])} ${smooth([...front].reverse(), false, false).trim()} C ${f(xL - 5)} ${f(fL[1] - 2)}, ${f(xL - 4)} ${f(b0[1] + 2)}, ${f(b0[0])} ${f(b0[1])} Z`;
  const rim = smooth(front);
  const dip = smooth(front.slice(5, 14).map(([a, b]) => [a, b - 5] as Pt));

  const ridges: string[] = [];
  for (let i = 1; i < front.length - 1; i++) {
    const [fx, fy] = front[i];
    const u = (fx - (xL + xR) / 2) / ((xR - xL) / 2);
    const tEnd = 0.42 + 0.08 * Math.abs(u);
    const ex = cx(tEnd) + u * 13, ey = -tEnd * H;
    const mx = cx(0.78) + u * 36, my = -0.78 * H;
    ridges.push(`M${f(fx)} ${f(fy + 2.5)} Q ${f(fx * 0.6 + mx * 0.4)} ${f(fy * 0.5 + my * 0.5 + 2)} ${f(mx)} ${f(my)} T ${f(ex)} ${f(ey)}`);
    if (i % 2 === 0 && i < front.length - 2) {
      const gx = (fx + front[i + 1][0]) / 2, gy = (fy + front[i + 1][1]) / 2;
      ridges.push(`M${f(gx)} ${f(gy + 2.5)} Q ${f(gx * 0.7 + mx * 0.3)} ${f(gy * 0.6 + my * 0.4)} ${f(mx)} ${f(my)}`);
    }
  }
  const folds: string[] = [];
  front.forEach(([fx, fy], i) => {
    if (i > 1 && i < front.length - 2 && lobe(fx) < -2.2) folds.push(`M${f(fx)} ${f(fy + 3)} q 1 4 -0.5 9`);
  });
  const sheen = smooth(prof.slice(1, 7).map(([t, w]) => [cx(t) + (w - 3), -t * H] as Pt));
  return { body, cap, rim, dip, ridges, folds, sheen, height: H };
}

/* --------------------------------------------------------------------------
   Funnel chanterelle (suppilovahvero): small brown funnel with a hole,
   slender yellow stem. Units: about 74 tall.
   -------------------------------------------------------------------------- */
export function yellowfoot({ bend = 0, seed = 0 }: { bend?: number; seed?: number }) {
  const rx = 26, ry = 6, cy = -74;
  const stem = `M-3.5 0 C ${f(-4 + bend * 0.4)} -25, ${f(-6 + bend)} -50, -13 ${cy + 4} L 13 ${cy + 4} C ${f(6 + bend)} -50, ${f(4 + bend * 0.4)} -25, 3.5 0 Z`;
  const rim: Pt[] = [];
  const N = 28, a = seed * 1.7;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const r = 1 + 0.12 * Math.sin(5 * t + a) + 0.03 * Math.sin(11 * t + a);
    const sy = Math.sin(t);
    rim.push([r * rx * Math.cos(t), cy + r * ry * sy + (sy > 0 ? sy * 4 : 0)]);
  }
  const front = rim.slice(0, N / 2 + 1);
  return {
    stem,
    under: `${smooth(front)} L 12 ${cy + 6} L -12 ${cy + 6} Z`,
    cap: smooth(rim, true),
    lip: smooth(front.filter(([x]) => x > 4)),
    hole: { cx: 0, cy, rx: 6, ry: 2.2 },
  };
}

/* --------------------------------------------------------------------------
   Red-belted conk (kantokääpä) growing out of a pine trunk.
   Drawn growing to the right from (0,0); mirror with scale(-1 1).
   -------------------------------------------------------------------------- */
export function conk(w: number) {
  const t = w * 0.2;
  return {
    under: `M0 ${f(t * 1.1)} C ${f(w * 0.3)} ${f(t * 1.35)}, ${f(w * 0.75)} ${f(t * 1.25)}, ${f(w * 0.98)} ${f(t * 0.55)} C ${f(w * 1.02)} ${f(t * 0.3)}, ${f(w * 0.99)} ${f(t * 0.9)}, ${f(w * 0.9)} ${f(t * 1.05)} C ${f(w * 0.6)} ${f(t * 1.5)}, ${f(w * 0.25)} ${f(t * 1.5)}, 0 ${f(t * 1.4)} Z`,
    top: `M0 ${f(-t * 0.2)} C ${f(w * 0.25)} ${f(-t * 1.1)}, ${f(w * 0.75)} ${f(-t * 1.0)}, ${f(w * 0.97)} ${f(-t * 0.15)} C ${f(w * 1.03)} ${f(t * 0.2)}, ${f(w * 1.0)} ${f(t * 0.55)}, ${f(w * 0.95)} ${f(t * 0.62)} C ${f(w * 0.65)} ${f(t * 1.05)}, ${f(w * 0.3)} ${f(t * 1.1)}, 0 ${f(t * 1.1)} Z`,
    bands: [0, 1, 2].map((i) => `M${f(w * 0.04)} ${f(t * (0.1 + i * 0.25))} C ${f(w * 0.35)} ${f(-t * (0.75 - i * 0.15))}, ${f(w * 0.7)} ${f(-t * (0.7 - i * 0.15))}, ${f(w * (0.9 + i * 0.03))} ${f(t * (0.0 + i * 0.2))}`),
    shine: `M${f(w * 0.2)} ${f(-t * 0.65)} C ${f(w * 0.45)} ${f(-t * 0.95)}, ${f(w * 0.7)} ${f(-t * 0.9)}, ${f(w * 0.85)} ${f(-t * 0.5)}`,
  };
}

/** Height of a conk's top surface above its attach point, at a share u (0..1) of its width */
export function conkTop(w: number, u: number): number {
  const t = w * 0.2;
  // cubic from (0,-0.2t) via (0.25w,-1.1t),(0.75w,-1.0t) to (0.97w,-0.15t): solve x for u
  let lo = 0, hi = 1;
  const bx = (s: number) => 3 * (1 - s) * (1 - s) * s * 0.25 + 3 * (1 - s) * s * s * 0.75 + s * s * s * 0.97;
  for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (bx(m) < u) lo = m; else hi = m; }
  const s = (lo + hi) / 2;
  const by = (1 - s) ** 3 * -0.2 + 3 * (1 - s) ** 2 * s * -1.1 + 3 * (1 - s) * s * s * -1.0 + s ** 3 * -0.15;
  return by * t;
}
