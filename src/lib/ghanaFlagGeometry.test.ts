import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GHANA_HUBS_3D,
  ILLUSTRATIVE_ARCS_3D,
  computeGhanaSceneBounds,
  getGhanaBorderScenePoints,
  getGhanaRegionalDivisionSceneLines,
  getLakeVoltaScenePoints,
  normalizeScenePointToUV,
} from './ghanaFlagGeometry';
import {
  GLOBE_CONTINENT_PRESETS,
  WORLD_CONTINENT_POLYGONS,
  latLonToGlobePoint,
  lonLatToEquirectangularXY,
} from './worldGlobeTexture';

test('projects Ghana sovereign border and Lake Volta into centered 3D scene coordinates', () => {
  const borderPts = getGhanaBorderScenePoints();
  const voltaPts = getLakeVoltaScenePoints();
  const regionalLines = getGhanaRegionalDivisionSceneLines();

  assert.ok(borderPts.length >= 35, 'Ghana border should have at least 35 high-res vertices');
  assert.ok(voltaPts.length >= 10, 'Lake Volta should have at least 10 contour vertices');
  assert.equal(regionalLines.length, 4, 'Should include 4 internal regional division lines');

  const bounds = computeGhanaSceneBounds();
  assert.ok(bounds.width > 2.5 && bounds.width < 4.0);
  assert.ok(bounds.height > 4.0 && bounds.height < 5.0);
});

test('normalizes Ghana 2D scene points into [0, 1] UV coordinates', () => {
  const bounds = computeGhanaSceneBounds();
  const minUv = normalizeScenePointToUV(bounds.minX, bounds.minY, bounds);
  const maxUv = normalizeScenePointToUV(bounds.maxX, bounds.maxY, bounds);
  const midUv = normalizeScenePointToUV(
    (bounds.minX + bounds.maxX) / 2,
    (bounds.minY + bounds.maxY) / 2,
    bounds
  );

  assert.deepEqual(minUv, { u: 0, v: 0 });
  assert.deepEqual(maxUv, { u: 1, v: 1 });
  assert.ok(midUv.u > 0.45 && midUv.u < 0.55);
  assert.ok(midUv.v > 0.45 && midUv.v < 0.55);
});

test('provides 8 Ghana 3D regional hubs and 4 3D threat arcs linked to valid hub coordinates', () => {
  assert.equal(GHANA_HUBS_3D.length, 8);
  assert.equal(ILLUSTRATIVE_ARCS_3D.length, 4);

  for (const arc of ILLUSTRATIVE_ARCS_3D) {
    const matchingHub = GHANA_HUBS_3D.find((h) => h.name === arc.hubName);
    assert.ok(matchingHub, `Arc ${arc.id} should reference a valid Ghana hub (${arc.hubName})`);
    assert.deepEqual(arc.targetPos, matchingHub.pos);
  }
});

test('projects 3D World Globe continent coordinates accurately around the Prime Meridian', () => {
  assert.ok(WORLD_CONTINENT_POLYGONS.length >= 9);
  assert.equal(GLOBE_CONTINENT_PRESETS.length, 6);

  // At (lat=0, lon=0), point should sit on +Z at (0, 0, radius)
  const originPt = latLonToGlobePoint(0, 0, 1.44);
  assert.equal(originPt.x, 0);
  assert.equal(originPt.y, 0);
  assert.equal(originPt.z, 1.44);

  const px = lonLatToEquirectangularXY(0, 0, 512, 256);
  assert.deepEqual(px, { x: 256, y: 128 });
});
