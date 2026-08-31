import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';

const CONFIG = { gravity: -22, jumpSpeed: 12.2, boostSpeed: 25, moveSpeed: 7, platformGap: 2.7, platformSize: 4.2, collapseStart: -12, keepBelow: 22, seed: 81273 };
// Attiva le quote brevi per testare rapidamente biomi e progressione.
const DEBUG_MODE = false;
const DIFFICULTY_MAX_HEIGHT = DEBUG_MODE ? 70 : 700;
const SHORTCUT_START_HEIGHT = DEBUG_MODE ? 55 : 220;
const SHORTCUT_INTERVAL = DEBUG_MODE ? 38 : 240;
const DIFFICULTY_INTENSITY = 1.5;
const TOUCH_SWIPE_DEAD_ZONE = 11;
const TOUCH_MOVE_MULTIPLIER = 1.3;
const JUMP_LIMITS = { normalRise: CONFIG.jumpSpeed ** 2 / (2 * -CONFIG.gravity), boostRise: CONFIG.boostSpeed ** 2 / (2 * -CONFIG.gravity) };
const TYPES = { NORMAL: 'normal', MOVING: 'moving', FRAGILE: 'fragile', BOOST: 'boost', SMALL: 'small' };
const TYPE_COLORS = { normal: 0x4a7ea8, moving: 0x8b74d9, fragile: 0xe59a55, boost: 0x55d9a8, small: 0xd76585 };
const BIOME_HEIGHTS = DEBUG_MODE ? [0, 10, 20, 30, 40] : [0, 200, 500, 800, 1200];
const BIOMES = [{ at: BIOME_HEIGHTS[0], name: 'BASE', sky: 0x76bee8, fog: 0xb8e0ef, light: 0xfff1c9 }, { at: BIOME_HEIGHTS[1], name: 'CLOUDS', sky: 0x5c9fc9, fog: 0xa5cbdc, light: 0xe4f4ff }, { at: BIOME_HEIGHTS[2], name: 'STORM', sky: 0x303a59, fog: 0x5e6880, light: 0xa7a5de }, { at: BIOME_HEIGHTS[3], name: 'STRATOSPHERE', sky: 0x596fb3, fog: 0x8999c7, light: 0xd5ddff }, { at: BIOME_HEIGHTS[4], name: 'NEAR SPACE', sky: 0x01020a, fog: 0x070b1b, light: 0x9caeff }];
// I layer vengono avviati insieme e restano sincronizzati. Modifica qui i volumi (0 = muto, 1 = massimo) per ogni bioma.
const MUSIC_LAYERS = [
  'pad-2.ogg',         // layer 1
  'bass_pow-2.ogg',    // layer 2
  'kick-2.ogg',        // layer 3
  'pad2-2.ogg',        // layer 4
  'tictic-2.ogg',      // layer 5
  'snare-2.ogg',       // layer 6
  'bass_drone-2.ogg',  // layer 7
  'noise-2.ogg'        // layer 8
];
const mix = (...layers) => layers;
const BIOME_MUSIC = {
  BASE:        mix(1, 0,   0,   0, 0, 0,   0,   0),
  CLOUDS:      mix(1, 1,   0,   1, 0, 0,   0,   0),
  STORM:       mix(0, 1,   1,   0, 0, 0,   0,   0),
  STRATOSPHERE:mix(0, 1,   0,   1, 1, 1,   0,   0),
  'NEAR SPACE':mix(0, 1,   0,   0, 0, 0,   1,   1)
};

