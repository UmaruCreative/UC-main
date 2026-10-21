/* ==========================================================================
   The forest hero: one hand painted scene, brought to life.

   A WebGL shader reads the painting and a depth map. Near things move more
   than far things when the pointer moves (or the phone is dragged), so the
   painting feels layered. The shader also adds the small signs of life:
   swaying boughs, a shimmering lake, slow sun rays, the fire and the lantern.
   A 2D layer adds dust in the light and steam from the kuksa cups.
   Scrolling lowers your gaze from the treehouse to the forest floor.
   Dango, the original artwork, is a quiet forest spirit who moves now and then.

   Without WebGL, or with reduced motion, the painting stays still.
   ========================================================================== */

type Cam = { x: number; y: number; z: number };
type Spot = { u: number; v: number; h: number };
type Scene = {
  key: "d" | "m";
  aspect: number; // image width / height
  small: string;
  large: string;
  aux: string;
  start: Cam;
  end: Cam;
  sun: [number, number];
  fire: [number, number];
  lamp: [number, number];
  window: [number, number];
  cups: [number, number][];
  spots: Spot[];
};

const DESKTOP: Scene = {
  key: "d",
  aspect: 1.5,
  small: "/forest/forest-d-1280.webp",
  large: "/forest/forest-d-2560.webp",
  aux: "/forest/forest-d-aux.png",
  start: { x: 0.62, y: 0.13, z: 1.38 },
  end: { x: 0.5, y: 0.74, z: 1.06 },
  sun: [0.33, -0.04],
  fire: [0.504, 0.838],
  lamp: [0.594, 0.145],
  window: [0.689, 0.115],
  cups: [[0.42, 0.79], [0.448, 0.79]],
  spots: [
    { u: 0.615, v: 0.214, h: 0.046 }, // on the treehouse deck
    { u: 0.587, v: 0.842, h: 0.066 }, // on the mossy stone by the fire
    { u: 0.49, v: 0.613, h: 0.03 }, // at the end of the dock
    { u: 0.385, v: 0.92, h: 0.072 }, // beside the chanterelles
  ],
};

