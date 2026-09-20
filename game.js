'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// -- Skins ---------------------------------------------------------------------
const SKINS = [
  { id: 'clasico', name: 'Clásico', body: '#fff', glow: '#0ff', flame: 'rgba(255, 130, 0, 0.85)', flameBoost: 'rgba(0, 255, 255, 0.85)' },
  { id: 'neon', name: 'Neón', body: '#0ff', glow: '#0ff', flame: 'rgba(0, 255, 255, 0.85)', flameBoost: 'rgba(0, 255, 255, 0.85)' },
  { id: 'rubi', name: 'Rubí', body: '#f33', glow: '#f33', flame: 'rgba(255, 120, 0, 0.85)', flameBoost: 'rgba(255, 51, 51, 0.85)' },
  { id: 'ambar', name: 'Ámbar', body: '#fa0', glow: '#fa0', flame: 'rgba(255, 200, 0, 0.85)', flameBoost: 'rgba(255, 170, 0, 0.85)' },
  { id: 'fantasma', name: 'Fantasma', body: '#3f5', glow: '#3f5', flame: 'rgba(80, 255, 130, 0.85)', flameBoost: 'rgba(0, 255, 255, 0.85)' },
  { id: 'violeta', name: 'Violeta', body: '#c5f', glow: '#c5f', flame: 'rgba(200, 80, 255, 0.85)', flameBoost: 'rgba(0, 255, 255, 0.85)' },
];

const SKIN_KEY = 'asteroids-skin';
const savedSkin = localStorage.getItem(SKIN_KEY);
let skinIndex = Math.max(0, SKINS.findIndex(skin => skin.id === savedSkin));

function getSkin() {
  return SKINS[skinIndex];
}