const scene = new THREE.Scene(); scene.background = new THREE.Color(BIOMES[0].sky); scene.fog = new THREE.Fog(BIOMES[0].fog, 18, 58);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 140);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true; document.body.appendChild(renderer.domElement);
const hemi = new THREE.HemisphereLight(BIOMES[0].light, 0x18233a, 1.8); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-8, 16, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14; sun.shadow.camera.near = 1; sun.shadow.camera.far = 45; sun.shadow.bias = -.0004; scene.add(sun, sun.target);
const collapse = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 2.8, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xff4f74, transparent: true, opacity: .28, side: THREE.DoubleSide })); scene.add(collapse);
const landscape = new THREE.Group(); scene.add(landscape);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x17464c, roughness: 1 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(34, 48), groundMaterial); ground.rotation.x = -Math.PI / 2; ground.position.y = -3; ground.receiveShadow = true; landscape.add(ground);
[[ -15, -11, 5, 7 ], [ 14, -13, 4, 6 ], [ -18, 4, 6, 9 ], [ 17, 5, 5, 8 ], [ -8, 17, 4, 6 ], [ 8, 18, 5, 7 ]].forEach(([x, z, radius, height], index) => { const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 5), new THREE.MeshStandardMaterial({ color: index % 2 ? 0x285d62 : 0x1d3c4c, flatShading: true, roughness: 1 })); mountain.position.set(x, -3 + height / 2, z); mountain.rotation.y = index * .65; mountain.castShadow = true; mountain.receiveShadow = true; landscape.add(mountain); });
const skyDecor = new THREE.Group(); scene.add(skyDecor);
const sunHalo = new THREE.Mesh(new THREE.CircleGeometry(3.5, 28), new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide })); sunHalo.position.set(-11, 9, -20.2); skyDecor.add(sunHalo);
const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(2.05, 20, 12), new THREE.MeshBasicMaterial({ color: 0xfff4c9, transparent: true, opacity: .98 })); sunDisc.position.set(-11, 9, -20); skyDecor.add(sunDisc);
function createCloud(x, y, z, scale, color) { const cloud = new THREE.Group(), materials = [], seed = (Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453) % 1, variation = Math.abs(seed), layout = [[0, 0, 0, 1], [1.1, .1, .1, .72], [-1, .05, .15, .66], [.25, .55, 0, .64], [1.75, -.08, -.15, .48], [-1.65, -.05, -.1, .46]]; layout.slice(0, 4 + Math.floor(variation * 3)).forEach(([cx, cy, cz, size], index) => { const puffVariation = (variation + index * .371) % 1, tone = new THREE.Color(color).lerp(new THREE.Color(0xffffff), .05 + puffVariation * .12), material = new THREE.MeshLambertMaterial({ color: tone, transparent: true, opacity: 0, depthWrite: false }); material.userData.opacityFactor = .76 + puffVariation * .24; const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), material); puff.position.set(cx + (puffVariation - .5) * .18, cy + (puffVariation - .5) * .16, cz); puff.scale.set(size * (1.18 + puffVariation * .35), size * (.5 + puffVariation * .22), size * (.86 + puffVariation * .22)); cloud.add(puff); materials.push(material); }); cloud.position.set(x, y, z); cloud.rotation.y = (variation - .5) * .45; cloud.scale.setScalar(scale * (.88 + variation * .22)); cloud.userData.materials = materials; skyDecor.add(cloud); return cloud; }
const baseClouds = [[-11, .5, -9, .9], [-5, 2, -12, 1.1], [4, 1, -10, .95], [10, 3.5, -15, .85], [-1, 5, -18, 1.2], [7, 7, -22, .9]].map(v => createCloud(...v, 0xffffff));
const denseClouds = [[-12, .5, -10, 1.1], [-7, 2, -14, 1.45], [-1, 1.5, -9, 1.25], [5, 3, -12, 1.55], [11, 2.5, -17, 1.35], [-10, 4.5, -19, 1.6], [-3, 5.5, -22, 1.45], [4, 5, -18, 1.5], [10, 6.5, -24, 1.3], [-8, 8, -26, 1.35]].map(v => createCloud(...v, 0xe4edf4));
const stormClouds = [[-11, .5, -10, 1.6], [-5, 2, -14, 1.9], [2, 1.5, -11, 1.7], [9, 3.5, -17, 1.95], [-9, 5, -20, 1.8], [-1, 5.5, -23, 2.1], [7, 6.5, -25, 1.7]].map(v => createCloud(...v, 0x263044));
let visualSeed = 918273; const visualRandom = () => (visualSeed = (visualSeed * 1664525 + 1013904223) >>> 0) / 4294967296;
const rainPositions = new Float32Array(180 * 3); for (let i = 0; i < rainPositions.length; i += 3) { rainPositions[i] = (visualRandom() - .5) * 25; rainPositions[i + 1] = visualRandom() * 22; rainPositions[i + 2] = -visualRandom() * 22; }
const rainGeometry = new THREE.BufferGeometry(); rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3)); const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xbcdcff, size: .09, transparent: true, opacity: 0, depthWrite: false })); scene.add(rain);
const starPositions = new Float32Array(260 * 3); for (let i = 0; i < starPositions.length; i += 3) { starPositions[i] = (visualRandom() - .5) * 68; starPositions[i + 1] = (visualRandom() - .5) * 52; starPositions[i + 2] = (visualRandom() - .5) * 44; }
const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3)); const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: .3, transparent: true, opacity: 0, depthWrite: false })); scene.add(stars);
const platformGeometry = new THREE.BoxGeometry(CONFIG.platformSize, .45, CONFIG.platformSize), smallGeometry = new THREE.BoxGeometry(2.65, .45, 2.65), playerGeometry = new THREE.SphereGeometry(.62, 20, 14);
const playerColors = new Float32Array(playerGeometry.attributes.position.count * 3), ballPalette = [new THREE.Color(0xff7165), new THREE.Color(0x77e2d0), new THREE.Color(0xf8f3d4)];
for (let i = 0; i < playerGeometry.attributes.position.count; i++) { const y = playerGeometry.attributes.position.getY(i), x = playerGeometry.attributes.position.getX(i), color = ballPalette[Math.floor((Math.atan2(y, x) + Math.PI) / (Math.PI * 2 / 3)) % ballPalette.length]; playerColors.set([color.r, color.g, color.b], i * 3); }
playerGeometry.setAttribute('color', new THREE.BufferAttribute(playerColors, 3));

