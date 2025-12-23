import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

/* ================== CONFIG ================== */
const GOAL = 2200;

// Speed control
const SPEED_MIN = 6.0;
const SPEED_MAX = 16.0;
const SPEED_START = 10.5;
const SPEED_STEP = 1.2;          // hər vertical swipe nə qədər dəyişsin

// Movement
const X_LIMIT = 2.9;
const SWIPE_X_STEP = 1.15;
const SWIPE_X_THRESHOLD = 28;
const SWIPE_Y_THRESHOLD = 28;

// Dog chase
const DOG_START_GAP = 9.5;       // startda nə qədər arxada olsun (z baxımından)
const DOG_EXTRA_SPEED = 1.8;     // it insanı tutmaq üçün + sürət
const DOG_CATCH_GAP = 1.25;      // bundan az olarsa tutdu say

/* ================== UI ================== */
const ui = {
  goalText: document.querySelector("#goalText"),
  distText: document.querySelector("#distText"),
  scoreText: document.querySelector("#scoreText"),
  speedText: document.querySelector("#speedText"),
  bar: document.querySelector("#bar"),
  msg: document.querySelector("#msg"),
};
ui.goalText.textContent = `GOAL: ${GOAL}m`;

/* ================== RENDERER / SCENE ================== */
let W = window.innerWidth, H = window.innerHeight;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b1020, 18, 160);

const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 700);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
document.body.appendChild(renderer.domElement);

/* ================== LIGHTS ================== */
scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 1.05));

const sun = new THREE.DirectionalLight(0xffffff, 0.95);
sun.position.set(12, 22, 10);
scene.add(sun);

// Bir az ambient əlavə edək ki, it qaranlıqda itməsin
const fill = new THREE.DirectionalLight(0xffffff, 0.25);
fill.position.set(-10, 8, 12);
scene.add(fill);

/* ================== WORLD ================== */
const world = new THREE.Group();
scene.add(world);

const platformMat = new THREE.MeshStandardMaterial({ color: 0x2b3140, roughness: 1 });
const platformGeo = new THREE.BoxGeometry(8.2, 0.6, 320);
const platform = new THREE.Mesh(platformGeo, platformMat);
platform.position.set(0, -0.3, -150);
world.add(platform);

const sideMat = new THREE.MeshStandardMaterial({ color: 0x144028, roughness: 1 });
const sideGeo = new THREE.BoxGeometry(6.2, 1.2, 360);
const leftSide = new THREE.Mesh(sideGeo, sideMat);
leftSide.position.set(-7.5, -0.6, -160);
world.add(leftSide);
const rightSide = new THREE.Mesh(sideGeo, sideMat);
rightSide.position.set(7.5, -0.6, -160);
world.add(rightSide);

// minimal yol xətləri
const markMat = new THREE.MeshStandardMaterial({ color: 0x515a70, roughness: 1 });
const markGeo = new THREE.BoxGeometry(0.08, 0.03, 2.3);
const marks = [];
for (let i = 0; i < 110; i++) {
  const m = new THREE.Mesh(markGeo, markMat);
  m.position.set(0, 0.01, -i * 3.4);
  world.add(m);
  marks.push(m);
}

/* ================== PROPS (trees) ================== */
const props = [];
function makeTree() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 1.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x5b3a1f, roughness: 1 })
  );
  trunk.position.y = 0.55;

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x1b6b3a, roughness: 1 })
  );
  crown.position.y = 1.25;

  g.add(trunk, crown);
  return g;
}
function addPropLine(z) {
  const t1 = makeTree(); t1.position.set(-7.2, 0, z);
  const t2 = makeTree(); t2.position.set( 7.2, 0, z);
  scene.add(t1, t2);
  props.push(t1, t2);
}
for (let i = 0; i < 56; i++) addPropLine(-(18 + i * 7.2));

