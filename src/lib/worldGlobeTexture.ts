/**
 * Pure geographic & procedural texture helpers for the 3D World Globe
 * in `src/components/Hero3D.tsx`.
 *
 * Equirectangular UV mapping convention for `THREE.SphereGeometry`:
 * - u = (lon + 180) / 360   (0 at -180°W, 0.5 at 0° Prime Meridian / Ghana, 1 at +180°E)
 * - v = (90 - lat) / 180    (0 at +90°N North Pole, 0.5 at 0° Equator, 1 at -90°S South Pole)
 */

export interface GlobeVec3 {
  x: number;
  y: number;
  z: number;
}

export interface ContinentPolygonSpec {
  id: string;
  name: string;
  labelLonLat?: readonly [number, number];
  fillColor: string;
  emissiveColor: string;
  outlineHex: number;
  /** Array of [lon, lat] pairs in decimal degrees (-180..180, -90..90) */
  lonLatPoints: ReadonlyArray<readonly [number, number]>;
}

/**
 * Converts (lat, lon) in decimal degrees into a 3D point on a sphere of `radius`
 * aligned with Three.js SphereGeometry UV mapping (rotated by -Math.PI/2 on Y so
 * lon = 0° Prime Meridian faces +Z toward the camera).
 */
export function latLonToGlobePoint(
  latDeg: number,
  lonDeg: number,
  radius: number
): GlobeVec3 {
  const latRad = (latDeg * Math.PI) / 180;
  const lonRad = (lonDeg * Math.PI) / 180;

  // When SphereGeometry is rotated by -Math.PI/2 around Y, (lat=0, lon=0) sits at (0, 0, radius)
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);

  return {
    x: Number(x.toFixed(4)),
    y: Number(y.toFixed(4)),
    z: Number(z.toFixed(4)),
  };
}

/**
 * Converts (lon, lat) in degrees to pixel coordinates (px, py) on an equirectangular canvas.
 */
export function lonLatToEquirectangularXY(
  lonDeg: number,
  latDeg: number,
  width: number,
  height: number
): { x: number; y: number } {
  const u = (lonDeg + 180) / 360;
  const v = (90 - latDeg) / 180;
  return {
    x: Number((u * width).toFixed(2)),
    y: Number((v * height).toFixed(2)),
  };
}

/**
 * High-contrast continent polygons in [lon, lat] degrees for rendering both
 * 2D equirectangular continent maps AND 3D raised spherical coastline outlines on the globe.
 */
