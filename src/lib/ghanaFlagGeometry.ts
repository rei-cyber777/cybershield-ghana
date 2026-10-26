/**
 * Pure geographic & 3D geometry helpers for the 3D Map of Ghana
 * Threat Interception Network (`src/components/ThreatMap.tsx`).
 *
 * Uses real-world latitude (4.74°N to 11.17°N) and longitude (-3.26°W to +1.20°E)
 * coordinates projected into centered 3D scene coordinates.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ThreatArc3DSpec {
  id: string;
  vector: 'Mobile Money Fraud' | 'Scholarship Scams' | 'Phishing Links';
  originLabel: string;
  targetCity: string;
  hubName: string;
  sourcePos: Point3D;
  targetPos: Point3D;
  description: string;
  blockedAction: string;
  color: string;
}

export interface GhanaHub3DSpec {
  name: string;
  region: string;
  lat: number;
  lon: number;
  pos: Point3D;
  focusTip: string;
}

/**
 * Geographic bounding box center of Ghana:
 * Center Lat = 7.95°N, Center Lon = -1.03°W
 * Scale factor = 0.68 scene units per degree so the 3D Ghana Map spans ~4.4 units tall by ~3.1 units wide.
 */
export const GHANA_GEO_PROJECTION = {
  centerLat: 7.95,
  centerLon: -1.03,
  scale: 0.68,
  extrudeDepth: 0.36,
} as const;

/**
 * Projects real-world Ghana (lat, lon) in decimal degrees into centered (x, y) 3D scene coordinates.
 */
export function projectLatLonToScene(lat: number, lon: number): Point2D {
  const x = (lon - GHANA_GEO_PROJECTION.centerLon) * GHANA_GEO_PROJECTION.scale * 1.04;
  const y = (lat - GHANA_GEO_PROJECTION.centerLat) * GHANA_GEO_PROJECTION.scale;
  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
  };
}

/**
 * High-resolution sovereign border of Ghana in [lat, lon] decimal degrees
 * traced clockwise starting from the Northwest tri-point (Hamile ~11.0°N, 2.77°W).
 */
export const GHANA_BORDER_LAT_LON: ReadonlyArray<readonly [number, number]> = [
  // Northern Border (Upper West & Upper East along ~11°N, plus Bawku NE corner)
  [11.0, -2.77],
  [11.0, -2.15],
  [10.99, -1.5],
  [11.01, -1.05],
  [11.14, -0.75],
  [11.17, -0.14], // Bawku / Kulungugu NE peak
  [11.03, 0.02],
  // Eastern Border with Togo (North to South)
  [10.72, 0.08],
  [10.42, 0.34],
  [10.05, 0.38],
  [9.62, 0.45],
  [9.25, 0.58],
  [8.75, 0.62],
  [8.32, 0.56],
  [7.85, 0.61],
  [7.35, 0.58],
  [6.85, 0.62],
  [6.52, 0.72],
  [6.11, 1.19], // Aflao / Lomé SE coastal corner
  // Southern Atlantic Coastline (Gulf of Guinea, East to West down to Cape Three Points)
  [5.95, 1.02], // Keta Lagoon spit
  [5.78, 0.68], // Ada Foah / Volta Estuary
  [5.66, 0.01], // Tema
  [5.55, -0.2], // Accra
  [5.33, -0.62], // Winneba
  [5.11, -1.25], // Cape Coast
  [4.89, -1.76], // Sekondi-Takoradi
  [4.74, -2.08], // Cape Three Points (Southernmost tip of Ghana)
  [4.86, -2.24], // Axim
  [5.09, -3.11], // Half Assini / Newtown SW coastal corner
  // Western Border with Côte d'Ivoire (South to North)
  [5.45, -2.78],
  [5.92, -2.85],
  [6.22, -3.25], // Westernmost bulge near Debiso / Bia
  [6.68, -3.15],
  [7.15, -2.98],
  [7.65, -2.82],
  [8.22, -2.52], // Black Volta bend near Bui
  [8.68, -2.55],
  [9.25, -2.68],
  [9.85, -2.76],
  [10.45, -2.82],
];

/**
 * Internal regional boundary lines in [lat, lon] decimal degrees
 * to give the 3D Map of Ghana authentic regional subdivisions.
 */
export const GHANA_REGIONAL_DIVISIONS_LAT_LON: ReadonlyArray<
  ReadonlyArray<readonly [number, number]>