function cycleSkin() {
  skinIndex = (skinIndex + 1) % SKINS.length;
  localStorage.setItem(SKIN_KEY, getSkin().id);
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.speedTimer    = 0;
    this.shieldTimer   = 0;
    this.tripleTimer   = 0;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.shieldTimer   > 0) this.shieldTimer   -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT     = 3.5;   // rad/s
    const THRUST  = 260;   // px/s²
    const SPEEDX2 = 2;     // multiplicador con power-up activo
    const DRAG    = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      const thrust = THRUST * (this.speedTimer > 0 ? SPEEDX2 : 1);
      this.vx += Math.cos(this.angle) * thrust * dt;
      this.vy += Math.sin(this.angle) * thrust * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleTimer > 0) {
      const SPREAD = 0.16;
      return [
        new Bullet(ox, oy, this.angle - SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const skin = getSkin();
    ctx.strokeStyle = skin.body;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // El brillo del skin se intensifica durante el power-up de velocidad.
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur  = this.speedTimer > 0 ? 14 : 6;
    ctx.stroke();

    if (this.tripleTimer > 0) {
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur  = 12;
      ctx.stroke();
    }

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = this.speedTimer > 0 ? skin.flameBoost : skin.flame;
      ctx.stroke();
    }

    ctx.restore();

    if (this.shieldTimer > 0) {
      const pulse = 0.6 + 0.2 * Math.sin(performance.now() * 0.006);
      ctx.save();
      ctx.strokeStyle = `rgba(255, 0, 255, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 1.8;
      ctx.fillStyle = 'rgba(255, 0, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Power-up: Velocidad ─────────────────────────────────────────────────────────
const SPEED_DURATION = 5;   // segundos de efecto
const SPEED_RADIUS   = 14;

class SpeedPowerUp {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = SPEED_RADIUS;
    this.ttl    = 12;       // segundos antes de expirar
    this.t      = rand(0, Math.PI * 2);
    this.dead   = false;
    this.kind   = 'speed';
  }

  update(dt) {
    this.t += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.t);
    const s = 1 + 0.1 * Math.sin(this.t * 5);
    ctx.scale(s, s);

    ctx.strokeStyle = '#0ff';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur  = 10;

    // Rombo punteado
    ctx.beginPath();
    ctx.moveTo( this.radius, 0);
    ctx.lineTo( this.radius * 0.35,  this.radius * 0.35);
    ctx.lineTo( 0,  this.radius);
    ctx.lineTo(-this.radius * 0.35,  this.radius * 0.35);
    ctx.lineTo(-this.radius, 0);
    ctx.lineTo(-this.radius * 0.35, -this.radius * 0.35);
    ctx.lineTo( 0, -this.radius);
    ctx.lineTo( this.radius * 0.35, -this.radius * 0.35);
    ctx.closePath();
    ctx.stroke();

    // Doble chevrón ">>"
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo( 2,  0);
    ctx.lineTo(-5,  6);
    ctx.moveTo( 1, -6);
    ctx.lineTo( 8,  0);
    ctx.lineTo( 1,  6);
    ctx.stroke();

    ctx.restore();
  }
}

// -- Power-up: Escudo ----------------------------------------------------------
const SHIELD_DURATION = 6;
const SHIELD_RADIUS = 16;

class ShieldPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = SHIELD_RADIUS;
    this.ttl = 12;
    this.t = rand(0, Math.PI * 2);
    this.dead = false;
    this.kind = 'shield';
  }

  update(dt) {
    this.t += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.t);
    const s = 1 + 0.1 * Math.sin(this.t * 5);
    ctx.scale(s, s);
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.quadraticCurveTo(7, -5, 7, 0);
    ctx.quadraticCurveTo(7, 5, 0, 8);
    ctx.quadraticCurveTo(-7, 5, -7, 0);
    ctx.quadraticCurveTo(-7, -5, 0, -8);
    ctx.stroke();
    ctx.restore();
  }
}

// -- Power-up: Triple shot -----------------------------------------------------
const TRIPLE_DURATION = 5;
const TRIPLE_RADIUS = 14;

class TripleShotPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = TRIPLE_RADIUS;
    this.ttl = 12;
    this.t = rand(0, Math.PI * 2);
    this.dead = false;
    this.kind = 'triple';
  }

  update(dt) {
    this.t += dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 6) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.t);
    const s = 1 + 0.1 * Math.sin(this.t * 5);
    ctx.scale(s, s);
    ctx.strokeStyle = '#f0f';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(this.radius, 0);
    ctx.lineTo(this.radius * 0.35, this.radius * 0.35);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius * 0.35, this.radius * 0.35);
    ctx.lineTo(-this.radius, 0);
    ctx.lineTo(-this.radius * 0.35, -this.radius * 0.35);
    ctx.lineTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.35, -this.radius * 0.35);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -7);
    ctx.lineTo(-4, -3);
    ctx.lineTo(2, 0);
    ctx.lineTo(-5, 4);
    ctx.lineTo(4, 7);
    ctx.stroke();
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let powerUpSpawnTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  powerUpSpawnTimer = rand(4, 7);
  spawnAsteroids(4);
}

function spawnPowerUp() {
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - ship.x, y - ship.y) < 160);
  const powerUp = Math.random() < 1 / 3
    ? new SpeedPowerUp(x, y)
    : Math.random() < 0.5
      ? new ShieldPowerUp(x, y)
      : new TripleShotPowerUp(x, y);
  powerUps.push(powerUp);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  ship.reset();
  powerUpSpawnTimer = rand(4, 7);
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  if (pressed('Tab')) cycleSkin();

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  powerUps.forEach(p => p.update(dt));
  particles.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  powerUps  = powerUps.filter(p => !p.dead);
  particles = particles.filter(p => !p.dead);

  // Spawn de power-ups
  if (powerUpSpawnTimer > 0 && powerUps.length === 0) {
    powerUpSpawnTimer -= dt;
    if (powerUpSpawnTimer <= 0) {
      spawnPowerUp();
      powerUpSpawnTimer = rand(6, 11);
    }
  }

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0 && ship.shieldTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs power-up
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.kind === 'speed') ship.speedTimer = SPEED_DURATION;
      if (p.kind === 'shield') ship.shieldTimer = SHIELD_DURATION;
      if (p.kind === 'triple') ship.tripleTimer = TRIPLE_DURATION;
      explode(p.x, p.y, 10);
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = getSkin().body;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudY = 44;
  ctx.fillStyle = getSkin().body;
  ctx.font = '12px monospace';
  ctx.fillText(`SKIN  ${getSkin().name}`, 14, hudY);
  hudY += 16;

  if (ship.speedTimer > 0) {
    ctx.fillStyle = '#0ff';
    ctx.font = '13px monospace';
    ctx.fillText(`VELOCIDAD x2  ${ship.speedTimer.toFixed(1)}s`, 14, hudY);
    hudY += 16;
  }

  if (ship.shieldTimer > 0) {
    ctx.fillStyle = '#f0f';
    ctx.font = '13px monospace';
    ctx.fillText(`ESCUDO  ${ship.shieldTimer.toFixed(1)}s`, 14, hudY);
    hudY += 16;
  }

  if (ship.tripleTimer > 0) {
    ctx.fillStyle = '#f0f';
    ctx.font = '13px monospace';
    ctx.fillText(`TRIPLE SHOT x3  ${ship.tripleTimer.toFixed(1)}s`, 14, hudY);
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