const MOBILE: Scene = {
  key: "m",
  aspect: 2 / 3,
  small: "/forest/forest-m-720.webp",
  large: "/forest/forest-m-1440.webp",
  aux: "/forest/forest-m-aux.png",
  start: { x: 0.84, y: 0.2, z: 1.32 },
  end: { x: 0.38, y: 0.88, z: 1.12 },
  sun: [0.25, -0.03],
  fire: [0.594, 0.828],
  lamp: [0.734, 0.141],
  window: [0.901, 0.114],
  cups: [[0.418, 0.772], [0.472, 0.768]],
  spots: [
    { u: 0.86, v: 0.218, h: 0.045 }, // on the treehouse deck, right of the door
    { u: 0.715, v: 0.81, h: 0.06 },
    { u: 0.55, v: 0.59, h: 0.025 },
    { u: 0.3, v: 0.915, h: 0.062 },
  ],
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform sampler2D uAux;
uniform vec2 uRes;
uniform float uImg;
uniform vec3 uCam;      // focus point x, y and zoom
uniform vec2 uPar;      // parallax, in view units
uniform float uFocus;
uniform float uTime;
uniform float uLive;    // 0 still, 1 alive
uniform vec2 uSun;
uniform vec2 uFire;
uniform vec2 uLamp;
uniform vec2 uWin;
uniform vec4 uCopy;    // the words, in view units: left, top, right, bottom
uniform float uShade;   // how much the words need the light lowered (0 to 1)

vec2 viewToImage(vec2 s, vec2 span) {
  return uCam.xy + (s - uCam.xy) * span / uCam.z;
}

float glow(vec2 p, vec2 c, float r) {
  vec2 d = (p - c) * vec2(uImg, 1.0);
  return exp(-dot(d, d) / (r * r));
}

void main() {
  vec2 s = gl_FragCoord.xy / uRes;
  s.y = 1.0 - s.y;
  float va = uRes.x / uRes.y;
  vec2 span = va > uImg ? vec2(1.0, uImg / va) : vec2(va / uImg, 1.0);
  vec2 uv = viewToImage(s, span);
  vec2 off = uPar * span / uCam.z;

  // depth parallax: a few fixed point steps keep edges clean
  float d = texture2D(uAux, uv).r;
  vec2 p = uv;
  for (int i = 0; i < 3; i++) {
    p = uv + off * (d - uFocus);
    d = texture2D(uAux, p).r;
  }

  // boughs close to you sway a little
  float near = smoothstep(0.55, 0.95, d);
  p.x += near * uLive * 0.0011 * sin(uTime * 0.7 + p.y * 11.0 + p.x * 4.0);
  p.y += near * uLive * 0.0007 * sin(uTime * 0.9 + p.x * 9.0);

  // the lake moves
  float lake = texture2D(uAux, p).g;
  p.x += lake * uLive * 0.00045 * (sin(p.y * 170.0 + uTime * 1.1) + 0.6 * sin(p.y * 260.0 - uTime * 1.5 + p.x * 40.0));
  p = clamp(p, vec2(0.001), vec2(0.999));

  vec3 col = texture2D(uTex, p).rgb;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));

  // slow bands of light drifting over the water
  float band = 0.5 + 0.5 * sin(p.x * 55.0 + p.y * 150.0 - uTime * 0.7) * sin(p.x * 23.0 - p.y * 90.0 + uTime * 0.4);
  col += lake * uLive * band * smoothstep(0.35, 0.8, lum) * vec3(1.0, 0.9, 0.7) * 0.07;

  // slow sun rays from the upper left, strongest where the painting is bright
  vec2 sv = (p - uSun) * vec2(uImg, 1.0);
  float ang = atan(sv.y, sv.x);
  float rays = 0.5 + 0.5 * sin(ang * 34.0 + uTime * 0.12) * sin(ang * 13.0 - uTime * 0.07);
  rays *= smoothstep(1.1, 0.1, length(sv)) * (1.0 - near * 0.7) * smoothstep(0.35, 0.85, lum);
  // the canopy over the words: a soft patch of shade, so the light falls on the lake and the treehouse instead
  vec2 cc = (uCopy.xy + uCopy.zw) * 0.5;
  vec2 ch = (uCopy.zw - uCopy.xy) * 0.5;
  vec2 cq = abs((s - cc) * uRes) - ch * uRes;
  float cd = length(max(cq, 0.0)) + min(max(cq.x, cq.y), 0.0);
  float shadeM = uShade * (1.0 - smoothstep(-0.08 * uRes.y, 0.3 * uRes.y, cd));
  rays *= 1.0 - shadeM * 0.9;
  col += uLive * rays * 0.07 * vec3(1.0, 0.86, 0.55);

  // fire and lantern breathe
  float fl = 0.5 + 0.25 * sin(uTime * 11.0) + 0.15 * sin(uTime * 6.7 + 1.3) + 0.1 * sin(uTime * 19.0);
  float fire = glow(p, uFire, 0.06);
  col *= 1.0 + uLive * fire * (0.08 + 0.12 * fl);
  col += uLive * glow(p, uFire, 0.11) * vec3(1.0, 0.5, 0.18) * 0.06 * fl;
  float lampF = 0.85 + 0.15 * sin(uTime * 2.3) * sin(uTime * 3.7);
  col += uLive * (glow(p, uLamp, 0.025) + glow(p, uWin, 0.03) * 0.7) * vec3(1.0, 0.72, 0.32) * 0.12 * lampF;

  // lower the light under the canopy: bright passages come down the most, the darks hardly move,
  // and the shade is a little warm, like light through autumn leaves
  float l2 = dot(col, vec3(0.299, 0.587, 0.114));
  float down = shadeM * (0.2 + 0.28 * smoothstep(0.25, 0.85, l2));
  col *= (1.0 - down) * mix(vec3(1.0), vec3(1.0, 0.95, 0.86), shadeM * 0.6);

  // soft vignette
  vec2 q = s - 0.5;
  col *= 1.0 - 0.28 * smoothstep(0.35, 0.95, length(q * vec2(1.0, 1.1)));
  gl_FragColor = vec4(col, 1.0);
}
`;

export function initForest() {
  const hero = document.querySelector<HTMLElement>("[data-forest-hero]");
  if (!hero || hero.dataset.forestReady) return;
  hero.dataset.forestReady = "1";

  const stage = hero.querySelector<HTMLElement>("[data-forest-stage]")!;
  const glCanvas = hero.querySelector<HTMLCanvasElement>("[data-forest-gl]")!;
  const fxCanvas = hero.querySelector<HTMLCanvasElement>("[data-forest-fx]")!;
  const still = hero.querySelector<HTMLElement>("[data-forest-still]")!;
  const dango = hero.querySelector<HTMLElement>("[data-forest-dango]")!;

  const motion = document.documentElement.classList.contains("motion");
  const coarse = matchMedia("(pointer: coarse)").matches;
  let scene = innerWidth / innerHeight < 0.8 ? MOBILE : DESKTOP;

  /* ---------- camera ---------- */

  const cam: Cam = { ...scene.start };
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  let look = 0; // phone: drag to look left and right
  let lookT = 0;
  let lastInput = -1e9;

  const progress = () => {
    if (!motion) return 0.55;
    const r = hero.getBoundingClientRect();
    const run = r.height - innerHeight;
    return run > 0 ? clamp(-r.top / run) : 0;
  };
  const target = (): Cam => {
    const t = ease(progress());
    return {
      x: clamp(mix(scene.start.x, scene.end.x, t) + look, 0.05, 0.95),
      y: mix(scene.start.y, scene.end.y, t),
      z: mix(scene.start.z, scene.end.z, t),
    };
  };
  Object.assign(cam, target());

  const size = () => ({ w: stage.clientWidth, h: stage.clientHeight });

  // Where the words sit, so the painting can lower its light just there
  const copyParts = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-copy] > *"));
  const copyBox = { l: 0, t: 0, r: 0, b: 0 };
  const measureCopy = () => {
    const sr = stage.getBoundingClientRect();
    if (!copyParts.length || !sr.width) return;
    let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    for (const el of copyParts) {
      // measure the text itself, not the full width block
      const range = document.createRange();
      range.selectNodeContents(el);
      const rr = range.getBoundingClientRect();
      const q = rr.width ? rr : el.getBoundingClientRect();
      l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    }
    // measured without the scroll lift that moves the words up
    const lift = parseFloat(getComputedStyle(hero).getPropertyValue("--fh-p") || "0") * 80;
    copyBox.l = (l - sr.left) / sr.width;
    copyBox.r = (r - sr.left) / sr.width;
    copyBox.t = (t - sr.top + lift) / sr.height;
    copyBox.b = (b - sr.top + lift) / sr.height;
  };
  const shadeK = () => (motion ? clamp(1 - progress() * 2.2) : 1);
  const inCopy = (x: number, y: number, w: number, h: number) => {
    const pad = 0.04;
    return x / w > copyBox.l - pad && x / w < copyBox.r + pad && y / h > copyBox.t - pad && y / h < copyBox.b + pad;
  };
  const spanOf = (w: number, h: number) => {
    const va = w / h;
    return va > scene.aspect ? { x: 1, y: scene.aspect / va } : { x: va / scene.aspect, y: 1 };
  };

  // Depth for points outside the shader (Dango, dust, steam)
  let depthData: Uint8ClampedArray | null = null;
  let depthW = 0, depthH = 0;
  const depthAt = (u: number, v: number) => {
    if (!depthData) return 0.4;
    const x = clamp(Math.round(u * (depthW - 1)), 0, depthW - 1);
    const y = clamp(Math.round(v * (depthH - 1)), 0, depthH - 1);
    return depthData[(y * depthW + x) * 4] / 255;
  };
  const FOCUS = 0.35;
  const PAR = coarse ? 0.012 : 0.022;

  /** image uv to stage pixels, following the camera and the parallax */
  const project = (u: number, v: number, d = depthAt(u, v)) => {
    const { w, h } = size();
    const sp = spanOf(w, h);
    const ox = (par.x * PAR * sp.x) / cam.z, oy = (par.y * PAR * sp.y) / cam.z;
    const pu = u - ox * (d - FOCUS), pv = v - oy * (d - FOCUS);
    const sx = cam.x + ((pu - cam.x) * cam.z) / sp.x;
    const sy = cam.y + ((pv - cam.y) * cam.z) / sp.y;
    return { x: sx * w, y: sy * h, pxPerV: (h * cam.z) / sp.y };
  };

  // The still image matches the first camera so nothing jumps when WebGL arrives
  const placeStill = () => {
    const { w, h } = size();
    const sp = spanOf(w, h);
    // the still is a cover fit image, then scaled around the focus point
    const img = still.querySelector("img") as HTMLImageElement | null;
    if (!img) return;
    img.style.objectPosition = `${cam.x * 100}% ${cam.y * 100}%`;
    img.style.transformOrigin = `${cam.x * 100}% ${cam.y * 100}%`;
    img.style.transform = `scale(${cam.z})`;
    void sp;
  };

  /* ---------- WebGL ---------- */

  const gl = (glCanvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" }) as WebGLRenderingContext | null);
  let ready = false;
  let prog: WebGLProgram | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};
  let texColor: WebGLTexture | null = null, texAux: WebGLTexture | null = null;

  const compile = (type: number, src: string) => {
    const sh = gl!.createShader(type)!;
    gl!.shaderSource(sh, src);
    gl!.compileShader(sh);
    if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(sh) || "shader");
    return sh;
  };
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
  const upload = (tex: WebGLTexture, im: HTMLImageElement) => {
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, im);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
  };

  const setup = async () => {
    if (!gl) throw new Error("no webgl");
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ["uTex", "uAux", "uRes", "uImg", "uCam", "uPar", "uFocus", "uTime", "uLive", "uSun", "uFire", "uLamp", "uWin", "uCopy", "uShade"].forEach((n) => (U[n] = gl.getUniformLocation(prog!, n)));
    texColor = gl.createTexture();
    texAux = gl.createTexture();
    await loadScene();
  };

  const loadScene = async () => {
    const [img, aux] = await Promise.all([loadImage(scene.small), loadImage(scene.aux)]);
    upload(texColor!, img);
    upload(texAux!, aux);
    // keep the depth on the CPU too
    const c = document.createElement("canvas");
    c.width = depthW = aux.naturalWidth;
    c.height = depthH = aux.naturalHeight;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    cx.drawImage(aux, 0, 0);
    depthData = cx.getImageData(0, 0, depthW, depthH).data;
    ready = true;
    hero.classList.add("is-live");
    // then the sharp version
    const big = await loadImage(scene.large).catch(() => null);
    if (big) upload(texColor!, big);
  };

  const resizeGl = () => {
    const { w, h } = size();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const cap = Math.sqrt(4_600_000 / Math.max(1, w * h * dpr * dpr));
    const k = dpr * Math.min(1, cap);
    glCanvas.width = Math.round(w * k);
    glCanvas.height = Math.round(h * k);
    const fk = Math.min(devicePixelRatio || 1, 1.5);
    fxCanvas.width = Math.round(w * fk);
    fxCanvas.height = Math.round(h * fk);
    fx.setTransform(fk, 0, 0, fk, 0, 0);
  };

  const draw = (time: number) => {
    if (!gl || !ready) return;
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texColor);
    gl.uniform1i(U.uTex, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texAux);
    gl.uniform1i(U.uAux, 1);
    gl.uniform2f(U.uRes, glCanvas.width, glCanvas.height);
    gl.uniform1f(U.uImg, scene.aspect);
    gl.uniform3f(U.uCam, cam.x, cam.y, cam.z);
    gl.uniform2f(U.uPar, par.x * PAR, par.y * PAR);
    gl.uniform1f(U.uFocus, FOCUS);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uLive, motion ? 1 : 0);
    gl.uniform2f(U.uSun, scene.sun[0], scene.sun[1]);
    gl.uniform2f(U.uFire, scene.fire[0], scene.fire[1]);
    gl.uniform2f(U.uLamp, scene.lamp[0], scene.lamp[1]);
    gl.uniform2f(U.uWin, scene.window[0], scene.window[1]);
    gl.uniform4f(U.uCopy, copyBox.l, copyBox.t, copyBox.r, copyBox.b);
    gl.uniform1f(U.uShade, shadeK());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* ---------- dust in the light and steam from the cups ---------- */

  const fx = fxCanvas.getContext("2d")!;
  type Mote = { u: number; v: number; d: number; r: number; p: number; s: number; vu: number; vv: number };
  type Puff = { u: number; v: number; age: number; life: number; r: number; drift: number; a: number; warm: boolean };
  const motes: Mote[] = Array.from({ length: coarse ? 34 : 64 }, () => ({
    u: Math.random(),
    v: Math.random() * 0.85,
    d: 0.25 + Math.random() * 0.6,
    r: 0.6 + Math.random() * 1.8,
    p: Math.random() * 10,
    s: 0.3 + Math.random() * 0.7,
    vu: (Math.random() - 0.5) * 0.004,
    vv: -0.002 - Math.random() * 0.004,
  }));
  const puffs: Puff[] = [];
  let spawn = 0;

  const drawFx = (time: number, dt: number) => {
    const { w, h } = size();
    fx.clearRect(0, 0, w, h);
    if (!motion) return;
    // dust: drifts slowly up through the sunlight
    fx.globalCompositeOperation = "lighter";
    for (const m of motes) {
      m.u += m.vu * dt + Math.sin(time * 0.3 + m.p) * 0.0006 * dt;
      m.v += m.vv * dt;
      if (m.v < -0.02) { m.v = 0.9; m.u = Math.random(); }
      if (m.u < -0.02) m.u = 1.02;
      if (m.u > 1.02) m.u = -0.02;
      const q = project(m.u, m.v, m.d);
      if (q.x < -20 || q.y < -20 || q.x > w + 20 || q.y > h + 20) continue;
      // brighter towards the sun
      const sunNear = clamp(1.2 - Math.hypot((m.u - scene.sun[0]) * scene.aspect, m.v - scene.sun[1]));
      let a = (0.12 + sunNear * 0.5) * (0.5 + 0.5 * Math.sin(time * m.s * 1.6 + m.p));
      if (inCopy(q.x, q.y, w, h)) a *= 1 - 0.8 * shadeK();
      const r = m.r * (0.7 + m.d) * 1.6;
      const g = fx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r * 4);
      g.addColorStop(0, `rgba(255, 236, 190, ${a})`);
      g.addColorStop(1, "rgba(255, 236, 190, 0)");
      fx.fillStyle = g;
      fx.beginPath();
      fx.arc(q.x, q.y, r * 4, 0, Math.PI * 2);
      fx.fill();
    }
    // steam from the cups, thin smoke and the odd spark from the fire
    fx.globalCompositeOperation = "source-over";
    spawn += dt;
    while (spawn > 0.16) {
      spawn -= 0.16;
      for (const c of scene.cups) if (Math.random() < 0.6) puffs.push({ u: c[0] + (Math.random() - 0.5) * 0.006, v: c[1], age: 0, life: 2.6 + Math.random(), r: 0.006, drift: (Math.random() - 0.5) * 0.004, a: 0.16, warm: false });
      if (Math.random() < 0.5) puffs.push({ u: scene.fire[0] + (Math.random() - 0.5) * 0.01, v: scene.fire[1] - 0.02, age: 0, life: 3.4 + Math.random(), r: 0.01, drift: (Math.random() - 0.3) * 0.006, a: 0.1, warm: false });
      if (Math.random() < 0.12) puffs.push({ u: scene.fire[0] + (Math.random() - 0.5) * 0.012, v: scene.fire[1] - 0.01, age: 0, life: 1.3, r: 0.0016, drift: (Math.random() - 0.5) * 0.02, a: 0.9, warm: true });
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const f = puffs[i];
      f.age += dt;
      if (f.age > f.life) { puffs.splice(i, 1); continue; }
      const t = f.age / f.life;
      const u = f.u + f.drift * f.age + Math.sin(f.age * 2.2 + f.u * 50) * 0.003 * t;
      const v = f.v - (f.warm ? 0.05 : 0.035) * f.age;
      const q = project(u, v, 0.5);
      const rr = (f.r + t * (f.warm ? 0 : 0.016)) * q.pxPerV;
      const a = f.a * Math.sin(Math.PI * t);
      if (f.warm) {
        fx.fillStyle = `rgba(255, ${170 + Math.round(60 * (1 - t))}, 90, ${a})`;
        fx.beginPath();
        fx.arc(q.x, q.y, Math.max(0.8, rr), 0, Math.PI * 2);
        fx.fill();
      } else {
        const g = fx.createRadialGradient(q.x, q.y, 0, q.x, q.y, rr);
        g.addColorStop(0, `rgba(250, 244, 232, ${a})`);
        g.addColorStop(1, "rgba(250, 244, 232, 0)");
        fx.fillStyle = g;
        fx.beginPath();
        fx.arc(q.x, q.y, rr, 0, Math.PI * 2);
        fx.fill();
      }
    }
  };

  /* ---------- Dango, a quiet forest spirit ---------- */

  let spotIndex = 0;
  let nextMove = performance.now() / 1000 + 9;
  let moving = false;
  const inView = (s: Spot) => {
    const { w, h } = size();
    const q = project(s.u, s.v);
    const hh = s.h * q.pxPerV;
    return q.x > w * 0.08 && q.x < w * 0.94 && q.y - hh > h * 0.12 && q.y < h * 0.95;
  };
  const chooseSpot = () => {
    const visible = scene.spots.map((s, i) => ({ s, i })).filter(({ s, i }) => i !== spotIndex && inView(s));
    if (!visible.length) return -1;
    return visible[Math.floor(Math.random() * visible.length)].i;
  };
  const moveTo = (i: number) => {
    if (i < 0 || moving) return;
    moving = true;
    dango.classList.add("is-away");
    setTimeout(() => {
      spotIndex = i;
      placeDango();
      dango.classList.remove("is-away");
      dango.classList.add("is-arriving");
      setTimeout(() => {
        dango.classList.remove("is-arriving");
        moving = false;
      }, 1200);
    }, 900);
  };
  const placeDango = () => {
    const s = scene.spots[spotIndex];
    const q = project(s.u, s.v);
    const hpx = s.h * q.pxPerV;
    dango.style.setProperty("--dh", `${hpx.toFixed(1)}px`);
    dango.style.transform = `translate3d(${(q.x - hpx * 0.22).toFixed(1)}px, ${(q.y - hpx).toFixed(1)}px, 0)`;
  };
  // pick the first spot that is on screen at load
  {
    const first = scene.spots.findIndex(inView);
    spotIndex = first >= 0 ? first : 0;
  }
  dango.addEventListener("click", () => {
    if (!motion) return;
    dango.classList.remove("is-hop");
    void dango.offsetWidth;
    dango.classList.add("is-hop");
  });

  const tickDango = (now: number) => {
    placeDango();
    if (!motion || moving) return;
    const here = scene.spots[spotIndex];
    if (!inView(here)) {
      // he never stays out of sight for long
      if (now > nextMove - 7.5) { moveTo(chooseSpot()); nextMove = now + 12 + Math.random() * 5; }
    } else if (now > nextMove) {
      moveTo(chooseSpot());
      nextMove = now + 12 + Math.random() * 5;
    }
  };

  /* ---------- input ---------- */

  if (!coarse) {
    stage.addEventListener("pointermove", (e) => {
      const { w, h } = size();
      const r = stage.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / w) * 2 - 1;
      par.ty = ((e.clientY - r.top) / h) * 2 - 1;
      lastInput = performance.now() / 1000;
      // Dango notices you
      const dr = dango.getBoundingClientRect();
      const dx = e.clientX - (dr.left + dr.width / 2);
      const dy = e.clientY - (dr.top + dr.height / 2);
      const near = Math.hypot(dx, dy) < 160;
      dango.classList.toggle("is-near", near);
      dango.style.setProperty("--lean", `${clamp(dx / 160, -1, 1) * 5}deg`);
    });
    stage.addEventListener("pointerleave", () => {
      par.tx = par.ty = 0;
      dango.classList.remove("is-near");
    });
  } else {
    // phones: drag sideways to look around the forest
    let sx = 0, base = 0, dragging = false;
    stage.addEventListener("pointerdown", (e) => { dragging = true; sx = e.clientX; base = lookT; });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      lookT = clamp(base - ((e.clientX - sx) / innerWidth) * 0.5, -0.32, 0.12);
      lastInput = performance.now() / 1000;
    });
    const end = () => (dragging = false);
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  }

  /* ---------- loop ---------- */

  let running = false, raf = 0, last = performance.now();
  const frame = (nowMs: number) => {
    const dt = Math.min(0.05, (nowMs - last) / 1000);
    last = nowMs;
    const now = nowMs / 1000;
    // idle: the view drifts very slowly by itself
    if (now - lastInput > 3) {
      const k = coarse ? 0.6 : 0.35;
      par.tx = Math.sin(now * 0.11) * k;
      par.ty = Math.sin(now * 0.077 + 1) * k * 0.6;
    }
    const kk = 1 - Math.exp(-dt * 2.6);
    par.x += (par.tx - par.x) * kk;
    par.y += (par.ty - par.y) * kk;
    look += (lookT - look) * (1 - Math.exp(-dt * 4));
    const t = target();
    const kc = 1 - Math.exp(-dt * 5);
    cam.x += (t.x - cam.x) * kc;
    cam.y += (t.y - cam.y) * kc;
    cam.z += (t.z - cam.z) * kc;
    hero.style.setProperty("--fh-p", progress().toFixed(3));
    draw(now);
    drawFx(now, dt);
    tickDango(now);
    if (running) raf = requestAnimationFrame(frame);
  };
  const sync = (visible: boolean) => {
    const should = visible && !document.hidden && motion;
    if (should && !running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };

  let visible = true;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync(visible);
  }).observe(hero);
  document.addEventListener("visibilitychange", () => sync(visible));

  const onResize = () => {
    const want = innerWidth / innerHeight < 0.8 ? MOBILE : DESKTOP;
    if (want !== scene) {
      scene = want;
      if (ready) loadScene();
      const first = scene.spots.findIndex(inView);
      spotIndex = first >= 0 ? first : 0;
    }
    if (gl) resizeGl();
    measureCopy();
    Object.assign(cam, target());
    placeStill();
    placeDango();
    if (!running) { draw(performance.now() / 1000); drawFx(0, 0); }
  };
  new ResizeObserver(onResize).observe(stage);

  placeStill();
  if (gl) resizeGl();
  measureCopy();
  // the words settle after the intro and once the fonts arrive
  document.fonts?.ready.then(measureCopy);
  [900, 2200, 3600].forEach((ms) => setTimeout(measureCopy, ms));
  placeDango();
  hero.classList.add("has-dango");

  if (!gl) return;
  setup()
    .then(() => {
      draw(performance.now() / 1000);
      sync(visible);
    })
    .catch(() => hero.classList.remove("is-live"));
}
