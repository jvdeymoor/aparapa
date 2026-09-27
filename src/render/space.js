import * as THREE from '../../vendor/three.module.min.js';

export const FORMATION_DISTANCE = 5.8 * .7;
export const ZOOM_LIMITS = Object.freeze({ min: .7 / 1.7, max: 2.4 * 1.7, step: .2 * 1.7 });

// Reuse a fixed pool: no meshes or buffers accumulate during an endless flight.
export class SpaceBackdrop {
  constructor(scene, random = Math.random) {
    this.random = random;
    this.direction = new THREE.Vector3();
    this.positions = new Float32Array(480 * 3);
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions[i] = random() * 2 - 1;
      this.positions[i + 1] = random() * 2 - 1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xd5e7ff, size: 1, sizeAttenuation: false, depthWrite: false }));
    this.stars.frustumCulled = false;
    scene.add(this.stars);
    this.asteroids = [];
    this.rocks = new THREE.Group();
    this.rocks.name = 'procedural-asteroids';
    scene.add(this.rocks);
    const materials = [0x514d56, 0x70615b, 0x444b5c].map(color => new THREE.MeshStandardMaterial({ color, roughness: .96, flatShading: true }));
    const shapes = Array.from({ length: 5 }, (_, index) => {
      const shape = new THREE.IcosahedronGeometry(1, 1);
      const vertices = shape.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
        const radius = 1 + .18 * Math.sin(x * 7 + y * 11 + z * 5 + index * 2);
        vertices.setXYZ(i, x * radius, y * radius, z * radius);
      }
      shape.computeVertexNormals();
      return shape;
    });
    for (let i = 0; i < 22; i++) {
      const mesh = new THREE.Mesh(shapes[i % shapes.length], materials[i % materials.length]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.position.set((random() - .5) * 40, -3 - random() * 3, (random() - .5) * 26);
      mesh.scale.set(1.6 + random() * 1.5, .65 + random() * .4, 1.4 + random() * 1.5);
      mesh.rotation.set(random() * .3, random() * Math.PI * 2, random() * .3);
      const angle = random() * Math.PI * 2, speed = .1 + random() * .22;
      this.asteroids.push({ mesh, vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed, spin: (random() - .5) * .06 });
      this.rocks.add(mesh);
    }
    // Start with shadow-catching rocks directly below both formations.
    this.asteroids[0].mesh.position.set(-FORMATION_DISTANCE, -2.4, 0);
    this.asteroids[1].mesh.position.set(FORMATION_DISTANCE, -2.4, 0);
  }
  update(dt, camera) {
    for (let i = 0; i < this.positions.length; i += 3) {
      this.positions[i] -= dt * .009;
      this.positions[i + 1] -= dt * .004;
      if (this.positions[i] < -1) this.positions[i] += 2;
      if (this.positions[i + 1] < -1) this.positions[i + 1] += 2;
    }
    this.stars.geometry.attributes.position.needsUpdate = true;
    camera.getWorldDirection(this.direction);
    this.stars.position.copy(camera.position).addScaledVector(this.direction, 40);
    this.stars.quaternion.copy(camera.quaternion);
    this.stars.scale.set((camera.right - camera.left) / (2 * camera.zoom), (camera.top - camera.bottom) / (2 * camera.zoom), 1);
    for (const rock of this.asteroids) {
      rock.mesh.position.x += rock.vx * dt;
      rock.mesh.position.z += rock.vz * dt;
      rock.mesh.rotation.y += rock.spin * dt;
      if (rock.mesh.position.x > 24) rock.mesh.position.x = -24;
      if (rock.mesh.position.x < -24) rock.mesh.position.x = 24;
      if (rock.mesh.position.z > 17) rock.mesh.position.z = -17;
      if (rock.mesh.position.z < -17) rock.mesh.position.z = 17;
    }
  }
}