let rng = CONFIG.seed, eventRng = CONFIG.seed ^ 0x9e3779b9, seed = CONFIG.seed, dailyMode = false;
let platforms = [], effects = [], player, velocity, currentPlatform, highestY, mainX, mainY, mainType, pattern = [];
let grounded = false, gameState = 'playing', lastTime = 0, elapsed = 0, deathTimer = 0, collapseY = CONFIG.collapseStart, nextEventAt = 24, activeEvent = null, lastEventKind = null, lastBiomeIndex = -1, lastBouncePlatform = null;
let keys = { left: false, right: false }, touchStartX = null, touchSteering = false;
const scoreEl = document.querySelector('#score'), bestEl = document.querySelector('#best'), timeEl = document.querySelector('#time'), overEl = document.querySelector('#game-over'), startEl = document.querySelector('#start-screen'), finalEl = document.querySelector('#final-score'), finalBestEl = document.querySelector('#final-best'), finalTimeEl = document.querySelector('#final-time'), bannerEl = document.querySelector('#banner'), biomeEl = document.querySelector('#biome'), modeEl = document.querySelector('#mode'), eventStatusEl = document.querySelector('#event-status'), eventNameEl = document.querySelector('#event-name'), eventTimeEl = document.querySelector('#event-time'), pauseEl = document.querySelector('#pause'), audioPanelEl = document.querySelector('#audio-panel'), musicVolumeEl = document.querySelector('#music-volume'), jumpVolumeEl = document.querySelector('#jump-volume'), bounceVolumeEl = document.querySelector('#bounce-volume'), musicValueEl = document.querySelector('#music-value'), jumpValueEl = document.querySelector('#jump-value'), bounceValueEl = document.querySelector('#bounce-value');
let best = Number(localStorage.getItem('tower-best') || 0);
let musicVolume = .35, jumpVolume = .55, bounceVolume = .50, musicStarted = false;
const musicTracks = MUSIC_LAYERS.map(file => { const track = new Audio(file); track.loop = true; track.preload = 'auto'; track.volume = 0; return track; });
const random = () => (rng = (rng * 1664525 + 1013904223) >>> 0) / 4294967296;
const eventRandom = () => (eventRng = (eventRng * 1103515245 + 12345) >>> 0) / 4294967296;
const clamp = THREE.MathUtils.clamp;
const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const hash = text => [...text].reduce((value, char) => ((value * 31 + char.charCodeAt(0)) >>> 0), 2166136261);
const biomeIndex = height => { for (let i = 0; i < BIOMES.length - 1; i++) if (height < BIOMES[i + 1].at) return i; return BIOMES.length - 1; };
const eventLabel = kind => kind === 'WIND' && biomeIndex(highestY) === BIOMES.length - 1 ? 'GRAVITY FIELD' : kind;

function updateAudioLabels() { musicValueEl.textContent = musicVolume.toFixed(2); jumpValueEl.textContent = jumpVolume.toFixed(2); bounceValueEl.textContent = bounceVolume.toFixed(2); }
function startMusic() { if (!musicStarted) { musicStarted = true; musicTracks.forEach(track => { track.currentTime = 0; track.play().catch(() => {}); }); } else musicTracks.forEach(track => track.play().catch(() => {})); }
function playSfx(file, volume) { const sound = new Audio(file); sound.volume = volume; sound.play().catch(() => {}); }
function updateMusic(dt, low, high, blend) { const lowMix = BIOME_MUSIC[low.name], highMix = BIOME_MUSIC[high.name]; musicTracks.forEach((track, index) => { const target = THREE.MathUtils.lerp(lowMix[index], highMix[index], blend) * musicVolume; track.volume = THREE.MathUtils.lerp(track.volume, target, Math.min(1, dt * 1.7)); }); }
function setPaused(paused) { if (paused) { gameState = 'paused'; audioPanelEl.classList.remove('hidden'); pauseEl.textContent = 'RESUME'; } else { gameState = 'playing'; audioPanelEl.classList.add('hidden'); pauseEl.textContent = 'PAUSE'; } }