> = [
  // Upper West / Upper East / North East boundary (~10.2°N)
  [
    [10.22, -2.76],
    [10.15, -1.85],
    [10.35, -1.15],
    [10.42, 0.34],
  ],
  // Savannah / Northern / Bono East boundary (~8.4°N Black Volta & White Volta corridor)
  [
    [8.22, -2.52],
    [8.45, -1.72],
    [8.45, -0.95],
    [8.55, -0.15],
    [8.75, 0.62],
  ],
  // Bono / Ashanti / Eastern / Oti boundary (~7.1°N)
  [
    [7.15, -2.98],
    [7.28, -2.05],
    [7.12, -1.25],
    [6.95, 0.05],
    [7.35, 0.58],
  ],
  // Western / Central / Greater Accra / Volta southern belt (~5.8°N - 6.2°N)
  [
    [5.92, -2.85],
    [5.95, -1.85],
    [5.75, -1.12],
    [5.82, -0.35],
    [6.28, 0.06],
    [6.52, 0.72],
  ],
];

/**
 * Lake Volta contour in [lat, lon] decimal degrees (rendered as a glowing hydro-basin on top of the 3D Ghana Map).
 */
export const LAKE_VOLTA_LAT_LON: ReadonlyArray<readonly [number, number]> = [
  [8.45, -0.95], // Northern arm near Buipe
  [8.55, -0.15], // Yeji
  [8.82, 0.18], // Oti arm (Kete Krachi)
  [8.15, 0.25],
  [7.48, 0.18], // Kpando
  [6.95, 0.05],
  [6.28, 0.06], // Akosombo Dam southern tip
  [6.55, -0.35], // Afram arm
  [7.15, -0.18],
  [7.85, -0.22],
  [8.18, -0.65],
];

/**
 * Returns the projected 2D scene vertices of the real Ghana Map boundary.
 */
export function getGhanaBorderScenePoints(): Point2D[] {
  return GHANA_BORDER_LAT_LON.map(([lat, lon]) => projectLatLonToScene(lat, lon));
}

/**
 * Returns the projected 2D scene polylines of Ghana's internal regional divisions.
 */
export function getGhanaRegionalDivisionSceneLines(): Point2D[][] {
  return GHANA_REGIONAL_DIVISIONS_LAT_LON.map((line) =>
    line.map(([lat, lon]) => projectLatLonToScene(lat, lon))
  );
}

/**
 * Returns the projected 2D scene vertices of Lake Volta.
 */
export function getLakeVoltaScenePoints(): Point2D[] {
  return LAKE_VOLTA_LAT_LON.map(([lat, lon]) => projectLatLonToScene(lat, lon));
}

export interface SceneBoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Computes the exact 2D scene bounding box of Ghana's border polygon for normalized UV mapping.
 */
export function computeGhanaSceneBounds(): SceneBoundingBox {
  const pts = getGhanaBorderScenePoints();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: Math.max(maxX - minX, 0.001),
    height: Math.max(maxY - minY, 0.001),
  };
}

/**
 * Normalizes a 2D scene coordinate (x, y) into [0, 1] UV coordinates across the Ghana Map.
 */
export function normalizeScenePointToUV(
  x: number,
  y: number,
  bounds: SceneBoundingBox = computeGhanaSceneBounds()
): { u: number; v: number } {
  const u = Math.min(1, Math.max(0, (x - bounds.minX) / bounds.width));
  const v = Math.min(1, Math.max(0, (y - bounds.minY) / bounds.height));
  return {
    u: Number(u.toFixed(4)),
    v: Number(v.toFixed(4)),
  };
}