export const WORLD_CONTINENT_POLYGONS: ReadonlyArray<ContinentPolygonSpec> = [
  {
    id: 'africa',
    name: 'AFRICA',
    labelLonLat: [18.0, 6.0],
    fillColor: '#174882',
    emissiveColor: '#0d315c',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-17.5, 14.7], // Dakar / Cap-Vert
      [-16.0, 19.5], // Mauritania
      [-13.2, 27.9], // Western Sahara
      [-9.8, 31.5], // Morocco Coast
      [-5.8, 35.8], // Tangier / Gibraltar
      [3.0, 36.8], // Algiers
      [10.2, 37.2], // Tunis
      [15.0, 32.4], // Tripoli / Sidra
      [20.1, 32.1], // Benghazi
      [29.9, 31.2], // Alexandria
      [32.5, 31.2], // Suez
      [35.5, 24.0], // Red Sea Egypt
      [39.2, 21.5], // Red Sea
      [43.4, 12.6], // Djibouti / Bab-el-Mandeb
      [48.5, 11.2], // Gulf of Aden
      [51.4, 11.9], // Cape Guardafui (Horn of Africa)
      [45.3, 2.0], // Mogadishu
      [40.8, -2.5], // Lamu / Kenya
      [39.3, -6.8], // Dar es Salaam
      [40.6, -14.5], // Northern Mozambique
      [35.0, -19.8], // Beira
      [32.6, -26.0], // Maputo
      [31.0, -29.8], // Durban
      [25.6, -34.0], // Port Elizabeth
      [18.4, -34.4], // Cape of Good Hope
      [15.1, -26.6], // Luderitz / Namibia
      [14.5, -22.9], // Walvis Bay
      [11.8, -15.2], // Southern Angola
      [13.2, -8.8], // Luanda
      [12.2, -5.8], // Congo Mouth
      [9.4, 0.4], // Libreville / Gabon
      [9.7, 4.0], // Douala / Cameroon
      [7.1, 4.4], // Niger Delta
      [3.4, 6.4], // Lagos
      [1.2, 6.1], // Lome
      [-0.2, 5.55], // Accra (Ghana)
      [-2.08, 4.74], // Cape Three Points (Ghana)
      [-4.0, 5.3], // Abidjan
      [-7.7, 4.4], // Cape Palmas
      [-10.8, 6.3], // Monrovia
      [-13.2, 8.5], // Freetown
      [-15.6, 11.8], // Bissau
    ],
  },
  {
    id: 'madagascar',
    name: 'MADAGASCAR',
    fillColor: '#153d70',
    emissiveColor: '#092342',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [49.3, -12.0],
      [50.4, -15.3],
      [49.5, -19.0],
      [47.0, -25.0],
      [44.0, -24.8],
      [43.3, -21.0],
      [44.3, -16.0],
      [47.5, -13.5],
    ],
  },
  {
    id: 'europe',
    name: 'EUROPE',
    labelLonLat: [16.0, 50.0],
    fillColor: '#143c6e',
    emissiveColor: '#0a2547',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-9.5, 37.0], // Cape St. Vincent (Portugal)
      [-9.2, 43.0], // Galicia
      [-1.8, 43.4], // Bay of Biscay
      [-4.5, 48.4], // Brittany
      [1.8, 51.0], // Calais
      [4.5, 52.5], // Netherlands
      [8.5, 54.5], // Denmark
      [10.5, 57.7], // Skagen
      [12.5, 56.0],
      [5.3, 60.4], // Bergen (Norway)
      [10.4, 63.4], // Trondheim
      [18.9, 69.6], // Tromso
      [28.0, 71.0], // North Cape
      [40.5, 64.5], // White Sea
      [60.0, 68.0], // Northern Urals
      [58.0, 52.0], // Southern Urals
      [48.0, 46.5], // Caspian North
      [39.0, 45.0], // Sea of Azov
      [33.5, 44.5], // Crimea
      [29.0, 41.0], // Istanbul / Bosphorus
      [23.7, 38.0], // Athens / Greece
      [20.0, 39.5], // Ionian Coast
      [13.8, 45.6], // Trieste / Adriatic
      [18.4, 40.1], // Heel of Italy
      [15.6, 38.1], // Toe of Italy
      [12.5, 41.9], // Rome
      [8.9, 44.4], // Genoa
      [5.4, 43.3], // Marseille
      [2.2, 41.4], // Barcelona
      [-0.4, 39.5], // Valencia
      [-5.4, 36.0], // Gibraltar
    ],
  },
  {
    id: 'uk_ireland',
    name: 'UK',
    fillColor: '#153d70',
    emissiveColor: '#0a2547',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-5.5, 50.1],
      [1.4, 51.3],
      [0.1, 53.5],
      [-3.2, 56.0],
      [-5.0, 58.6],
      [-6.2, 56.5],
      [-4.5, 54.0],
      [-5.2, 51.8],
    ],
  },
  {
    id: 'asia',
    name: 'ASIA',
    labelLonLat: [88.0, 42.0],
    fillColor: '#123663',
    emissiveColor: '#082040',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [26.2, 40.0], // Western Turkey
      [36.0, 36.8], // Iskenderun
      [34.5, 31.5], // Levant
      [35.0, 29.5], // Aqaba
      [39.0, 21.5], // Red Sea East
      [43.5, 12.8], // Bab-el-Mandeb East
      [52.2, 16.5], // Yemen / Oman
      [59.8, 22.5], // Ras al Hadd (Oman)
      [56.2, 26.2], // Strait of Hormuz
      [48.5, 29.9], // Kuwait
      [56.5, 27.0], // Southern Iran
      [67.0, 24.8], // Karachi
      [72.8, 19.0], // Mumbai
      [77.5, 8.1], // Kanyakumari (South Tip of India)
      [80.3, 13.1], // Chennai
      [88.4, 22.0], // Kolkata / Bay of Bengal
      [92.0, 21.4], // Chittagong
      [96.2, 16.8], // Yangon
      [98.3, 8.0], // Phuket
      [103.8, 1.3], // Singapore (Malay Peninsula Tip)
      [101.5, 12.6], // Gulf of Thailand
      [106.7, 10.8], // Ho Chi Minh
      [108.2, 16.0], // Da Nang
      [109.5, 20.0], // Hainan
      [114.2, 22.3], // Hong Kong
      [121.5, 31.2], // Shanghai
      [119.5, 38.9], // Bohai
      [126.6, 37.5], // Korean Peninsula
      [129.0, 35.1], // Busan
      [131.9, 43.1], // Vladivostok
      [140.5, 51.0], // Tartary Strait
      [156.6, 51.0], // Kamchatka Tip
      [163.0, 56.0],
      [170.0, 66.0], // Chukotka / Bering Strait
      [140.0, 72.0], // Laptev Sea
      [104.0, 77.7], // Cape Chelyuskin (Arctic Siberia)
      [70.0, 72.5], // Yamal
      [60.0, 68.0], // Urals North
      [58.0, 52.0], // Urals South
      [48.0, 46.5],
      [41.5, 41.6], // Batumi / Black Sea East
      [35.0, 42.0], // Sinop
    ],
  },
  {
    id: 'japan',
    name: 'JAPAN',
    fillColor: '#153d70',
    emissiveColor: '#092342',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [130.5, 31.5],
      [135.5, 34.5],
      [139.8, 35.7],
      [141.5, 41.0],
      [144.5, 43.3],
      [141.6, 45.4],
      [139.5, 40.0],
      [136.5, 36.5],
      [131.0, 34.0],
    ],
  },
  {
    id: 'north_america',
    name: 'NORTH AMERICA',
    labelLonLat: [-100.0, 42.0],
    fillColor: '#143c6e',
    emissiveColor: '#0a2547',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-166.0, 65.0], // Seward Peninsula (Alaska)
      [-156.5, 71.3], // Point Barrow
      [-130.0, 70.0], // Mackenzie Delta
      [-95.0, 70.0], // Arctic Canada
      [-82.0, 63.0], // Hudson Bay Entrance
      [-64.0, 60.0], // Northern Labrador
      [-55.6, 52.0], // Labrador Coast
      [-53.0, 47.5], // Newfoundland
      [-63.6, 44.6], // Nova Scotia (Halifax)
      [-70.0, 41.7], // Cape Cod
      [-74.0, 40.7], // New York
      [-75.5, 35.2], // Cape Hatteras
      [-80.2, 25.8], // Miami (Florida Tip)
      [-82.5, 27.9], // Tampa
      [-89.2, 29.2], // Mississippi Delta
      [-97.1, 26.0], // Rio Grande
      [-96.1, 19.2], // Veracruz
      [-90.5, 19.8], // Campeche
      [-86.8, 21.2], // Cancun (Yucatan)
      [-83.5, 15.0], // Honduras / Nicaragua
      [-79.5, 9.0], // Panama Isthmus
      [-85.5, 10.5], // Costa Rica Pacific
      [-92.2, 14.5], // Guatemala
      [-99.9, 16.8], // Acapulco
      [-105.5, 20.5], // Puerto Vallarta
      [-110.0, 23.0], // Baja Tip
      [-117.2, 32.7], // San Diego
      [-122.4, 37.8], // San Francisco
      [-124.7, 48.4], // Cape Flattery (Washington)
      [-135.0, 57.0], // SE Alaska
      [-150.0, 60.0], // Anchorage
      [-162.0, 55.0], // Alaska Peninsula
    ],
  },
  {
    id: 'greenland',
    name: 'GREENLAND',
    fillColor: '#133866',
    emissiveColor: '#082040',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-44.0, 60.0], // Cape Farewell
      [-22.0, 70.0],
      [-18.0, 78.0],
      [-32.0, 83.0],
      [-60.0, 81.0],
      [-70.0, 76.5],
      [-53.0, 68.0],
      [-51.0, 64.0],
    ],
  },
  {
    id: 'south_america',
    name: 'SOUTH AMERICA',
    labelLonLat: [-58.0, -16.0],
    fillColor: '#153f73',
    emissiveColor: '#0b274b',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-79.5, 9.0], // Panama / Colombia
      [-75.5, 10.4], // Cartagena
      [-71.6, 12.2], // Guajira
      [-66.9, 10.6], // Caracas / La Guaira
      [-61.0, 10.0], // Orinoco Delta
      [-52.3, 4.9], // Cayenne
      [-48.5, -1.4], // Belem / Amazon Mouth
      [-38.5, -3.7], // Fortaleza
      [-34.8, -7.1], // Joao Pessoa / Recife (Easternmost Brazil)
      [-38.5, -13.0], // Salvador
      [-40.3, -20.3], // Vitoria
      [-43.2, -22.9], // Rio de Janeiro
      [-48.5, -27.6], // Florianopolis
      [-53.5, -33.7], // Chuy / Uruguay
      [-58.4, -34.6], // Rio de la Plata (Buenos Aires)
      [-62.0, -39.0], // Bahia Blanca
      [-65.0, -43.3], // Peninsula Valdes
      [-67.5, -49.3], // San Julian
      [-68.0, -54.8], // Cape Horn / Tierra del Fuego
      [-74.5, -52.8], // Strait of Magellan West
      [-73.5, -45.0], // Chilean Fjords
      [-73.1, -36.8], // Concepcion
      [-71.6, -33.0], // Valparaiso
      [-70.4, -23.6], // Antofagasta
      [-70.1, -18.5], // Arica (Bend of South America)
      [-77.0, -12.0], // Lima / Callao
      [-81.3, -4.7], // Talara (Westernmost Peru)
      [-79.9, -2.2], // Guayaquil
      [-80.8, 0.9], // Manta (Ecuador)
      [-77.5, 5.5], // Pacific Colombia
    ],
  },
  {
    id: 'australia',
    name: 'AUSTRALIA',
    labelLonLat: [134.0, -25.0],
    fillColor: '#143c6e',
    emissiveColor: '#0a2547',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [114.1, -21.8], // North West Cape
      [122.2, -18.0], // Broome
      [130.8, -12.4], // Darwin
      [136.8, -12.2], // Arnhem Land
      [139.5, -17.5], // Gulf of Carpentaria
      [142.5, -10.7], // Cape York
      [145.8, -16.9], // Cairns
      [153.1, -27.5], // Brisbane
      [151.2, -33.8], // Sydney
      [149.9, -37.5], // Cape Howe
      [145.0, -37.8], // Melbourne
      [138.6, -34.9], // Adelaide
      [130.0, -31.5], // Great Australian Bight
      [121.9, -33.9], // Esperance
      [115.1, -34.3], // Cape Leeuwin
      [115.8, -32.0], // Perth
      [113.5, -25.5], // Shark Bay
    ],
  },
  {
    id: 'antarctica',
    name: 'ANTARCTICA',
    labelLonLat: [15.0, -78.0],
    fillColor: '#0f2d52',
    emissiveColor: '#061830',
    outlineHex: 0x00f0ff,
    lonLatPoints: [
      [-175.0, -76.0],
      [-135.0, -74.0],
      [-95.0, -72.0],
      [-60.0, -64.0], // Antarctic Peninsula
      [-35.0, -75.0],
      [0.0, -70.0],
      [45.0, -67.0],
      [90.0, -66.5],
      [135.0, -66.5],
      [170.0, -72.0],
      [175.0, -83.0],
      [0.0, -84.0],
      [-175.0, -83.0],
    ],
  },
];

