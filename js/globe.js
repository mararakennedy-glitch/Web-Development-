/* Traverze Travel — hero: interactive 3D globe with golden flight arcs.
   Deferred until after first paint; degrades to a static CSS scene when
   WebGL is unavailable, on small screens, or under prefers-reduced-motion. */

const hero = document.getElementById("hero");
const canvas = document.getElementById("globeCanvas");
const tooltip = document.getElementById("globeTooltip");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const smallScreen = window.innerWidth < 768;

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}

if (reducedMotion || smallScreen || !webglAvailable()) {
  hero.classList.add("no-webgl");
  canvas.remove();
} else {
  // Defer WebGL init until the page has painted.
  if (document.readyState === "complete") scheduleInit();
  else window.addEventListener("load", scheduleInit, { once: true });
}

function scheduleInit() {
  if ("requestIdleCallback" in window) requestIdleCallback(init, { timeout: 1500 });
  else setTimeout(init, 250);
}

async function init() {
  let THREE;
  try {
    THREE = await import("./vendor/three.module.min.js");
  } catch (e) {
    hero.classList.add("no-webgl");
    canvas.remove();
    return;
  }

  const GOLD = 0xC9A227;
  const BRASS = 0xB08D3F;
  const AMBER = 0xD97B29;
  const IVORY = 0xF7F3EA;
  const RADIUS = 1.6;

  const HOME = { lat: -17.83, lon: 31.05 }; // Harare

  const DESTINATIONS = [
    { lat: -17.93, lon: 25.83, name: "Victoria Falls", detail: "Experience Zim safaris · from $250" },
    { lat: -33.92, lon: 18.42, name: "Cape Town", detail: "MiCasa All Aboard · $900/pax" },
    { lat: -29.86, lon: 31.03, name: "Durban", detail: "Durban Duets Cruise · from $1,470" },
    { lat: 25.29, lon: 51.53, name: "Doha", detail: "Doha Delights · from $2,043" },
    { lat: 25.2, lon: 55.27, name: "Dubai", detail: "Dubai escapes · visa desk included" },
    { lat: -6.16, lon: 39.19, name: "Zanzibar", detail: "Beach holidays · Indian Ocean" },
    { lat: 39.9, lon: 116.4, name: "Beijing", detail: "China cultural &amp; heritage tours" }
  ];

  function latLonToVec3(lat, lon, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ── Renderer / scene / camera ── */
  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);
  camera.position.set(0, 0.15, 4.6);

  scene.add(new THREE.AmbientLight(0x4A6B60, 2.4));
  const keyLight = new THREE.DirectionalLight(0xFFE3B0, 3.4);
  keyLight.position.set(-3, 2.5, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x2A8A74, 1.4);
  rimLight.position.set(5, -2, -4);
  scene.add(rimLight);

  /* ── Globe group (everything that rotates together) ── */
  const globeGroup = new THREE.Group();
  globeGroup.rotation.z = 0.16;   // gentle axial tilt
  globeGroup.rotation.y = -2.53;  // Africa front-left, facing the headline
  scene.add(globeGroup);

  const earthMat = new THREE.MeshStandardMaterial({
    color: 0x11362F, roughness: 0.75, metalness: 0.25
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 64, 64), earthMat);
  globeGroup.add(earth);

  // Photoreal texture (tinted warm); if it fails, a gold graticule steps in.
  new THREE.TextureLoader().load(
    "assets/textures/earth-dark.jpg",
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      earthMat.map = tex;
      earthMat.color = new THREE.Color(0xD8CFB5);
      earthMat.emissive = new THREE.Color(0xC9A227);
      earthMat.emissiveMap = tex;
      earthMat.emissiveIntensity = 0.85;
      earthMat.needsUpdate = true;
    },
    undefined,
    () => {
      const wire = new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.001, 36, 24),
        new THREE.MeshBasicMaterial({ color: GOLD, wireframe: true, transparent: true, opacity: 0.12 })
      );
      globeGroup.add(wire);
    }
  );

  // Champagne-gold atmosphere rim (backside fresnel shader).
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.13, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { glowColor: { value: new THREE.Color(GOLD) } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, -1.0)), 3.5);
          gl_FragColor = vec4(glowColor, 1.0) * intensity * 0.9;
        }`
    })
  );
  scene.add(atmosphere);

  /* ── Flight arcs from Harare ── */
  const homeVec = latLonToVec3(HOME.lat, HOME.lon, RADIUS);
  const arcs = [];

  DESTINATIONS.forEach((dest, i) => {
    const end = latLonToVec3(dest.lat, dest.lon, RADIUS);
    const dist = homeVec.distanceTo(end);
    const lift = RADIUS * (0.28 + dist * 0.16);
    const mid1 = homeVec.clone().lerp(end, 0.33).normalize().multiplyScalar(RADIUS + lift);
    const mid2 = homeVec.clone().lerp(end, 0.66).normalize().multiplyScalar(RADIUS + lift);
    const curve = new THREE.CubicBezierCurve3(homeVec, mid1, mid2, end);

    const points = curve.getPoints(72);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: i % 2 ? BRASS : GOLD, transparent: true, opacity: 0.65
    });
    const line = new THREE.Line(geo, mat);
    line.geometry.setDrawRange(0, 0);
    globeGroup.add(line);

    // Comet pulse travelling the arc.
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 8, 8),
      new THREE.MeshBasicMaterial({ color: AMBER })
    );
    globeGroup.add(pulse);

    arcs.push({ line, curve, pulse, phase: i * 0.9, total: points.length });
  });

  /* ── Destination markers + soft pulses ── */
  const markerHits = [];
  const glowTexture = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(201,162,39,0.95)");
    grad.addColorStop(0.35, "rgba(201,162,39,0.35)");
    grad.addColorStop(1, "rgba(201,162,39,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const allMarkers = [{ ...HOME, name: "Harare", detail: "Traverze Travel · Head Office" }]
    .concat(DESTINATIONS);

  allMarkers.forEach((m, i) => {
    const pos = latLonToVec3(m.lat, m.lon, RADIUS * 1.012);
    const dotColor = i === 0 ? AMBER : IVORY;

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.028 : 0.02, 12, 12),
      new THREE.MeshBasicMaterial({ color: dotColor })
    );
    dot.position.copy(pos);
    globeGroup.add(dot);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture, transparent: true, depthWrite: false
    }));
    glow.position.copy(pos);
    glow.scale.setScalar(0.16);
    globeGroup.add(glow);

    // Invisible larger sphere = generous hover target.
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.copy(pos);
    hit.userData = { name: m.name, detail: m.detail, phase: i * 0.7, glow };
    globeGroup.add(hit);
    markerHits.push(hit);
  });

  /* ── Drifting starfield / dust ── */
  const starCount = 700;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 7 + Math.random() * 9;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
    starPos[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 1;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: 0xEFE6CE, size: 0.022, transparent: true, opacity: 0.55,
    sizeAttenuation: true, depthWrite: false
  }));
  scene.add(stars);

  /* ── Layout: globe sits right-of-centre on wide screens ── */
  const globeAnchor = new THREE.Group();
  scene.remove(globeGroup);
  globeAnchor.add(globeGroup);
  scene.add(globeAnchor);

  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w > 1024;
    globeAnchor.position.x = wide ? 1.28 : 0;
    globeAnchor.position.y = wide ? -0.08 : 0.55;
    atmosphere.position.copy(globeAnchor.position);
    const s = wide ? 0.82 : 0.62;
    globeAnchor.scale.setScalar(s);
    atmosphere.scale.setScalar(s);
  }
  layout();
  window.addEventListener("resize", layout, { passive: true });

  /* ── Drag with inertia + hover raycast ── */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(-2, -2);
  let dragging = false, lastX = 0, lastY = 0;
  let velX = 0, velY = 0;
  let hovered = null;

  canvas.style.touchAction = "pan-y";

  function pointerDown(x, y) { dragging = true; lastX = x; lastY = y; }
  function pointerMoveDrag(x, y) {
    if (!dragging) return;
    velY = (x - lastX) * 0.0045;
    velX = (y - lastY) * 0.0032;
    lastX = x; lastY = y;
  }

  canvas.addEventListener("pointerdown", (e) => pointerDown(e.clientX, e.clientY));
  window.addEventListener("pointermove", (e) => {
    pointerMoveDrag(e.clientX, e.clientY);
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }, { passive: true });
  window.addEventListener("pointerup", () => { dragging = false; });

  function updateTooltip() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(markerHits, false);
    const hit = hits.length ? hits[0].object : null;
    if (hit !== hovered) {
      hovered = hit;
      if (hovered) {
        tooltip.innerHTML = "<strong>" + hovered.userData.name + "</strong><em>" +
          hovered.userData.detail + "</em>";
        tooltip.classList.add("is-visible");
        canvas.style.cursor = "pointer";
      } else {
        tooltip.classList.remove("is-visible");
        canvas.style.cursor = "";
      }
    }
    if (hovered) {
      const world = hovered.getWorldPosition(new THREE.Vector3()).project(camera);
      tooltip.style.left = ((world.x + 1) / 2 * canvas.clientWidth) + "px";
      tooltip.style.top = ((-world.y + 1) / 2 * canvas.clientHeight) + "px";
    }
  }

  /* ── Animate ── */
  const clock = new THREE.Clock();
  let visible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; },
      { threshold: 0 }).observe(hero);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!visible) return;
    const t = clock.getElapsedTime();

    // Inertia + slow auto-rotation.
    globeGroup.rotation.y += velY + 0.0009;
    globeGroup.rotation.x = THREE.MathUtils.clamp(globeGroup.rotation.x + velX, -0.6, 0.6);
    velX *= dragging ? 0.82 : 0.94;
    velY *= dragging ? 0.82 : 0.94;

    // Arcs draw themselves, then a pulse rides each one.
    arcs.forEach((a) => {
      const cycle = (t * 0.35 + a.phase) % 2;
      const p = Math.min(cycle, 1);
      a.line.geometry.setDrawRange(0, Math.floor(p * a.total));
      a.line.material.opacity = cycle > 1.6 ? (2 - cycle) * 1.6 : 0.65;
      a.pulse.visible = p > 0.02 && p < 1;
      if (a.pulse.visible) a.pulse.position.copy(a.curve.getPoint(p));
    });

    // Marker glow breathing (hovered one swells).
    markerHits.forEach((m) => {
      const base = m === hovered ? 0.3 : 0.16;
      m.userData.glow.scale.setScalar(base + Math.sin(t * 2.2 + m.userData.phase) * 0.035);
    });

    stars.rotation.y = t * 0.004;
    stars.rotation.x = Math.sin(t * 0.05) * 0.01;

    updateTooltip();
    renderer.render(scene, camera);
  }
  animate();
}