/* ================== PLAYER (human) ================== */
function makeHuman() {
  const g = new THREE.Group();

  const skinMat  = new THREE.MeshStandardMaterial({ color: 0xf1d2b6, roughness: 0.9 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x5b8cff, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 1 });
  const hairMat  = new THREE.MeshStandardMaterial({ color: 0x2a221e, roughness: 1 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.62, 6, 10), shirtMat);
  torso.position.y = 1.05;

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.26, 0.38), pantsMat);
  hips.position.y = 0.76;

  const legGeo = new THREE.CapsuleGeometry(0.12, 0.48, 6, 10);
  const legL = new THREE.Mesh(legGeo, pantsMat);
  const legR = new THREE.Mesh(legGeo, pantsMat);
  legL.position.set(-0.18, 0.35, 0);
  legR.position.set( 0.18, 0.35, 0);

  const armGeo = new THREE.CapsuleGeometry(0.10, 0.48, 6, 10);
  const armL = new THREE.Mesh(armGeo, skinMat);
  const armR = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.58, 1.05, 0);
  armR.position.set( 0.58, 1.05, 0);
  armL.rotation.z = 0.25;
  armR.rotation.z = -0.25;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), skinMat);
  head.position.y = 1.78;

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.265, 16, 14), hairMat);
  hair.position.y = 1.80;
  hair.scale.set(1.02, 0.78, 1.02);

  g.add(torso, hips, legL, legR, armL, armR, head, hair);
  g.position.set(0, 0, 2);
  return g;
}

const player = makeHuman();
scene.add(player);

const playerBox = new THREE.Box3();
function updatePlayerBox() { playerBox.setFromObject(player); }

/* ================== DOG (VISIBLE CHASER) ================== */
function makeDog() {
  const g = new THREE.Group();

  // daha parlaq material (görünsün)
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xffb46a,
    roughness: 0.9,
    emissive: 0x331a00,
    emissiveIntensity: 0.25,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.50, 1.35), furMat);
  body.position.y = 0.35;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.52), furMat);
  head.position.set(0, 0.58, 0.95);

  const legGeo = new THREE.BoxGeometry(0.18, 0.36, 0.18);
  const l1 = new THREE.Mesh(legGeo, furMat); l1.position.set(-0.36, 0.18, 0.40);
  const l2 = new THREE.Mesh(legGeo, furMat); l2.position.set( 0.36, 0.18, 0.40);
  const l3 = new THREE.Mesh(legGeo, furMat); l3.position.set(-0.36, 0.18,-0.40);
  const l4 = new THREE.Mesh(legGeo, furMat); l4.position.set( 0.36, 0.18,-0.40);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.65), furMat);
  tail.position.set(0, 0.58, -1.00);
  tail.rotation.x = -0.55;

  // itə kiçik işıq (qaranlıqda itməsin)
  const dogLight = new THREE.PointLight(0xffe0b3, 0.55, 8);
  dogLight.position.set(0, 1.2, 0);

  g.add(body, head, l1, l2, l3, l4, tail, dogLight);
  return g;
}

const dog = makeDog();
// it startda oyunçunun arxasında (kamera tərəfdə) olsun
dog.position.set(0, 0, player.position.z + DOG_START_GAP);
scene.add(dog);

const dogBox = new THREE.Box3();
function updateDogBox() { dogBox.setFromObject(dog); }

/* ================== COINS (front face visible) ================== */
let score = 0;
function addScore(n = 1) {
  score += n;
  ui.scoreText.textContent = `SCORE: ${score}`;
}

const coins = [];
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd34d, roughness: 0.35, metalness: 0.6 });
// Cylinder Y oxu üstədir => üst “üz” (front) yuxarıdan dairə kimi görünür
const coinGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.10, 22);

function addCoin(x, z) {
  const c = new THREE.Mesh(coinGeo, coinMat);
  c.position.set(x, 0.78, z);
  scene.add(c);
  coins.push(c);
}

