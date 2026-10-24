import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLOBE_CONTINENT_PRESETS,
  WORLD_CONTINENT_POLYGONS,
  GLOBAL_CYBER_RELAY_NODES,
  latLonToGlobePoint,
  lonLatToEquirectangularXY,
} from './worldGlobeTexture';

test('maps Prime Meridian and Equator (0°N, 0°E) to +Z facing the camera', () => {
  const origin = latLonToGlobePoint(0, 0, 1.35);
  assert.equal(origin.x, 0);
  assert.equal(origin.y, 0);
  assert.equal(origin.z, 1.35);

  // Ghana (5.55°N, -0.20°W) sits just north of the Equator facing +Z
  const ghana = latLonToGlobePoint(5.55, -0.2, 1.35);
  assert.ok(ghana.y > 0.12);
  assert.ok(ghana.z > 1.33);
});

test('converts (lon, lat) to equirectangular canvas pixels accurately', () => {
  const center = lonLatToEquirectangularXY(0, 0, 2048, 1024);
  assert.equal(center.x, 1024);
  assert.equal(center.y, 512);
});

test('defines all major world continents, camera presets, and global cyber relay nodes including Accra (Ghana)', () => {
  assert.ok(WORLD_CONTINENT_POLYGONS.length >= 10);
  const africa = WORLD_CONTINENT_POLYGONS.find((c) => c.id === 'africa');
  assert.ok(africa && africa.lonLatPoints.length >= 25);
  assert.equal(GLOBE_CONTINENT_PRESETS.length, 6);
  assert.ok(GLOBAL_CYBER_RELAY_NODES.some((n) => n.isGhana && n.name.includes('Ghana')));
});
