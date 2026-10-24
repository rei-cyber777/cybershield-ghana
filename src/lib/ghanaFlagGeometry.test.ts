import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GHANA_BORDER_LAT_LON,
  GHANA_HUBS_3D,
  ILLUSTRATIVE_ARCS_3D,
  getGhanaBorderScenePoints,
  getLakeVoltaScenePoints,
  projectLatLonToScene,
} from './ghanaFlagGeometry';

test('projects real Ghana border coordinates from Cape Three Points (South) to Bawku (North)', () => {
  assert.ok(GHANA_BORDER_LAT_LON.length >= 30);
  const borderPts = getGhanaBorderScenePoints();
  assert.equal(borderPts.length, GHANA_BORDER_LAT_LON.length);

  // Bawku (11.17°N) should have higher Y than Cape Three Points (4.74°N)
  const bawku = projectLatLonToScene(11.17, -0.14);
  const capeThreePoints = projectLatLonToScene(4.74, -2.08);
  assert.ok(bawku.y > 1.8);
  assert.ok(capeThreePoints.y < -1.8);
});

test('includes Lake Volta contour and 8 accurate Ghana regional hub coordinates', () => {
  const voltaPts = getLakeVoltaScenePoints();
  assert.ok(voltaPts.length >= 10);
  assert.equal(GHANA_HUBS_3D.length, 8);

  const accra = GHANA_HUBS_3D.find((h) => h.name === 'Accra');
  const tamale = GHANA_HUBS_3D.find((h) => h.name === 'Tamale');
  assert.ok(accra && tamale);
  assert.ok(tamale.pos.y > accra.pos.y, 'Tamale is north of Accra on the 3D Ghana Map');
});

test('connects all 4 threat interception arcs to real Ghana city targets on the 3D map', () => {
  assert.equal(ILLUSTRATIVE_ARCS_3D.length, 4);
  for (const arc of ILLUSTRATIVE_ARCS_3D) {
    assert.ok(arc.targetPos.z > 0);
  }
});