function seedCoins() {
  const lanes = [-2.4, -1.2, 0, 1.2, 2.4];
  let z = -8;

  while (Math.abs(z) < GOAL + 60) {
    z -= 2.9 + Math.random() * 2.4;

    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const pack = (Math.random() < 0.38) ? 5 : 3; // “subway” kimi sıralar
    for (let i = 0; i < pack; i++) addCoin(lane, z - i * 1.05);
  }
}
seedCoins();

/* ================== OBSTACLES ================== */
const obstacles = [];
const obstacleMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cf, roughness: 0.85 });

function addObstacle(x, z, type = "box") {
  const mesh =
    type === "cone"
      ? new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 10), obstacleMat)
      : new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), obstacleMat);

  if (type === "cone") {
    mesh.position.y = 0.6;
    mesh.rotation.x = Math.PI;
  } else {
    mesh.position.y = 0.55;
  }

  mesh.position.x = x;
  mesh.position.z = z;
  scene.add(mesh);
  obstacles.push(mesh);
}

function seedObstacles() {
  const xs = [-2.4, -1.2, 0, 1.2, 2.4];
  let z = -22;
  while (Math.abs(z) < GOAL + 90) {
    z -= 11 + Math.random() * 10;
    const count = 1 + (Math.random() < 0.30 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const x = xs[Math.floor(Math.random() * xs.length)];
      const type = Math.random() < 0.45 ? "cone" : "box";
      addObstacle(x, z - i * 1.9, type);
    }
  }
}
seedObstacles();

/* ================== FINISH (Goal gate) ================== */
const finish = new THREE.Group();
const gateMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
const postGeo = new THREE.BoxGeometry(0.35, 3.2, 0.35);
const beamGeo = new THREE.BoxGeometry(7.2, 0.35, 0.35);

const postL = new THREE.Mesh(postGeo, gateMat);
postL.position.set(-3.6, 1.6, -GOAL - 6);
const postR = new THREE.Mesh(postGeo, gateMat);
postR.position.set( 3.6, 1.6, -GOAL - 6);
const beam = new THREE.Mesh(beamGeo, gateMat);
beam.position.set(0, 3.1, -GOAL - 6);

finish.add(postL, postR, beam);
scene.add(finish);

const finishBox = new THREE.Box3().setFromObject(finish);

/* ================== CONTROLS ================== */
let targetX = 0;
let vx = 0;

// speed control
let speedTarget = SPEED_START;
let speed = SPEED_START;

let touchStartX = null, touchStartY = null;

window.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
  if (touchStartX == null) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;

  // horizontal swipe => sağ/sol
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_X_THRESHOLD) {
    targetX += (dx > 0 ? 1 : -1) * SWIPE_X_STEP;
    targetX = Math.max(-X_LIMIT, Math.min(X_LIMIT, targetX));
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  // vertical swipe => sürət
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > SWIPE_Y_THRESHOLD) {
    // swipe up => sürət artır (dy mənfi)
    speedTarget += (dy < 0 ? +1 : -1) * SPEED_STEP;
    speedTarget = Math.max(SPEED_MIN, Math.min(SPEED_MAX, speedTarget));
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }
}, { passive: true });

window.addEventListener("touchend", () => {
  touchStartX = null; touchStartY = null;
}, { passive: true });

// Desktop test
window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") targetX = Math.max(-X_LIMIT, targetX - SWIPE_X_STEP);
  if (e.code === "ArrowRight" || e.code === "KeyD") targetX = Math.min(X_LIMIT, targetX + SWIPE_X_STEP);

  if (e.code === "KeyW" || e.code === "ArrowUp") {
    speedTarget = Math.min(SPEED_MAX, speedTarget + SPEED_STEP);
  }
  if (e.code === "KeyS" || e.code === "ArrowDown") {
    speedTarget = Math.max(SPEED_MIN, speedTarget - SPEED_STEP);
  }
});

/* ================== CAMERA ================== */
// Kameranı elə qururuq ki, həm oyunçu, həm də it kadrda görünsün
function updateCamera() {
  // Kamera oyunçudan geridə və yuxarıda
  camera.position.set(player.position.x * 0.35, 11.5, player.position.z + 18.0);

  // lookAt bir az “arxa”ya yaxın olsun ki, it də kadrda qalsın
  const lookZ = player.position.z - 6.0;
  camera.lookAt(player.position.x * 0.20, 1.2, lookZ);
}
updateCamera();

