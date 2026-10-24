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
  extrudeDepth: 0.34,
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
 * Returns the projected 2D scene vertices of Lake Volta.
 */
export function getLakeVoltaScenePoints(): Point2D[] {
  return LAKE_VOLTA_LAT_LON.map(([lat, lon]) => projectLatLonToScene(lat, lon));
}

const RAW_HUBS: ReadonlyArray<{ name: string; region: string; lat: number; lon: number }> = [
  { name: 'Tamale', region: 'Northern', lat: 9.4, lon: -0.84 },
  { name: 'Wa', region: 'Upper West', lat: 10.06, lon: -2.5 },
  { name: 'Sunyani', region: 'Bono', lat: 7.34, lon: -2.33 },
  { name: 'Kumasi', region: 'Ashanti', lat: 6.69, lon: -1.62 },
  { name: 'Ho', region: 'Volta', lat: 6.61, lon: 0.47 },
  { name: 'Accra', region: 'Greater Accra', lat: 5.55, lon: -0.2 },
  { name: 'Cape Coast', region: 'Central', lat: 5.11, lon: -1.25 },
  { name: 'Takoradi', region: 'Western', lat: 4.89, lon: -1.76 },
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
    originLabel: 'Spoofed Personal SMS (+233 24 XXX)',
    targetCity: 'Accra Hub',
    sourcePos: { x: -3.1, y: 1.45, z: 0.85 },
    targetPos: getHubTargetPos('Accra'),
    description: 'Fake "Cash-In GHS 1,200" SMS followed by urgent wrong-transfer phone call.',
    blockedAction: 'Blocked: Verified true balance via official USSD before sending money.',
    color: '#FF1E8A',
  },
  {
    id: 'arc-2',
    vector: 'Scholarship Scams',
    originLabel: 'WhatsApp Flyer Ring',
    targetCity: 'Kumasi Campus Node',
    sourcePos: { x: -3.05, y: -0.75, z: 0.8 },
    targetPos: getHubTargetPos('Kumasi'),
    description:
      'Fake "Canada Visa & Stipend Slot" requesting GHS 450 medical fee via personal MoMo.',
    blockedAction: 'Blocked: Cross-checked on Opportunity Bridge & official university domain.',
    color: '#F5B700',
  },
  {
    id: 'arc-3',
    vector: 'Phishing Links',
    originLabel: 'Lookalike Domain (.top)',
    targetCity: 'Tamale Node',
    sourcePos: { x: 3.05, y: 1.5, z: 0.85 },
    targetPos: getHubTargetPos('Tamale'),
    description:
      'SMS threatening immediate SIM deactivation unless user enters PIN on clone page.',
    blockedAction: 'Blocked: Flagged non-.gov.gh domain and reported to CSA Ghana directory.',
    color: '#00F0FF',
  },
  {
    id: 'arc-4',
    vector: 'Mobile Money Fraud',
    originLabel: 'Fake Promotions Desk Call',
    targetCity: 'Takoradi Node',
    sourcePos: { x: 2.95, y: -0.95, z: 0.8 },
    targetPos: getHubTargetPos('Takoradi'),
    description:
      'Unexpected USSD cash-out prompt disguised as a "GHS 2,500 anniversary bonus".',
    blockedAction: 'Blocked: Cancelled USSD prompt — PIN is never needed to receive funds.',
    color: '#7C3AED',
  },
];