/**
 * Sovereign Ghana polygon in [lon, lat] degrees so it can be highlighted in radiant Gold on the globe.
 */
export const GHANA_GLOBE_HIGHLIGHT_LON_LAT: ReadonlyArray<readonly [number, number]> = [
  [-2.77, 11.0],
  [-0.14, 11.17],
  [0.62, 8.75],
  [1.19, 6.11],
  [-0.2, 5.55],
  [-2.08, 4.74],
  [-3.11, 5.09],
  [-3.25, 6.22],
  [-2.68, 9.25],
];

/**
 * Major world cyber-telemetry relay cities shown as glowing surface nodes on the 3D World Globe.
 */
export const GLOBAL_CYBER_RELAY_NODES: ReadonlyArray<{
  name: string;
  lat: number;
  lon: number;
  isGhana: boolean;
}> = [
  { name: 'Accra (Ghana)', lat: 5.55, lon: -0.2, isGhana: true },
  { name: 'London (Europe)', lat: 51.5, lon: -0.12, isGhana: false },
  { name: 'New York (N. America)', lat: 40.71, lon: -74.0, isGhana: false },
  { name: 'Nairobi (E. Africa)', lat: -1.29, lon: 36.82, isGhana: false },
  { name: 'Johannesburg (S. Africa)', lat: -26.2, lon: 28.04, isGhana: false },
  { name: 'São Paulo (S. America)', lat: -23.55, lon: -46.63, isGhana: false },
  { name: 'Singapore (Asia)', lat: 1.35, lon: 103.82, isGhana: false },
  { name: 'Sydney (Australia)', lat: -33.86, lon: 151.2, isGhana: false },
];

export interface GlobeContinentViewPreset {
  id: string;
  label: string;
  /** Target Y rotation in radians so this continent faces the camera */
  targetRotY: number;
  /** Target X tilt in radians */
  targetRotX: number;
}

export const GLOBE_CONTINENT_PRESETS: ReadonlyArray<GlobeContinentViewPreset> = [
  { id: 'auto', label: '360° World Orbit', targetRotY: 0, targetRotX: 0.14 },
  { id: 'africa', label: 'Africa & Ghana', targetRotY: -0.18, targetRotX: 0.12 },
  { id: 'europe', label: 'Europe', targetRotY: -0.22, targetRotX: 0.58 },
  { id: 'americas', label: 'Americas', targetRotY: 1.35, targetRotX: 0.15 },
  { id: 'asia', label: 'Asia', targetRotY: -1.55, targetRotX: 0.35 },
  { id: 'australia', label: 'Australia', targetRotY: -2.35, targetRotX: -0.38 },
];
