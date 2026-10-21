const xe={key:"d",aspect:1.5,small:"/forest/forest-d-1280.webp",large:"/forest/forest-d-2560.webp",aux:"/forest/forest-d-aux.png",start:{x:.62,y:.13,z:1.38},end:{x:.5,y:.74,z:1.06},sun:[.33,-.04],fire:[.504,.838],lamp:[.594,.145],window:[.689,.115],cups:[[.42,.79],[.448,.79]],spots:[{u:.615,v:.214,h:.046},{u:.587,v:.842,h:.066},{u:.49,v:.613,h:.03},{u:.385,v:.92,h:.072}]},ye={key:"m",aspect:2/3,small:"/forest/forest-m-720.webp",large:"/forest/forest-m-1440.webp",aux:"/forest/forest-m-aux.png",start:{x:.84,y:.2,z:1.32},end:{x:.38,y:.88,z:1.12},sun:[.25,-.03],fire:[.594,.828],lamp:[.734,.141],window:[.901,.114],cups:[[.418,.772],[.472,.768]],spots:[{u:.86,v:.218,h:.045},{u:.715,v:.81,h:.06},{u:.55,v:.59,h:.025},{u:.3,v:.915,h:.062}]},M=(c,m=0,x=1)=>Math.min(x,Math.max(m,c)),se=(c,m,x)=>c+(m-c)*x,Pe=c=>c*c*(3-2*c),Se=`
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`,Ae=`
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
`;function Ce(){const c=document.querySelector("[data-forest-hero]");if(!c||c.dataset.forestReady)return;c.dataset.forestReady="1";const m=c.querySelector("[data-forest-stage]"),x=c.querySelector("[data-forest-gl]"),O=c.querySelector("[data-forest-fx]"),we=c.querySelector("[data-forest-still]"),g=c.querySelector("[data-forest-dango]"),E=document.documentElement.classList.contains("motion"),C=matchMedia("(pointer: coarse)").matches;let i=innerWidth/innerHeight<.8?ye:xe;const l={...i.start},d={x:0,y:0,tx:0,ty:0};let W=0,N=0,$=-1e9;const H=()=>{if(!E)return .55;const e=c.getBoundingClientRect(),o=e.height-innerHeight;return o>0?M(-e.top/o):0},V=()=>{const e=Pe(H());return{x:M(se(i.start.x,i.end.x,e)+W,.05,.95),y:se(i.start.y,i.end.y,e),z:se(i.start.z,i.end.z,e)}};Object.assign(l,V());const R=()=>({w:m.clientWidth,h:m.clientHeight}),ie=Array.from(c.querySelectorAll("[data-hero-copy] > *")),v={l:0,t:0,r:0,b:0},I=()=>{const e=m.getBoundingClientRect();if(!ie.length||!e.width)return;let o=1e9,a=1e9,s=-1e9,n=-1e9;for(const p of ie){const y=document.createRange();y.selectNodeContents(p);const w=y.getBoundingClientRect(),u=w.width?w:p.getBoundingClientRect();o=Math.min(o,u.left),a=Math.min(a,u.top),s=Math.max(s,u.right),n=Math.max(n,u.bottom)}const r=parseFloat(getComputedStyle(c).getPropertyValue("--fh-p")||"0")*80;v.l=(o-e.left)/e.width,v.r=(s-e.left)/e.width,v.t=(a-e.top+r)/e.height,v.b=(n-e.top+r)/e.height},ce=()=>E?M(1-H()*2.2):1,Te=(e,o,a,s)=>e/a>v.l-.04&&e/a<v.r+.04&&o/s>v.t-.04&&o/s<v.b+.04,le=(e,o)=>{const a=e/o;return a>i.aspect?{x:1,y:i.aspect/a}:{x:a/i.aspect,y:1}};let Y=null,S=0,F=0;const Me=(e,o)=>{if(!Y)return .4;const a=M(Math.round(e*(S-1)),0,S-1),s=M(Math.round(o*(F-1)),0,F-1);return Y[(s*S+a)*4]/255},j=.35,_=C?.012:.022,D=(e,o,a=Me(e,o))=>{const{w:s,h:n}=R(),r=le(s,n),p=d.x*_*r.x/l.z,y=d.y*_*r.y/l.z,w=e-p*(a-j),u=o-y*(a-j),A=l.x+(w-l.x)*l.z/r.x,G=l.y+(u-l.y)*l.z/r.y;return{x:A*s,y:G*n,pxPerV:n*l.z/r.y}},ue=()=>{const{w:e,h:o}=R();le(e,o);const a=we.querySelector("img");a&&(a.style.objectPosition=`${l.x*100}% ${l.y*100}%`,a.style.transformOrigin=`${l.x*100}% ${l.y*100}%`,a.style.transform=`scale(${l.z})`)},t=x.getContext("webgl",{antialias:!1,alpha:!1,premultipliedAlpha:!1,powerPreference:"high-performance"});let K=!1,T=null;const h={};let z=null,J=null;const fe=(e,o)=>{const a=t.createShader(e);if(t.shaderSource(a,o),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))throw new Error(t.getShaderInfoLog(a)||"shader");return a},Q=e=>new Promise((o,a)=>{const s=new Image;s.decoding="async",s.onload=()=>o(s),s.onerror=a,s.src=e}),Z=(e,o)=>{t.bindTexture(t.TEXTURE_2D,e),t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,!1),t.texImage2D(t.TEXTURE_2D,0,t.RGB,t.RGB,t.UNSIGNED_BYTE,o),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)},Ee=async()=>{if(!t)throw new Error("no webgl");if(T=t.createProgram(),t.attachShader(T,fe(t.VERTEX_SHADER,Se)),t.attachShader(T,fe(t.FRAGMENT_SHADER,Ae)),t.linkProgram(T),!t.getProgramParameter(T,t.LINK_STATUS))throw new Error("link");t.useProgram(T);const e=t.createBuffer();t.bindBuffer(t.ARRAY_BUFFER,e),t.bufferData(t.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),t.STATIC_DRAW);const o=t.getAttribLocation(T,"aPos");t.enableVertexAttribArray(o),t.vertexAttribPointer(o,2,t.FLOAT,!1,0,0),["uTex","uAux","uRes","uImg","uCam","uPar","uFocus","uTime","uLive","uSun","uFire","uLamp","uWin","uCopy","uShade"].forEach(a=>h[a]=t.getUniformLocation(T,a)),z=t.createTexture(),J=t.createTexture(),await de()},de=async()=>{const[e,o]=await Promise.all([Q(i.small),Q(i.aux)]);Z(z,e),Z(J,o);const a=document.createElement("canvas");a.width=S=o.naturalWidth,a.height=F=o.naturalHeight;const s=a.getContext("2d",{willReadFrequently:!0});s.drawImage(o,0,0),Y=s.getImageData(0,0,S,F).data,K=!0,c.classList.add("is-live");const n=await Q(i.large).catch(()=>null);n&&Z(z,n)},he=()=>{const{w:e,h:o}=R(),a=Math.min(devicePixelRatio||1,2),s=Math.sqrt(46e5/Math.max(1,e*o*a*a)),n=a*Math.min(1,s);x.width=Math.round(e*n),x.height=Math.round(o*n);const r=Math.min(devicePixelRatio||1,1.5);O.width=Math.round(e*r),O.height=Math.round(o*r),f.setTransform(r,0,0,r,0,0)},ee=e=>{!t||!K||(t.viewport(0,0,x.width,x.height),t.activeTexture(t.TEXTURE0),t.bindTexture(t.TEXTURE_2D,z),t.uniform1i(h.uTex,0),t.activeTexture(t.TEXTURE1),t.bindTexture(t.TEXTURE_2D,J),t.uniform1i(h.uAux,1),t.uniform2f(h.uRes,x.width,x.height),t.uniform1f(h.uImg,i.aspect),t.uniform3f(h.uCam,l.x,l.y,l.z),t.uniform2f(h.uPar,d.x*_,d.y*_),t.uniform1f(h.uFocus,j),t.uniform1f(h.uTime,e),t.uniform1f(h.uLive,E?1:0),t.uniform2f(h.uSun,i.sun[0],i.sun[1]),t.uniform2f(h.uFire,i.fire[0],i.fire[1]),t.uniform2f(h.uLamp,i.lamp[0],i.lamp[1]),t.uniform2f(h.uWin,i.window[0],i.window[1]),t.uniform4f(h.uCopy,v.l,v.t,v.r,v.b),t.uniform1f(h.uShade,ce()),t.drawArrays(t.TRIANGLES,0,3))},f=O.getContext("2d"),Re=Array.from({length:C?34:64},()=>({u:Math.random(),v:Math.random()*.85,d:.25+Math.random()*.6,r:.6+Math.random()*1.8,p:Math.random()*10,s:.3+Math.random()*.7,vu:(Math.random()-.5)*.004,vv:-.002-Math.random()*.004})),b=[];let te=0;const me=(e,o)=>{const{w:a,h:s}=R();if(f.clearRect(0,0,a,s),!!E){f.globalCompositeOperation="lighter";for(const n of Re){n.u+=n.vu*o+Math.sin(e*.3+n.p)*6e-4*o,n.v+=n.vv*o,n.v<-.02&&(n.v=.9,n.u=Math.random()),n.u<-.02&&(n.u=1.02),n.u>1.02&&(n.u=-.02);const r=D(n.u,n.v,n.d);if(r.x<-20||r.y<-20||r.x>a+20||r.y>s+20)continue;let y=(.12+M(1.2-Math.hypot((n.u-i.sun[0])*i.aspect,n.v-i.sun[1]))*.5)*(.5+.5*Math.sin(e*n.s*1.6+n.p));Te(r.x,r.y,a,s)&&(y*=1-.8*ce());const w=n.r*(.7+n.d)*1.6,u=f.createRadialGradient(r.x,r.y,0,r.x,r.y,w*4);u.addColorStop(0,`rgba(255, 236, 190, ${y})`),u.addColorStop(1,"rgba(255, 236, 190, 0)"),f.fillStyle=u,f.beginPath(),f.arc(r.x,r.y,w*4,0,Math.PI*2),f.fill()}for(f.globalCompositeOperation="source-over",te+=o;te>.16;){te-=.16;for(const n of i.cups)Math.random()<.6&&b.push({u:n[0]+(Math.random()-.5)*.006,v:n[1],age:0,life:2.6+Math.random(),r:.006,drift:(Math.random()-.5)*.004,a:.16,warm:!1});Math.random()<.5&&b.push({u:i.fire[0]+(Math.random()-.5)*.01,v:i.fire[1]-.02,age:0,life:3.4+Math.random(),r:.01,drift:(Math.random()-.3)*.006,a:.1,warm:!1}),Math.random()<.12&&b.push({u:i.fire[0]+(Math.random()-.5)*.012,v:i.fire[1]-.01,age:0,life:1.3,r:.0016,drift:(Math.random()-.5)*.02,a:.9,warm:!0})}for(let n=b.length-1;n>=0;n--){const r=b[n];if(r.age+=o,r.age>r.life){b.splice(n,1);continue}const p=r.age/r.life,y=r.u+r.drift*r.age+Math.sin(r.age*2.2+r.u*50)*.003*p,w=r.v-(r.warm?.05:.035)*r.age,u=D(y,w,.5),A=(r.r+p*(r.warm?0:.016))*u.pxPerV,G=r.a*Math.sin(Math.PI*p);if(r.warm)f.fillStyle=`rgba(255, ${170+Math.round(60*(1-p))}, 90, ${G})`,f.beginPath(),f.arc(u.x,u.y,Math.max(.8,A),0,Math.PI*2),f.fill();else{const re=f.createRadialGradient(u.x,u.y,0,u.x,u.y,A);re.addColorStop(0,`rgba(250, 244, 232, ${G})`),re.addColorStop(1,"rgba(250, 244, 232, 0)"),f.fillStyle=re,f.beginPath(),f.arc(u.x,u.y,A,0,Math.PI*2),f.fill()}}}};let L=0,q=performance.now()/1e3+9,U=!1;const k=e=>{const{w:o,h:a}=R(),s=D(e.u,e.v),n=e.h*s.pxPerV;return s.x>o*.08&&s.x<o*.94&&s.y-n>a*.12&&s.y<a*.95},pe=()=>{const e=i.spots.map((o,a)=>({s:o,i:a})).filter(({s:o,i:a})=>a!==L&&k(o));return e.length?e[Math.floor(Math.random()*e.length)].i:-1},ge=e=>{e<0||U||(U=!0,g.classList.add("is-away"),setTimeout(()=>{L=e,X(),g.classList.remove("is-away"),g.classList.add("is-arriving"),setTimeout(()=>{g.classList.remove("is-arriving"),U=!1},1200)},900))},X=()=>{const e=i.spots[L],o=D(e.u,e.v),a=e.h*o.pxPerV;g.style.setProperty("--dh",`${a.toFixed(1)}px`),g.style.transform=`translate3d(${(o.x-a*.22).toFixed(1)}px, ${(o.y-a).toFixed(1)}px, 0)`};{const e=i.spots.findIndex(k);L=e>=0?e:0}g.addEventListener("click",()=>{E&&(g.classList.remove("is-hop"),g.offsetWidth,g.classList.add("is-hop"))});const be=e=>{if(X(),!E||U)return;const o=i.spots[L];k(o)?e>q&&(ge(pe()),q=e+12+Math.random()*5):e>q-7.5&&(ge(pe()),q=e+12+Math.random()*5)};if(!C)m.addEventListener("pointermove",e=>{const{w:o,h:a}=R(),s=m.getBoundingClientRect();d.tx=(e.clientX-s.left)/o*2-1,d.ty=(e.clientY-s.top)/a*2-1,$=performance.now()/1e3;const n=g.getBoundingClientRect(),r=e.clientX-(n.left+n.width/2),p=e.clientY-(n.top+n.height/2),y=Math.hypot(r,p)<160;g.classList.toggle("is-near",y),g.style.setProperty("--lean",`${M(r/160,-1,1)*5}deg`)}),m.addEventListener("pointerleave",()=>{d.tx=d.ty=0,g.classList.remove("is-near")});else{let e=0,o=0,a=!1;m.addEventListener("pointerdown",n=>{a=!0,e=n.clientX,o=N}),m.addEventListener("pointermove",n=>{a&&(N=M(o-(n.clientX-e)/innerWidth*.5,-.32,.12),$=performance.now()/1e3)});const s=()=>a=!1;m.addEventListener("pointerup",s),m.addEventListener("pointercancel",s)}let P=!1,oe=0,ae=performance.now();const ve=e=>{const o=Math.min(.05,(e-ae)/1e3);ae=e;const a=e/1e3;if(a-$>3){const p=C?.6:.35;d.tx=Math.sin(a*.11)*p,d.ty=Math.sin(a*.077+1)*p*.6}const s=1-Math.exp(-o*2.6);d.x+=(d.tx-d.x)*s,d.y+=(d.ty-d.y)*s,W+=(N-W)*(1-Math.exp(-o*4));const n=V(),r=1-Math.exp(-o*5);l.x+=(n.x-l.x)*r,l.y+=(n.y-l.y)*r,l.z+=(n.z-l.z)*r,c.style.setProperty("--fh-p",H().toFixed(3)),ee(a),me(a,o),be(a),P&&(oe=requestAnimationFrame(ve))},ne=e=>{const o=e&&!document.hidden&&E;o&&!P?(P=!0,ae=performance.now(),oe=requestAnimationFrame(ve)):!o&&P&&(P=!1,cancelAnimationFrame(oe))};let B=!0;new IntersectionObserver(([e])=>{B=e.isIntersecting,ne(B)}).observe(c),document.addEventListener("visibilitychange",()=>ne(B));const Le=()=>{const e=innerWidth/innerHeight<.8?ye:xe;if(e!==i){i=e,K&&de();const o=i.spots.findIndex(k);L=o>=0?o:0}t&&he(),I(),Object.assign(l,V()),ue(),X(),P||(ee(performance.now()/1e3),me(0,0))};new ResizeObserver(Le).observe(m),ue(),t&&he(),I(),document.fonts?.ready.then(I),[900,2200,3600].forEach(e=>setTimeout(I,e)),X(),c.classList.add("has-dango"),t&&Ee().then(()=>{ee(performance.now()/1e3),ne(B)}).catch(()=>c.classList.remove("is-live"))}Ce();