const RAW_HUBS: ReadonlyArray<{
  name: string;
  region: string;
  lat: number;
  lon: number;
  focusTip: string;
}> = [
  {
    name: 'Accra',
    region: 'Greater Accra',
    lat: 5.55,
    lon: -0.2,
    focusTip: 'High volume of Mobile Money reversal calls & bank SMS phishing links.',
  },
  {
    name: 'Kumasi',
    region: 'Ashanti',
    lat: 6.69,
    lon: -1.62,
    focusTip: 'Frequent campus scholarship advance-fee flyers & WhatsApp investment groups.',
  },
  {
    name: 'Tamale',
    region: 'Northern',
    lat: 9.4,
    lon: -0.84,
    focusTip: 'Lookalike domain SMS alerts & agricultural grant impersonation messages.',
  },
  {
    name: 'Takoradi',
    region: 'Western',
    lat: 4.89,
    lon: -1.76,
    focusTip: 'Fake oil/gas recruitment processing fees & USSD cash-out prompts.',
  },
  {
    name: 'Cape Coast',
    region: 'Central',
    lat: 5.11,
    lon: -1.25,
    focusTip: 'Student accommodation & tuition fee payment diversion scams.',
  },
  {
    name: 'Ho',
    region: 'Volta',
    lat: 6.61,
    lon: 0.47,
    focusTip: 'Cross-border merchant MoMo confirmation SMS spoofing.',
  },
  {
    name: 'Sunyani',
    region: 'Bono',
    lat: 7.34,
    lon: -2.33,
    focusTip: 'Social media "double your cash" crypto & forex Ponzi channels.',
  },
  {
    name: 'Wa',
    region: 'Upper West',
    lat: 10.06,
    lon: -2.5,
    focusTip: 'SIM registration lock threats & fake NGO recruitment forms.',
  },
];

export const GHANA_HUBS_3D: GhanaHub3DSpec[] = RAW_HUBS.map((h) => {
  const pt = projectLatLonToScene(h.lat, h.lon);
  return {
    ...h,
    pos: {
      x: pt.x,
      y: pt.y,
      z: GHANA_GEO_PROJECTION.extrudeDepth * 0.5 + 0.08,
    },
  };
});

function getHubTargetPos(cityName: string): Point3D {
  const found = GHANA_HUBS_3D.find((h) => h.name === cityName);
  if (found) {
    return { ...found.pos };
  }
  return { x: 0, y: 0, z: 0.25 };
}

export const ILLUSTRATIVE_ARCS_3D: ThreatArc3DSpec[] = [
  {
    id: 'arc-1',
    vector: 'Mobile Money Fraud',
    originLabel: 'Illustrative Scenario: Spoofed Personal SMS',
    targetCity: 'Accra Hub',
    hubName: 'Accra',
    sourcePos: { x: -2.75, y: 1.35, z: 0.85 },
    targetPos: getHubTargetPos('Accra'),
    description:
      'Illustrative scenario: Fake "Cash-In GHS 1,200" SMS followed by urgent wrong-transfer phone call.',
    blockedAction: 'Example defense: Verify true balance via official USSD before sending money.',
    color: '#FF1E8A',
  },
  {
    id: 'arc-2',
    vector: 'Scholarship Scams',
    originLabel: 'Illustrative Scenario: WhatsApp Flyer',
    targetCity: 'Kumasi Campus Node',
    hubName: 'Kumasi',
    sourcePos: { x: -2.7, y: -0.65, z: 0.8 },
    targetPos: getHubTargetPos('Kumasi'),
    description:
      'Illustrative scenario: Fake "Canada Visa & Stipend Slot" requesting GHS 450 medical fee via personal MoMo.',
    blockedAction:
      'Example defense: Cross-check on Opportunity Bridge & official university domain.',
    color: '#F5B700',
  },
  {
    id: 'arc-3',
    vector: 'Phishing Links',
    originLabel: 'Illustrative Scenario: Lookalike Domain (.top)',
    targetCity: 'Tamale Node',
    hubName: 'Tamale',
    sourcePos: { x: 2.7, y: 1.4, z: 0.85 },
    targetPos: getHubTargetPos('Tamale'),
    description:
      'Illustrative scenario: SMS threatening immediate SIM deactivation unless user enters PIN on clone page.',
    blockedAction:
      'Example defense: Flag non-.gov.gh domain and check the official reporting directory.',
    color: '#00F0FF',
  },
  {
    id: 'arc-4',
    vector: 'Mobile Money Fraud',
    originLabel: 'Illustrative Scenario: Fake Promotions Call',
    targetCity: 'Takoradi Node',
    hubName: 'Takoradi',
    sourcePos: { x: 2.65, y: -0.85, z: 0.8 },
    targetPos: getHubTargetPos('Takoradi'),
    description:
      'Illustrative scenario: Unexpected USSD cash-out prompt disguised as a "GHS 2,500 anniversary bonus".',
    blockedAction:
      'Example defense: Cancel USSD prompt — PIN is never needed to receive funds.',
    color: '#7C3AED',
  },
];
