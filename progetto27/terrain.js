import * as THREE from "three";

// ============================================================================
// CERCA: SETTAGGI TERRENO
// Modifica qui le dimensioni del mondo e l'aspetto del terreno procedurale.
// ============================================================================
export const TERRAIN_SETTINGS = {
  chunkSize: 64, // Larghezza e profondità di ogni pezzo di terreno, in metri.
  segments: 32, // Suddivisioni per lato: più alto = terreno più morbido ma più pesante.
  loadRadius: 3, // Numero di chunk caricati intorno al drone in ogni direzione.
  worldHalfSize: 192, // Distanza dal centro al limite invisibile della mappa.
  cityHalfSize: 128, // Metà larghezza della zona urbana piatta centrale.
  mountainHeight: 40, // Altezza massima indicativa delle montagne esterne.
  mountainBaseLevel: 0.6, // Altezza di base usata per dare corpo alle montagne.
  broadNoiseScale: 0.018, // Grandezza delle forme ampie del paesaggio.
  detailNoiseScale: 0.07, // Frequenza dei dettagli più piccoli del terreno.
  ridgeNoiseScale: 0.032, // Frequenza delle creste rocciose.
  broadNoiseStrength: 0.55, // Peso delle forme ampie nell'altezza finale.
  detailNoiseStrength: 0.25, // Peso dei dettagli piccoli nell'altezza finale.
  ridgeNoiseStrength: 0.35, // Peso delle creste nell'altezza finale.
  slopeRockThreshold: 0.18, // Pendenza oltre la quale il terreno diventa roccioso.
  mountainRockThreshold: 0.72, // Presenza montuosa oltre la quale prevale la roccia.
  colorVariation: 0.12, // Variazione chiaro/scuro applicata ai colori del terreno.
  colors: {
    asphalt: 0x4b4f50, // Colore dominante nella città.
    gravel: 0x9a958c, // Colore delle chiazze di ghiaia.
    dirt: 0x76523b, // Colore della terra.
    concrete: 0x858887, // Colore delle zone di cemento.
    grass: 0x5d934e, // Colore dell'erba, volutamente poco presente.
    rock: 0x6f7472 // Colore delle montagne e delle pareti ripide.
  }
};

// ============================================================================
// CERCA: SETTAGGI EDIFICI
// Modifica qui quantità, distanza, dimensioni e materiali dei palazzi.
// ============================================================================
export const BUILDING_SETTINGS = {
  maxBuildings: 400, // Numero massimo di edifici caricati contemporaneamente.
  minClearanceMultiplier: 1.15, // Margine tra edifici rispetto al diametro del drone.
  minPerChunk: 20, // Numero minimo di tentativi di edificio per chunk urbano.
  extraPerChunk: 6, // Quantità casuale aggiuntiva di tentativi per chunk.
  gridColumns: 5, // Colonne della griglia usata per distribuire gli edifici.
  gridRows: 5, // Righe della griglia usata per distribuire gli edifici.
  gridStart: 5, // Distanza iniziale dal bordo del chunk.
  gridSpacing: 12, // Distanza tra i punti principali della griglia.
  positionJitter: 4, // Spostamento casuale massimo dalla griglia regolare.
  scaleMin: 0.6, // Fattore casuale minimo usato per larghezza e altezza.
  scaleRange: 0.85, // Escursione casuale aggiunta a scaleMin.
  safeSpawnMargin: 16, // Fascia esclusa quando si cerca il punto di partenza.
  safeSpawnStep: 8, // Precisione della ricerca del punto di partenza.
  candidateMaxHeight: 76, // Altezza prudenziale usata durante il piazzamento.
  shapeLevels: 5, // Numero di fasce verticali che formano ogni facciata.
  insetLevels: [1, 3], // Fasce che rientrano verso l'interno senza sporgere.
  ringInset: 0.06, // Profondità dei rientri orizzontali.
  nicheDepth: 0.08, // Profondità delle nicchie scure verticali.
  types: [
    // Ogni tipo usa: base + scala casuale * moltiplicatore.
    { widthBase: 8, widthScale: 3.8, depthBase: 8, depthScale: 3.4, heightBase: 18, heightScale: 18 }, // Torre media.
    { widthBase: 6, widthScale: 2.6, depthBase: 6, depthScale: 2.4, heightBase: 30, heightScale: 28 }, // Torre stretta e alta.
    { widthBase: 8, widthScale: 3.8, depthBase: 8, depthScale: 3.4, heightBase: 12, heightScale: 14 }, // Edificio basso.
    { widthBase: 8, widthScale: 3.8, depthBase: 8, depthScale: 3.4, heightBase: 42, heightScale: 34 } // Grattacielo molto alto.
  ],
  facadeStyles: [
    { color: 0x6d7378, roughness: 0.84, metalness: 0.08 }, // Cemento chiaro.
    { color: 0x39444c, roughness: 0.72, metalness: 0.16 }, // Metallo scuro.
    { color: 0x8b8f8c, roughness: 0.9, metalness: 0.04 }, // Cemento molto opaco.
    { color: 0x26343d, roughness: 0.62, metalness: 0.22 } // Facciata blu-grigia.
  ]
};