function disposePlatform(p) { p.traverse(child => { if (child !== p && child.geometry) child.geometry.dispose(); if (child !== p && child.material) child.material.dispose(); }); scene.remove(p); p.geometry.dispose(); p.material.dispose(); }
function makeEffect(position, color, scale = 1) { const ring = new THREE.Mesh(new THREE.RingGeometry(.26, .34, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .8, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.copy(position); ring.scale.setScalar(scale); scene.add(ring); effects.push({ mesh: ring, age: 0 }); }
function makePlatform(x, y, type = TYPES.NORMAL, options = {}) {
  const small = type === TYPES.SMALL, difficulty = clamp(y / DIFFICULTY_MAX_HEIGHT, 0, 1), baseSize = small ? 2.65 : CONFIG.platformSize, size = baseSize * (1 - (small ? .18 : .28) * difficulty * DIFFICULTY_INTENSITY), material = new THREE.MeshStandardMaterial({ color: TYPE_COLORS[type], emissive: TYPE_COLORS[type], emissiveIntensity: type === TYPES.BOOST ? .32 : .06, roughness: .72 });
  const mesh = new THREE.Mesh(small ? smallGeometry.clone() : platformGeometry.clone(), material); mesh.position.set(x, y, 0); mesh.scale.set(size / baseSize, 1, size / baseSize); mesh.receiveShadow = true;
  mesh.userData = { type, top: y + .23, size, baseX: x, phase: random() * Math.PI * 2, active: true, baseColor: new THREE.Color(TYPE_COLORS[type]), route: options.route || 'main', index: options.index || 0 };
  const topColor = new THREE.Color(TYPE_COLORS[type]).lerp(new THREE.Color(0xffffff), .18), top = new THREE.Mesh(new THREE.PlaneGeometry(baseSize * .86, baseSize * .86), new THREE.MeshStandardMaterial({ color: topColor, emissive: topColor, emissiveIntensity: .12, roughness: .48, side: THREE.DoubleSide })); top.rotation.x = -Math.PI / 2; top.position.y = .23; top.receiveShadow = true; mesh.add(top);
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(small ? smallGeometry : platformGeometry), new THREE.LineBasicMaterial({ color: 0xe7f6ff, transparent: true, opacity: .23 })); mesh.add(outline);
  if (type === TYPES.BOOST) { const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, .09, 6, 18), new THREE.MeshBasicMaterial({ color: 0x9dffe3 })); ring.rotation.x = Math.PI / 2; ring.position.y = .28; mesh.add(ring); mesh.userData.boostRing = ring; }
  if (type === TYPES.MOVING) { mesh.userData.moveRange = .6 + random() * .35 + difficulty * .9 * DIFFICULTY_INTENSITY; mesh.userData.moveSpeed = 1.2 + difficulty * 3.2 * DIFFICULTY_INTENSITY; }
  if (type === TYPES.FRAGILE) mesh.userData.fragileDelay = .95 - difficulty * .15 * DIFFICULTY_INTENSITY;
  scene.add(mesh); platforms.push(mesh); return mesh;
}
function choosePattern(difficulty) { const choices = difficulty < .18 ? [[TYPES.NORMAL, TYPES.NORMAL, TYPES.NORMAL], [TYPES.NORMAL, TYPES.SMALL, TYPES.NORMAL]] : difficulty < .48 ? [[TYPES.NORMAL, TYPES.MOVING, TYPES.NORMAL], [TYPES.FRAGILE, TYPES.NORMAL, TYPES.NORMAL], [TYPES.SMALL, TYPES.SMALL, TYPES.NORMAL]] : [[TYPES.NORMAL, TYPES.MOVING, TYPES.SMALL], [TYPES.FRAGILE, TYPES.FRAGILE, TYPES.NORMAL], [TYPES.SMALL, TYPES.MOVING, TYPES.NORMAL], [TYPES.NORMAL, TYPES.BOOST, TYPES.NORMAL]]; return choices[Math.floor(random() * choices.length)].slice(); }
function chooseType(difficulty) { if (!pattern.length) pattern = choosePattern(difficulty); return pattern.shift(); }
function generateNextLevel() {
  const difficulty = clamp(mainY / DIFFICULTY_MAX_HEIGHT, 0, 1), type = chooseType(difficulty), previousWasBoost = mainType === TYPES.BOOST;
  const gap = previousWasBoost ? Math.min(JUMP_LIMITS.boostRise - .9, 7.0 + difficulty * 1.5) : Math.min(JUMP_LIMITS.normalRise - .28, CONFIG.platformGap + difficulty * .35);
  const maxStep = type === TYPES.SMALL ? 1.1 + difficulty * .55 : type === TYPES.MOVING ? 1.25 + difficulty * .45 : 1.5 + difficulty * .55;
  const step = (.55 + random() * maxStep) * (random() < .5 ? -1 : 1);
  mainX += step; mainY += gap; mainType = type; const platform = makePlatform(mainX, mainY, type, { index: Math.round(mainY / CONFIG.platformGap) });
  if (mainY > SHORTCUT_START_HEIGHT && mainY % SHORTCUT_INTERVAL < gap && random() < .34) { const side = makePlatform(mainX - Math.sign(step || 1) * (5.8 + random() * .8), mainY - gap * .5, TYPES.BOOST, { route: 'shortcut' }); side.userData.shortcut = true; }
  return platform;
}
function generateUntil(targetY) { while (mainY < targetY) generateNextLevel(); }
function clearWorld() { platforms.forEach(disposePlatform); platforms = []; effects.forEach(effect => { scene.remove(effect.mesh); effect.mesh.geometry.dispose(); effect.mesh.material.dispose(); }); effects = []; }
function reset(useDaily = dailyMode, startImmediately = true) {
  dailyMode = useDaily; seed = dailyMode ? hash(new Date().toISOString().slice(0, 10)) : ((crypto.getRandomValues(new Uint32Array(1))[0]) || CONFIG.seed); rng = seed; eventRng = seed ^ 0x9e3779b9;
  clearWorld(); elapsed = 0; highestY = 0; gameState = startImmediately ? 'playing' : 'ready'; deathTimer = 0; collapseY = CONFIG.collapseStart; nextEventAt = 24; activeEvent = null; lastEventKind = null; lastBiomeIndex = -1; lastBouncePlatform = null; pattern = []; mainX = 0; mainY = 0; mainType = TYPES.NORMAL; overEl.classList.add('hidden'); startEl.classList.toggle('hidden', startImmediately); bannerEl.classList.remove('show'); eventStatusEl.classList.add('hidden'); modeEl.textContent = dailyMode ? `DAILY · ${new Date().toISOString().slice(0, 10)}` : 'ENDLESS';
  makePlatform(0, 0, TYPES.NORMAL, { index: 0 }); generateUntil(42);
  if (player) { scene.remove(player); player.geometry.dispose(); player.material.dispose(); } player = new THREE.Mesh(playerGeometry.clone(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .28, metalness: .08, emissive: 0x101522, emissiveIntensity: .22 })); player.castShadow = true; player.position.set(0, .85, 0); scene.add(player); velocity = new THREE.Vector3(); currentPlatform = platforms[0]; grounded = true; camera.position.set(8, 6, 12); camera.lookAt(0, 2, 0); scoreEl.textContent = '0'; bestEl.textContent = best; timeEl.textContent = '00:00';
}
function jump() { if (gameState === 'playing' && grounded) { velocity.y = CONFIG.jumpSpeed; grounded = false; lastBouncePlatform = null; makeEffect(player.position, 0xffd0c8, .75); playSfx('jump.ogg', jumpVolume); } }
function setKey(code, down) { if (code === 'ArrowLeft' || code === 'KeyA') keys.left = down; if (code === 'ArrowRight' || code === 'KeyD') keys.right = down; if (code === 'Space' && down) jump(); }
function announce(text) { bannerEl.textContent = text; bannerEl.classList.add('show'); setTimeout(() => bannerEl.classList.remove('show'), 1700); }
function availableEvents() { const index = biomeIndex(highestY); if (index === BIOMES.length - 1) return ['WIND']; if (index === 3) return ['LOW GRAVITY']; if (index === 2) return ['STORM', 'WIND']; return ['WIND']; }
function startEvent() { const kinds = availableEvents(); let kind = kinds[Math.floor(eventRandom() * kinds.length)]; if (kinds.length > 1 && kind === lastEventKind) kind = kinds[(kinds.indexOf(kind) + 1) % kinds.length]; lastEventKind = kind; activeEvent = { kind, remaining: 7, direction: eventRandom() < .5 ? -1 : 1 }; announce(`${eventLabel(kind)} · 7s`); }
function updateEvent(dt) { if (activeEvent && !availableEvents().includes(activeEvent.kind)) { activeEvent = null; nextEventAt = Math.min(nextEventAt, elapsed + 3); } if (!activeEvent && elapsed >= nextEventAt) { startEvent(); nextEventAt += 28 + eventRandom() * 20; } if (activeEvent && (activeEvent.remaining -= dt) <= 0) activeEvent = null; if (activeEvent) { eventNameEl.textContent = eventLabel(activeEvent.kind); eventTimeEl.textContent = `${Math.ceil(activeEvent.remaining)}s`; eventStatusEl.classList.remove('hidden'); } else eventStatusEl.classList.add('hidden'); }
function updatePlatforms(dt) {
  for (const p of platforms) {
    const d = p.userData; d.deltaX = 0;
    if (d.type === TYPES.MOVING && d.active) { const oldX = p.position.x; p.position.x = d.baseX + Math.sin(elapsed * d.moveSpeed + d.phase) * d.moveRange; d.deltaX = p.position.x - oldX; }
    if (d.boostRing) { d.boostRing.rotation.z += dt * 2.4; d.boostRing.scale.setScalar(1 + Math.sin(elapsed * 5 + d.phase) * .08); }
    if (d.vanishAt !== undefined) { const age = elapsed - d.vanishAt, progress = clamp(age / .22, 0, 1); p.scale.setScalar(1 - progress); p.material.transparent = true; p.material.opacity = 1 - progress; if (progress >= 1) d.removeNow = true; continue; }
    if (d.fragileAt) { const age = elapsed - d.fragileAt; if (age > .25 && age < d.fragileDelay) { p.position.x += Math.sin(elapsed * 55) * .03; p.rotation.z = Math.sin(elapsed * 48) * .032; } if (age >= d.fragileDelay) { d.active = false; d.falling = true; } }
    if (d.falling) { p.position.y -= dt * 8; p.rotation.z += dt * .9; d.top = p.position.y + .225; }
    const danger = p.position.y < collapseY + 2.3;
    if (danger && d.active) { p.material.emissive.copy(d.baseColor).lerp(new THREE.Color(0xff244d), .62 + Math.sin(elapsed * 13) * .25); p.position.z = Math.sin(elapsed * 35 + d.phase) * .035; } else { p.position.z = 0; p.material.emissive.copy(d.baseColor); p.material.emissiveIntensity = d.type === TYPES.BOOST ? .32 : .06; }
    if (p.position.y < collapseY - .4 && d.active) { d.active = false; d.falling = true; }
  }
  platforms = platforms.filter(p => { if (p.userData.removeNow || p.position.y < collapseY - 11 || p.position.y < player.position.y - CONFIG.keepBelow - 10) { disposePlatform(p); return false; } return true; });
}
function vanishPlatform(p) { if (!p?.userData.active) return; p.userData.active = false; p.userData.vanishAt = elapsed; makeEffect(new THREE.Vector3(p.position.x, p.userData.top + .03, p.position.z), TYPE_COLORS[p.userData.type], 1.7); }
function vanishPlatformsBelow(p) { platforms.forEach(candidate => { if (candidate !== p && candidate.userData.active && candidate.userData.top < p.userData.top - .06) vanishPlatform(candidate); }); }
function landOn(p) { const d = p.userData, isNewLanding = p !== lastBouncePlatform; player.position.y = d.top + .62; currentPlatform = p; grounded = true; velocity.y = 0; if (isNewLanding) { playSfx('bounce.ogg', bounceVolume); lastBouncePlatform = p; } vanishPlatformsBelow(p); const landingPosition = new THREE.Vector3(player.position.x, d.top + .02, player.position.z); makeEffect(landingPosition, TYPE_COLORS[d.type], d.type === TYPES.BOOST ? 1.8 : 1); if (d.type === TYPES.FRAGILE && !d.fragileAt) d.fragileAt = elapsed; if (d.type === TYPES.BOOST) { velocity.y = CONFIG.boostSpeed; grounded = false; makeEffect(landingPosition, 0x9dffe3, 2.2); } }
function startDeath() { if (gameState !== 'playing') return; gameState = 'falling'; deathTimer = 1.05; grounded = false; announce('FALLING'); }
function finishGame() { gameState = 'gameover'; const score = Math.floor(highestY), isBest = score > best; if (isBest) { best = score; localStorage.setItem('tower-best', String(best)); } finalEl.textContent = `${score} m`; finalBestEl.textContent = `BEST: ${best} m${isBest ? ' · NEW BEST' : ''}`; finalTimeEl.textContent = `TIME: ${formatTime(elapsed)}`; overEl.classList.remove('hidden'); }
function setCloudOpacity(clouds, opacity) { clouds.forEach(cloud => cloud.userData.materials.forEach(material => { material.opacity = opacity * material.userData.opacityFactor; })); }
function updateAtmosphere(height, dt, stormEvent) {
  const cloudStart = BIOMES[1].at, stormStart = BIOMES[2].at, stratoStart = BIOMES[3].at, spaceStart = BIOMES[4].at, span = stormStart - cloudStart, smooth = THREE.MathUtils.smoothstep;
  const denseAmount = smooth(height, cloudStart - span * .4, cloudStart + span * .25) * (1 - smooth(height, stormStart, stormStart + span * .45));
  const stormAmount = smooth(height, stormStart - span * .25, stormStart + span * .12) * (1 - smooth(height, stratoStart - span * .25, stratoStart));
  const starsAmount = smooth(height, spaceStart - span * .45, spaceStart + span * .25);
  setCloudOpacity(baseClouds, .42 * (1 - smooth(height, cloudStart, stormStart))); setCloudOpacity(denseClouds, .72 * denseAmount); setCloudOpacity(stormClouds, .9 * stormAmount);
  const sunAmount = 1 - smooth(height, cloudStart, stormStart); sunDisc.material.opacity = .98 * sunAmount; sunHalo.material.opacity = .18 * sunAmount; stars.material.opacity = .9 * starsAmount; stars.position.set(player.position.x, player.position.y + 14, player.position.z - 25);
  const rainAmount = Math.max(stormAmount, stormEvent ? .75 : 0); rain.material.opacity = .82 * rainAmount; rain.position.set(player.position.x, player.position.y - 4, player.position.z);
  if (rainAmount > 0) { const positions = rain.geometry.attributes.position.array; for (let i = 1; i < positions.length; i += 3) { positions[i] -= dt * 24; if (positions[i] < -3) positions[i] = 22; } rain.geometry.attributes.position.needsUpdate = true; }
}
function updateBiome(dt) {
  const height = highestY, index = biomeIndex(height), low = BIOMES[index], high = BIOMES[Math.min(index + 1, BIOMES.length - 1)];
  if (index !== lastBiomeIndex) { if (lastBiomeIndex >= 0) nextEventAt = Math.min(nextEventAt, elapsed + 3); lastBiomeIndex = index; }
  const t = high.at === low.at ? 0 : clamp((height - low.at) / (high.at - low.at), 0, 1), stormEvent = activeEvent?.kind === 'STORM';
  scene.background.lerpColors(new THREE.Color(low.sky), new THREE.Color(high.sky), t); scene.fog.color.lerpColors(new THREE.Color(low.fog), new THREE.Color(high.fog), t); hemi.color.lerpColors(new THREE.Color(low.light), new THREE.Color(high.light), t); groundMaterial.color.lerpColors(new THREE.Color(0x3d7c59), new THREE.Color(0x141c35), clamp(height / BIOMES[3].at, 0, 1));
  if (stormEvent) { scene.background.lerp(new THREE.Color(0x02030a), .72); scene.fog.color.lerp(new THREE.Color(0x080a17), .78); hemi.intensity = .42; sun.intensity = .22; scene.fog.far = 13; } else { hemi.intensity = 1.8; sun.intensity = 2.2; scene.fog.far = 58; }
  skyDecor.position.set(player.position.x, player.position.y, player.position.z); sun.position.set(player.position.x - 9, player.position.y + 16, player.position.z + 8); sun.target.position.set(player.position.x, player.position.y, player.position.z); sun.target.updateMatrixWorld(); updateAtmosphere(height, dt, stormEvent); updateMusic(dt, low, high, t); biomeEl.textContent = low.name;
}
function updateEffects(dt) { effects = effects.filter(effect => { effect.age += dt; effect.mesh.scale.multiplyScalar(1 + dt * 2.2); effect.mesh.material.opacity = Math.max(0, 1 - effect.age / .45); if (effect.age > .45) { scene.remove(effect.mesh); effect.mesh.geometry.dispose(); effect.mesh.material.dispose(); return false; } return true; }); }
function update(dt) {
  updateEffects(dt); if (gameState === 'gameover' || gameState === 'ready' || gameState === 'paused') return; elapsed += dt; updateEvent(dt); const gravity = activeEvent?.kind === 'LOW GRAVITY' ? CONFIG.gravity * .58 : CONFIG.gravity, wind = activeEvent?.kind === 'WIND' ? activeEvent.direction * 2.6 : 0;
  collapseY += (.48 + Math.min(.42, highestY / 2200)) * dt; collapse.position.y = collapseY - 1.3; collapse.material.opacity = .3; collapse.material.color.set(0xff4f74); updatePlatforms(dt);
  if (gameState === 'playing') {
    const direction = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), movementSpeed = CONFIG.moveSpeed * (touchSteering ? TOUCH_MOVE_MULTIPLIER : 1); if (grounded && currentPlatform?.userData.deltaX) player.position.x += currentPlatform.userData.deltaX;
    velocity.x = THREE.MathUtils.lerp(velocity.x, direction * movementSpeed + wind, Math.min(1, dt * 10)); velocity.z = THREE.MathUtils.lerp(velocity.z, 0, Math.min(1, dt * 10)); velocity.y += gravity * dt; const oldPosition = player.position.clone(); player.position.addScaledVector(velocity, dt); player.rotation.z -= velocity.x * dt / .62; if (!grounded) player.rotation.x -= dt * 8; grounded = false;
    if (velocity.y <= 0) {
      let landing = null;
      for (const p of platforms) {
        const d = p.userData, startBottom = oldPosition.y - .62, endBottom = player.position.y - .62;
        if (!d.active || startBottom < d.top - .06 || endBottom > d.top + .06) continue;
        const cross = clamp((startBottom - d.top) / Math.max(.0001, startBottom - endBottom), 0, 1);
        const xAtCross = THREE.MathUtils.lerp(oldPosition.x, player.position.x, cross), zAtCross = THREE.MathUtils.lerp(oldPosition.z, player.position.z, cross);
        if (Math.abs(xAtCross - p.position.x) < d.size / 2 + .35 && Math.abs(zAtCross - p.position.z) < d.size / 2 + .35 && (!landing || d.top > landing.userData.top)) landing = p;
      }
      if (landing) landOn(landing);
    }
    highestY = Math.max(highestY, player.position.y); generateUntil(player.position.y + 35); if (player.position.y < collapseY + .55 || (!grounded && player.position.y < highestY - 14)) startDeath();
  } else if (gameState === 'falling') { velocity.y += gravity * dt; player.position.addScaledVector(velocity, dt); if ((deathTimer -= dt) <= 0) finishGame(); }
  scoreEl.textContent = Math.floor(highestY); bestEl.textContent = best; timeEl.textContent = formatTime(elapsed); updateBiome(dt); const fovTarget = velocity.y > 13 ? 59 : 55; camera.fov = THREE.MathUtils.lerp(camera.fov, fovTarget, dt * 4); camera.updateProjectionMatrix(); camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x + 8, dt * 3); camera.position.y = THREE.MathUtils.lerp(camera.position.y, player.position.y + 6, dt * 3); camera.position.z = THREE.MathUtils.lerp(camera.position.z, player.position.z + 12, dt * 3); camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
}
addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); if (e.code === 'Space' && e.repeat) return; setKey(e.code, true); }); addEventListener('keyup', e => setKey(e.code, false));
document.querySelector('#play').addEventListener('click', () => { startMusic(); setPaused(false); startEl.classList.add('hidden'); }); document.querySelector('#restart').addEventListener('click', () => { startMusic(); reset(dailyMode); }); document.querySelector('#daily').addEventListener('click', () => { startMusic(); reset(true); }); pauseEl.addEventListener('click', () => { if (gameState === 'playing') setPaused(true); else if (gameState === 'paused') setPaused(false); });
[[musicVolumeEl, value => { musicVolume = value; }, musicValueEl], [jumpVolumeEl, value => { jumpVolume = value; }, jumpValueEl], [bounceVolumeEl, value => { bounceVolume = value; }, bounceValueEl]].forEach(([slider, setVolume, label]) => slider.addEventListener('input', () => { setVolume(Number(slider.value) / 100); label.textContent = (Number(slider.value) / 100).toFixed(2); })); updateAudioLabels();
renderer.domElement.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { touchStartX = e.clientX; touchSteering = false; renderer.domElement.setPointerCapture(e.pointerId); } else jump(); }); renderer.domElement.addEventListener('pointermove', e => { if (touchStartX === null) return; const delta = e.clientX - touchStartX; keys.left = delta < -TOUCH_SWIPE_DEAD_ZONE; keys.right = delta > TOUCH_SWIPE_DEAD_ZONE; touchSteering = keys.left || keys.right; }); renderer.domElement.addEventListener('pointerup', e => { if (touchStartX !== null && Math.abs(e.clientX - touchStartX) < TOUCH_SWIPE_DEAD_ZONE) jump(); touchStartX = null; touchSteering = false; keys.left = false; keys.right = false; }); renderer.domElement.addEventListener('pointercancel', () => { touchStartX = null; touchSteering = false; keys.left = false; keys.right = false; });
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
function animate(time) { requestAnimationFrame(animate); const dt = Math.min((time - lastTime) / 1000 || 0, .05); lastTime = time; update(dt); renderer.render(scene, camera); }
reset(false, false); requestAnimationFrame(animate);