/* ================== GAME ================== */
let dist = 0;
let gameOver = false;

const tmpBox = new THREE.Box3();

function lose(reasonText = "Uduzdun 😅 (refresh elə)") {
  if (gameOver) return;
  gameOver = true;
  ui.msg.textContent = reasonText;
  speed = 0;
}

function win() {
  if (gameOver) return;
  gameOver = true;
  ui.msg.textContent = "QAZANDIN ✅ (goal tamamlandı)";
  speed = 0;
}

let last = performance.now();

function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  if (!gameOver) {
    // speed easing
    speed += (speedTarget - speed) * Math.min(1, dt * 3.5);
    ui.speedText.textContent = `SPEED: ${speed.toFixed(1)}`;

    // player forward (z azalır)
    player.position.z -= speed * dt;

    // x movement (spring)
    const k = 55, damp = 12;
    const ax = (targetX - player.position.x) * k - vx * damp;
    vx += ax * dt;
    player.position.x += vx * dt;

    // clamp
    player.position.x = Math.max(-X_LIMIT, Math.min(X_LIMIT, player.position.x));

    // tiny animation
    player.rotation.y = Math.sin(now * 0.01) * 0.02;

    // distance/progress
    dist = Math.min(GOAL, Math.floor(Math.abs(player.position.z - 2)));
    ui.distText.textContent = `${dist}m`;
    ui.bar.style.width = `${Math.min(100, (dist / GOAL) * 100)}%`;

    // camera follow
    updateCamera();

    // recycle marks/props
    for (const m of marks) if (m.position.z > player.position.z + 15) m.position.z -= 380;
    for (const p of props) if (p.position.z > player.position.z + 25) p.position.z -= 420;

    // collision boxes
    updatePlayerBox();

    // obstacles collision
    for (const o of obstacles) {
      tmpBox.setFromObject(o);
      if (tmpBox.intersectsBox(playerBox)) {
        lose("Maneəyə dəydin 😅 (refresh elə)");
        break;
      }
    }

    // coins: spin + collect (yuxarıdan dairə kimi qalır)
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.rotation.y += dt * 3.0;
      tmpBox.setFromObject(c);
      if (tmpBox.intersectsBox(playerBox)) {
        scene.remove(c);
        coins.splice(i, 1);
        addScore(1);
      }
    }

    // ===== DOG CHASE (it qovur) =====
    // it də irəli gedir (z azalır), amma insandan sürətlidir => tutacaq
    const dogSpeed = speed + DOG_EXTRA_SPEED;

    // it z-də insanı tutsun deyə daha sürətli azalır
    dog.position.z -= dogSpeed * dt;

    // it x-də insanı yumşaq izləsin
    dog.position.x += (player.position.x - dog.position.x) * Math.min(1, dt * 4.0);

    // it üzünü insan tərəfə çevirsin
    dog.lookAt(player.position.x, 0.35, player.position.z);

    // tutma şərti
    updateDogBox();
    const gap = dog.position.z - player.position.z; // it arxadadırsa bu > 0 olur
    if (dogBox.intersectsBox(playerBox) || gap < DOG_CATCH_GAP) {
      lose("İt tutdu 😅 (refresh elə)");
    }

    // finish
    finishBox.setFromObject(finish);
    if (playerBox.intersectsBox(finishBox) || dist >= GOAL) {
      win();
    }

    // it həddən artıq geridə qalmasın deyə startda bir dəfə düzəlt (təhlükəsiz)
    // (əgər çox sürətlənib it ekrandan çıxsa)
    if (gap > DOG_START_GAP + 6) {
      dog.position.z = player.position.z + DOG_START_GAP;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ================== RESIZE ================== */
window.addEventListener("resize", () => {
  W = window.innerWidth; H = window.innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
});