// ============================================================================
// CERCA: CLASSE TERRENO
// Questa classe crea chunk, montagne, palazzi e hitbox. Normalmente non serve
// modificarla: per cambiare il mondo usa i due blocchi di settaggi qui sopra.
// ============================================================================
export class TerrainWorld {
  /**
   * @param {THREE.Scene} scene Scena Three.js che riceve terreno ed edifici.
   * @param {number} playerHitboxRadius Raggio del drone, usato per lasciare passaggi sicuri.
   */
  constructor(scene, playerHitboxRadius) {
    this.scene = scene;
    this.playerHitboxRadius = playerHitboxRadius;
    this.mountainBeltSize = TERRAIN_SETTINGS.worldHalfSize - TERRAIN_SETTINGS.cityHalfSize;
    this.minBuildingClearance = playerHitboxRadius * 2 * BUILDING_SETTINGS.minClearanceMultiplier;

    this.terrainChunks = new Map();
    this.structureChunks = new Map();
    this.buildingHitboxes = new Map();
    this.activeBuildingCount = 0;
    this.loadedCenterX = null;
    this.loadedCenterZ = null;

    this.terrainColors = Object.fromEntries(
      Object.entries(TERRAIN_SETTINGS.colors).map(([name, value]) => [name, new THREE.Color(value)])
    );
    this.terrainColorScratch = new THREE.Color();
    this.closestPointScratch = new THREE.Vector3();
    this.separationScratch = new THREE.Vector3();

    this.buildingMaterials = BUILDING_SETTINGS.facadeStyles.map(style => (
      new THREE.MeshStandardMaterial({
        color: style.color,
        vertexColors: true,
        roughness: style.roughness,
        metalness: style.metalness
      })
    ));
    this.buildingGeometry = this.createAlienBuildingGeometry();
    this.terrainIndex = this.createTerrainIndex();
  }

  hash2D(x, z) {
    let hash = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ Math.imul(270827, 1442695041);
    hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
    return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295;
  }

  smooth(value) {
    return value * value * (3 - 2 * value);
  }

  lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  valueNoise(x, z) {
    const x0 = Math.floor(x);
    const z0 = Math.floor(z);
    const tx = this.smooth(x - x0);
    const tz = this.smooth(z - z0);
    const n00 = this.hash2D(x0, z0);
    const n10 = this.hash2D(x0 + 1, z0);
    const n01 = this.hash2D(x0, z0 + 1);
    const n11 = this.hash2D(x0 + 1, z0 + 1);
    return this.lerp(this.lerp(n00, n10, tx), this.lerp(n01, n11, tx), tz);
  }

  fractalNoise(x, z, octaves = 4) {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let weight = 0;
    for (let octave = 0; octave < octaves; octave++) {
      sum += this.valueNoise(x * frequency, z * frequency) * amplitude;
      weight += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / weight;
  }

  mountainFactorAt(x, z) {
    const distanceFromCity = Math.max(Math.abs(x), Math.abs(z)) - TERRAIN_SETTINGS.cityHalfSize;
    return this.smooth(THREE.MathUtils.clamp(distanceFromCity / this.mountainBeltSize, 0, 1));
  }

  /** Restituisce l'altezza del terreno in una coordinata globale. */
  heightAt(x, z) {
    const mountainFactor = this.mountainFactorAt(x, z);
    if (mountainFactor === 0) return 0;

    const broad = this.fractalNoise(
      x * TERRAIN_SETTINGS.broadNoiseScale,
      z * TERRAIN_SETTINGS.broadNoiseScale,
      4
    );
    const detail = this.fractalNoise(
      x * TERRAIN_SETTINGS.detailNoiseScale + 17.3,
      z * TERRAIN_SETTINGS.detailNoiseScale - 9.1,
      3
    );
    const ridgeNoise = this.fractalNoise(
      x * TERRAIN_SETTINGS.ridgeNoiseScale - 41.7,
      z * TERRAIN_SETTINGS.ridgeNoiseScale + 28.4,
      3
    );
    const ridge = 1 - Math.abs(ridgeNoise * 2 - 1);
    const terrainShape = TERRAIN_SETTINGS.mountainBaseLevel
      + (broad - 0.5) * TERRAIN_SETTINGS.broadNoiseStrength
      + (detail - 0.5) * TERRAIN_SETTINGS.detailNoiseStrength
      + ridge * TERRAIN_SETTINGS.ridgeNoiseStrength;
    return mountainFactor * Math.max(0, terrainShape) * TERRAIN_SETTINGS.mountainHeight;
  }

  terrainColor(slope, x, z) {
    const mountainFactor = this.mountainFactorAt(x, z);
    const patch = this.valueNoise(x * 0.035 + 41, z * 0.035 - 17);
    const detail = this.valueNoise(x * 0.13 - 83, z * 0.13 + 29);
    let color;

    if (mountainFactor < 0.02) {
      if (patch < 0.5) color = this.terrainColors.asphalt;
      else if (patch < 0.72) color = this.terrainColors.gravel;
      else if (patch < 0.9) color = this.terrainColors.dirt;
      else if (patch < 0.965) color = this.terrainColors.concrete;
      else color = this.terrainColors.grass;
    } else if (
      slope > TERRAIN_SETTINGS.slopeRockThreshold
      || mountainFactor > TERRAIN_SETTINGS.mountainRockThreshold
    ) {
      color = this.terrainColors.rock;
    } else if (patch < 0.58) {
      color = this.terrainColors.grass;
    } else if (patch < 0.84) {
      color = this.terrainColors.dirt;
    } else {
      color = this.terrainColors.rock;
    }

    this.terrainColorScratch.copy(color);
    this.terrainColorScratch.offsetHSL(
      0,
      0,
      (detail - 0.5) * TERRAIN_SETTINGS.colorVariation
    );
    return this.terrainColorScratch;
  }

  seededRandom(chunkX, chunkZ, slot) {
    return this.hash2D(chunkX * 97 + slot * 31 + 13, chunkZ * 89 - slot * 47 - 7);
  }

  appendBox(data, minX, maxX, minY, maxY, minZ, maxZ, color) {
    const faces = [
      { normal: [0, 0, 1], corners: [[minX, minY, maxZ], [maxX, minY, maxZ], [maxX, maxY, maxZ], [minX, maxY, maxZ]] },
      { normal: [0, 0, -1], corners: [[maxX, minY, minZ], [minX, minY, minZ], [minX, maxY, minZ], [maxX, maxY, minZ]] },
      { normal: [1, 0, 0], corners: [[maxX, minY, maxZ], [maxX, minY, minZ], [maxX, maxY, minZ], [maxX, maxY, maxZ]] },
      { normal: [-1, 0, 0], corners: [[minX, minY, minZ], [minX, minY, maxZ], [minX, maxY, maxZ], [minX, maxY, minZ]] },
      { normal: [0, 1, 0], corners: [[minX, maxY, maxZ], [maxX, maxY, maxZ], [maxX, maxY, minZ], [minX, maxY, minZ]] },
      { normal: [0, -1, 0], corners: [[minX, minY, minZ], [maxX, minY, minZ], [maxX, minY, maxZ], [minX, minY, maxZ]] }
    ];

    for (const face of faces) {
      const base = data.positions.length / 3;
      for (const [x, y, z] of face.corners) {
        data.positions.push(x, y, z);
        data.normals.push(...face.normal);
        data.colors.push(...color);
      }
      data.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  createAlienBuildingGeometry() {
    const data = { positions: [], normals: [], colors: [], indices: [] };
    const columns = [
      [-0.5, -0.36, [1, 1, 1]],
      [-0.36, -0.31, [0.18, 0.24, 0.27]],
      [-0.31, -0.08, [1, 1, 1]],
      [-0.08, -0.03, [1, 0.68, 0.24]],
      [-0.03, 0.14, [1, 1, 1]],
      [0.14, 0.19, [0.18, 0.24, 0.27]],
      [0.19, 0.5, [1, 1, 1]]
    ];
    const levels = BUILDING_SETTINGS.shapeLevels;

    for (let level = 0; level < levels; level++) {
      const minY = level / levels;
      const maxY = (level + 1) / levels;
      const ringInset = BUILDING_SETTINGS.insetLevels.includes(level)
        ? BUILDING_SETTINGS.ringInset
        : 0;
      const span = 1 - ringInset * 2;

      for (const [rawMinX, rawMaxX, color] of columns) {
        const minX = -0.5 + ringInset + (rawMinX + 0.5) * span;
        const maxX = -0.5 + ringInset + (rawMaxX + 0.5) * span;
        const depthInset = color[0] < 0.5 ? BUILDING_SETTINGS.nicheDepth : 0;
        this.appendBox(
          data,
          minX,
          maxX,
          minY,
          maxY,
          -0.5 + ringInset + depthInset,
          0.5 - ringInset - depthInset,
          color
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(data.normals, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(data.colors, 3));
    geometry.setIndex(data.indices);
    return geometry;
  }

  buildingSize(kind, scale) {
    const type = BUILDING_SETTINGS.types[kind];
    const width = type.widthBase + scale * type.widthScale;
    const depth = type.depthBase + scale * type.depthScale;
    const height = type.heightBase + scale * type.heightScale;
    return { width, depth, height };
  }

  createBuilding(x, z, kind, scale, facadeIndex) {
    const { width, depth, height } = this.buildingSize(kind, scale);
    const baseY = this.heightAt(x, z);
    const building = new THREE.Mesh(this.buildingGeometry, this.buildingMaterials[facadeIndex]);
    building.position.set(x, baseY, z);
    building.scale.set(width, height, depth);
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData.hitbox = new THREE.Box3(
      new THREE.Vector3(x - width * 0.5, baseY, z - depth * 0.5),
      new THREE.Vector3(x + width * 0.5, baseY + height, z + depth * 0.5)
    );
    return building;
  }

  hasBuildingClearance(candidateHitbox, localHitboxes) {
    const overlapsWithClearance = hitbox => !(
      candidateHitbox.max.x + this.minBuildingClearance <= hitbox.min.x
      || candidateHitbox.min.x - this.minBuildingClearance >= hitbox.max.x
      || candidateHitbox.max.z + this.minBuildingClearance <= hitbox.min.z
      || candidateHitbox.min.z - this.minBuildingClearance >= hitbox.max.z
    );

    for (const hitboxes of this.buildingHitboxes.values()) {
      for (const hitbox of hitboxes) {
        if (overlapsWithClearance(hitbox)) return false;
      }
    }
    return !localHitboxes.some(overlapsWithClearance);
  }

  createStructuresChunk(chunkX, chunkZ) {
    const group = new THREE.Group();
    const chunkHitboxes = [];
    const chunkMinX = chunkX * TERRAIN_SETTINGS.chunkSize;
    const chunkMaxX = chunkMinX + TERRAIN_SETTINGS.chunkSize;
    const chunkMinZ = chunkZ * TERRAIN_SETTINGS.chunkSize;
    const chunkMaxZ = chunkMinZ + TERRAIN_SETTINGS.chunkSize;

    if (
      chunkMaxX > -TERRAIN_SETTINGS.cityHalfSize
      && chunkMinX < TERRAIN_SETTINGS.cityHalfSize
      && chunkMaxZ > -TERRAIN_SETTINGS.cityHalfSize
      && chunkMinZ < TERRAIN_SETTINGS.cityHalfSize
    ) {
      const count = BUILDING_SETTINGS.minPerChunk
        + Math.floor(this.seededRandom(chunkX, chunkZ, 0) * BUILDING_SETTINGS.extraPerChunk);

      for (let index = 0; index < count; index++) {
        if (this.activeBuildingCount >= BUILDING_SETTINGS.maxBuildings) break;
        const slot = index * 11 + 1;
        const column = index % BUILDING_SETTINGS.gridColumns;
        const row = Math.floor(index / BUILDING_SETTINGS.gridColumns) % BUILDING_SETTINGS.gridRows;
        const jitterX = (this.seededRandom(chunkX, chunkZ, slot) - 0.5) * BUILDING_SETTINGS.positionJitter;
        const jitterZ = (this.seededRandom(chunkX, chunkZ, slot + 1) - 0.5) * BUILDING_SETTINGS.positionJitter;
        const localX = BUILDING_SETTINGS.gridStart + column * BUILDING_SETTINGS.gridSpacing + jitterX;
        const localZ = BUILDING_SETTINGS.gridStart + row * BUILDING_SETTINGS.gridSpacing + jitterZ;
        const kind = Math.floor(this.seededRandom(chunkX, chunkZ, slot + 2) * 4);
        const scale = BUILDING_SETTINGS.scaleMin
          + this.seededRandom(chunkX, chunkZ, slot + 3) * BUILDING_SETTINGS.scaleRange;
        const { width, depth } = this.buildingSize(kind, scale);
        const worldX = chunkX * TERRAIN_SETTINGS.chunkSize + localX;
        const worldZ = chunkZ * TERRAIN_SETTINGS.chunkSize + localZ;

        if (
          Math.abs(worldX) + width * 0.5 > TERRAIN_SETTINGS.cityHalfSize
          || Math.abs(worldZ) + depth * 0.5 > TERRAIN_SETTINGS.cityHalfSize
        ) continue;

        const baseY = this.heightAt(worldX, worldZ);
        const candidateHitbox = new THREE.Box3(
          new THREE.Vector3(worldX - width * 0.5, baseY, worldZ - depth * 0.5),
          new THREE.Vector3(
            worldX + width * 0.5,
            baseY + BUILDING_SETTINGS.candidateMaxHeight,
            worldZ + depth * 0.5
          )
        );
        if (!this.hasBuildingClearance(candidateHitbox, chunkHitboxes)) continue;

        const facadeIndex = Math.floor(
          this.seededRandom(chunkX, chunkZ, slot + 4) * this.buildingMaterials.length
        );
        const building = this.createBuilding(worldX, worldZ, kind, scale, facadeIndex);
        group.add(building);
        chunkHitboxes.push(building.userData.hitbox);
        this.activeBuildingCount++;
      }
    }

    group.userData.buildingCount = chunkHitboxes.length;
    this.buildingHitboxes.set(this.chunkKey(chunkX, chunkZ), chunkHitboxes);
    this.scene.add(group);
    return group;
  }

  disposeStructureGroup(group) {
    this.activeBuildingCount = Math.max(
      0,
      this.activeBuildingCount - (group.userData.buildingCount || 0)
    );
    group.clear();
  }

  createTerrainIndex() {
    const indices = [];
    const rowStride = TERRAIN_SETTINGS.segments + 1;
    for (let row = 0; row < TERRAIN_SETTINGS.segments; row++) {
      for (let column = 0; column < TERRAIN_SETTINGS.segments; column++) {
        const a = row * rowStride + column;
        const b = a + 1;
        const d = (row + 1) * rowStride + column;
        const c = d + 1;
        indices.push(a, d, b, b, d, c);
      }
    }
    return new Uint16Array(indices);
  }

  createTerrainChunk(chunkX, chunkZ) {
    const size = TERRAIN_SETTINGS.chunkSize;
    const segments = TERRAIN_SETTINGS.segments;
    const half = size * 0.5;
    const worldOriginX = chunkX * size + half;
    const worldOriginZ = chunkZ * size + half;
    const rowStride = segments + 1;
    const vertexCount = rowStride * rowStride;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const heights = new Float32Array(vertexCount);
    const step = size / segments;

    for (let row = 0; row <= segments; row++) {
      for (let column = 0; column <= segments; column++) {
        const vertexIndex = row * rowStride + column;
        const localX = -half + column * step;
        const localZ = -half + row * step;
        const worldX = worldOriginX + localX;
        const worldZ = worldOriginZ + localZ;
        const height = this.heightAt(worldX, worldZ);
        heights[vertexIndex] = height;
        positions[vertexIndex * 3] = localX;
        positions[vertexIndex * 3 + 1] = height;
        positions[vertexIndex * 3 + 2] = localZ;
      }
    }

    for (let row = 0; row <= segments; row++) {
      for (let column = 0; column <= segments; column++) {
        const vertexIndex = row * rowStride + column;
        const left = heights[row * rowStride + Math.max(0, column - 1)];
        const right = heights[row * rowStride + Math.min(segments, column + 1)];
        const previousRow = Math.max(0, row - 1) * rowStride + column;
        const nextRow = Math.min(segments, row + 1) * rowStride + column;
        const slopeX = Math.abs(right - left) / (column === 0 || column === segments ? step : step * 2);
        const slopeZ = Math.abs(heights[nextRow] - heights[previousRow])
          / (row === 0 || row === segments ? step : step * 2);
        const worldX = worldOriginX - half + column * step;
        const worldZ = worldOriginZ - half + row * step;
        const color = this.terrainColor(Math.max(slopeX, slopeZ), worldX, worldZ);
        colors[vertexIndex * 3] = color.r;
        colors[vertexIndex * 3 + 1] = color.g;
        colors[vertexIndex * 3 + 2] = color.b;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setIndex(new THREE.BufferAttribute(this.terrainIndex, 1));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })
    );
    mesh.position.set(worldOriginX, 0, worldOriginZ);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  chunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }

  /** Carica e scarica i chunk intorno alla posizione indicata. */
  syncAround(position) {
    const centerX = Math.floor(position.x / TERRAIN_SETTINGS.chunkSize);
    const centerZ = Math.floor(position.z / TERRAIN_SETTINGS.chunkSize);
    if (centerX === this.loadedCenterX && centerZ === this.loadedCenterZ) return;

    const needed = new Set();
    for (let dz = -TERRAIN_SETTINGS.loadRadius; dz <= TERRAIN_SETTINGS.loadRadius; dz++) {
      for (let dx = -TERRAIN_SETTINGS.loadRadius; dx <= TERRAIN_SETTINGS.loadRadius; dx++) {
        const chunkX = centerX + dx;
        const chunkZ = centerZ + dz;
        const key = this.chunkKey(chunkX, chunkZ);
        needed.add(key);
        if (!this.terrainChunks.has(key)) {
          this.terrainChunks.set(key, this.createTerrainChunk(chunkX, chunkZ));
        }
        if (!this.structureChunks.has(key)) {
          this.structureChunks.set(key, this.createStructuresChunk(chunkX, chunkZ));
        }
      }
    }

    for (const [key, mesh] of this.terrainChunks) {
      if (needed.has(key)) continue;
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
      this.terrainChunks.delete(key);
    }
    for (const [key, group] of this.structureChunks) {
      if (needed.has(key)) continue;
      this.scene.remove(group);
      this.disposeStructureGroup(group);
      this.buildingHitboxes.delete(key);
      this.structureChunks.delete(key);
    }

    this.loadedCenterX = centerX;
    this.loadedCenterZ = centerZ;
  }

  spawnClearance(x, z) {
    let nearest = Infinity;
    for (const hitboxes of this.buildingHitboxes.values()) {
      for (const hitbox of hitboxes) {
        const dx = x < hitbox.min.x ? hitbox.min.x - x : x > hitbox.max.x ? x - hitbox.max.x : 0;
        const dz = z < hitbox.min.z ? hitbox.min.z - z : z > hitbox.max.z ? z - hitbox.max.z : 0;
        nearest = Math.min(nearest, Math.hypot(dx, dz));
      }
    }
    return nearest;
  }

  /** Cerca un punto iniziale libero sopra la città. */
  findSafeSpawn(playerRadius, spawnHeight) {
    const probe = new THREE.Sphere();
    const center = new THREE.Vector3();
    let best = null;
    let bestClearance = -Infinity;
    const spawnLimit = TERRAIN_SETTINGS.cityHalfSize - BUILDING_SETTINGS.safeSpawnMargin;

    for (let x = -spawnLimit; x <= spawnLimit; x += BUILDING_SETTINGS.safeSpawnStep) {
      for (let z = -spawnLimit; z <= spawnLimit; z += BUILDING_SETTINGS.safeSpawnStep) {
        const y = this.heightAt(x, z) + spawnHeight;
        center.set(x, y, z);
        probe.set(center, playerRadius);
        let blocked = false;
        for (const hitboxes of this.buildingHitboxes.values()) {
          if (hitboxes.some(hitbox => probe.intersectsBox(hitbox))) {
            blocked = true;
            break;
          }
        }
        const clearance = this.spawnClearance(x, z);
        if (!blocked && clearance > bestClearance) {
          bestClearance = clearance;
          best = { x, y, z };
        }
      }
    }
    return best || { x: 0, y: this.heightAt(0, 0) + spawnHeight, z: 0 };
  }

  /** Restituisce normale e profondità quando la sfera del drone tocca un palazzo. */
  findBuildingCollision(sphere, center) {
    for (const hitboxes of this.buildingHitboxes.values()) {
      for (const hitbox of hitboxes) {
        if (!sphere.intersectsBox(hitbox)) continue;
        this.closestPointScratch.set(
          THREE.MathUtils.clamp(center.x, hitbox.min.x, hitbox.max.x),
          THREE.MathUtils.clamp(center.y, hitbox.min.y, hitbox.max.y),
          THREE.MathUtils.clamp(center.z, hitbox.min.z, hitbox.max.z)
        );
        this.separationScratch.copy(center).sub(this.closestPointScratch);

        if (this.separationScratch.lengthSq() > 0.000001) {
          const distance = this.separationScratch.length();
          return {
            normal: this.separationScratch.clone().multiplyScalar(1 / distance),
            penetration: Math.max(0, sphere.radius - distance)
          };
        }

        const distances = [
          { axis: "x", distance: center.x - hitbox.min.x, sign: 1 },
          { axis: "x", distance: hitbox.max.x - center.x, sign: -1 },
          { axis: "y", distance: center.y - hitbox.min.y, sign: 1 },
          { axis: "y", distance: hitbox.max.y - center.y, sign: -1 },
          { axis: "z", distance: center.z - hitbox.min.z, sign: 1 },
          { axis: "z", distance: hitbox.max.z - center.z, sign: -1 }
        ];
        distances.sort((a, b) => a.distance - b.distance);
        const normal = new THREE.Vector3();
        normal[distances[0].axis] = distances[0].sign;
        return { normal, penetration: sphere.radius + distances[0].distance };
      }
    }
    return null;
  }

  /** Controlla se la hitbox di un laser interseca un edificio vicino. */
  projectileHitsBuilding(projectileHitbox, position) {
    const chunkX = Math.floor(position.x / TERRAIN_SETTINGS.chunkSize);
    const chunkZ = Math.floor(position.z / TERRAIN_SETTINGS.chunkSize);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const hitboxes = this.buildingHitboxes.get(this.chunkKey(chunkX + dx, chunkZ + dz));
        if (hitboxes?.some(hitbox => projectileHitbox.intersectsBox(hitbox))) return true;
      }
    }
    return false;
  }

  /** Mantiene il drone dentro il quadrato invisibile della mappa. */
  enforceWorldBoundary(position, bounceVelocity, playerRadius) {
    const limit = TERRAIN_SETTINGS.worldHalfSize - playerRadius;
    if (position.x < -limit) {
      position.x = -limit;
      bounceVelocity.x = Math.max(0, bounceVelocity.x);
    } else if (position.x > limit) {
      position.x = limit;
      bounceVelocity.x = Math.min(0, bounceVelocity.x);
    }
    if (position.z < -limit) {
      position.z = -limit;
      bounceVelocity.z = Math.max(0, bounceVelocity.z);
    } else if (position.z > limit) {
      position.z = limit;
      bounceVelocity.z = Math.min(0, bounceVelocity.z);
    }
  }
}
