import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShieldAlert, Pause, Play, MapPin, RotateCcw, ZoomIn, ZoomOut, Compass } from 'lucide-react';
import {
  GHANA_GEO_PROJECTION,
  GHANA_HUBS_3D,
  GhanaHub3DSpec,
  ILLUSTRATIVE_ARCS_3D,
  computeGhanaSceneBounds,
  getGhanaBorderScenePoints,
  getGhanaRegionalDivisionSceneLines,
  getLakeVoltaScenePoints,
  normalizeScenePointToUV,
} from '../lib/ghanaFlagGeometry';

type CameraViewPreset = 'isometric' | 'topdown' | 'south' | 'north';

const CAMERA_PRESETS: Record<
  CameraViewPreset,
  { label: string; rotX: number; rotZ: number; zoom: number; panY: number }
> = {
  isometric: { label: '3D Isometric', rotX: -0.42, rotZ: 0.14, zoom: 7.4, panY: 0.22 },
  topdown: { label: 'Top-Down 3D', rotX: -0.04, rotZ: 0.0, zoom: 7.7, panY: 0.12 },
  south: { label: 'Southern Coast', rotX: -0.52, rotZ: -0.12, zoom: 6.2, panY: 0.85 },
  north: { label: 'Northern Belt', rotX: -0.45, rotZ: 0.18, zoom: 6.4, panY: -0.55 },
};

let cachedIsSoftwareGl: boolean | null = null;
function detectSoftwareWebGL(): boolean {
  if (cachedIsSoftwareGl !== null) return cachedIsSoftwareGl;
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) {
      cachedIsSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedIsSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedIsSoftwareGl;
  } catch {
    cachedIsSoftwareGl = true;
    return true;
  }
}

/**
 * Generates a bright, high-contrast 512x512 procedural topographic texture for the 3D Map of Ghana
 * so the extruded map surface is vividly visible against the dark cyber background.
 */
function buildGhanaTopographicTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const SIZE = 512;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Rich sapphire-to-cyan topographic base gradient
    const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bgGrad.addColorStop(0, '#184385');
    bgGrad.addColorStop(0.5, '#1f56a8');
    bgGrad.addColorStop(1, '#13376e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Topographic elevation contour rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.5;
    for (let r = 40; r < SIZE; r += 48) {
      ctx.beginPath();
      ctx.ellipse(SIZE * 0.48, SIZE * 0.52, r * 0.85, r, 0.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fine coordinate grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= SIZE; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(SIZE, i);
      ctx.stroke();
    }

    // Major latitude / longitude meridian highlights
    ctx.strokeStyle = 'rgba(245, 183, 0, 0.42)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(SIZE * 0.68, 0);
    ctx.lineTo(SIZE * 0.68, SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, SIZE * 0.5);
    ctx.lineTo(SIZE, SIZE * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Static 3D-Perspective SVG Map of Ghana Fallback
 * Used if WebGL is unavailable in the browser.
 */
const Static3DGhanaMapFallback: React.FC<{
  selectedArcId: string;
  selectedHubName: string;
  onSelectArc: (id: string) => void;
  onSelectHub: (name: string) => void;
}> = ({ selectedArcId, selectedHubName, onSelectArc, onSelectHub }) => {
  const borderPts = getGhanaBorderScenePoints();
  const voltaPts = getLakeVoltaScenePoints();
  const regionalLines = getGhanaRegionalDivisionSceneLines();

  const toSvg = (x: number, y: number) => ({
    sx: Math.round(410 + x * 78),
    sy: Math.round(210 - y * 72),
  });

  const polygonPoints = borderPts
    .map((p) => {
      const { sx, sy } = toSvg(p.x, p.y);
      return `${sx},${sy}`;
    })
    .join(' ');

  const depthPolygonPoints = borderPts
    .map((p) => {
      const { sx, sy } = toSvg(p.x, p.y);
      return `${sx + 10},${sy + 14}`;
    })
    .join(' ');

  const voltaPolygonPoints = voltaPts
    .map((p) => {
      const { sx, sy } = toSvg(p.x, p.y);
      return `${sx},${sy}`;
    })
    .join(' ');

  return (
    <svg
      viewBox="0 0 820 420"
      className="h-auto w-full"
      role="img"
      aria-label="3D geographic map of Ghana showing Lake Volta, regional defense hubs, and simulated threat interception arcs"
    >
      <rect width="820" height="420" fill="#03050c" />
      {/* 3D Extruded Base Shadow Silhouette of Ghana */}
      <polygon
        points={depthPolygonPoints}
        fill="#0a1c42"
        stroke="#F5B700"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      {/* Top Geographic Surface of Ghana */}
      <polygon
        points={polygonPoints}
        fill="#184385"
        stroke="#00F0FF"
        strokeWidth="2.5"
      />
      {/* Internal Regional Division Lines */}
      {regionalLines.map((line, idx) => {
        const pts = line
          .map((p) => {
            const { sx, sy } = toSvg(p.x, p.y);
            return `${sx},${sy}`;
          })
          .join(' ');
        return (
          <polyline
            key={idx}
            points={pts}
            fill="none"
            stroke="#00F0FF"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
        );
      })}
      {/* Lake Volta Basin */}
      <polygon
        points={voltaPolygonPoints}
        fill="#00F0FF"
        fillOpacity="0.45"
        stroke="#00F0FF"
        strokeWidth="1.5"
      />

      {/* Threat Arcs */}
      {ILLUSTRATIVE_ARCS_3D.map((arc) => {
        const isSelected = arc.id === selectedArcId;
        const s = toSvg(arc.sourcePos.x, arc.sourcePos.y);
        const t = toSvg(arc.targetPos.x, arc.targetPos.y);
        return (
          <g key={arc.id} onClick={() => onSelectArc(arc.id)} className="cursor-pointer">
            <path
              d={`M ${s.sx} ${s.sy} Q 410 40 ${t.sx} ${t.sy}`}
              fill="none"
              stroke={arc.color}
              strokeWidth={isSelected ? '3.5' : '1.8'}
              strokeDasharray="7 4"
            />
            <circle
              cx={t.sx}
              cy={t.sy}
              r={isSelected ? '13' : '8'}
              fill="none"
              stroke={arc.color}
              strokeWidth="2.2"
            />
          </g>
        );
      })}

      {/* 8 Regional Hubs */}
      {GHANA_HUBS_3D.map((hub) => {
        const { sx, sy } = toSvg(hub.pos.x, hub.pos.y);
        const isActive = hub.name === selectedHubName;
        return (
          <g
            key={hub.name}
            onClick={() => onSelectHub(hub.name)}
            className="cursor-pointer"
          >
            <circle
              cx={sx}
              cy={sy}
              r={isActive ? 6 : 4}
              fill={isActive ? '#F5B700' : '#00F0FF'}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            />
            <text
              x={sx + 9}
              y={sy + 4}
              fill={isActive ? '#F5B700' : '#E2E8F0'}
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              {hub.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

interface ProjectedCityLabel {
  name: string;
  region: string;
  x: number;
  y: number;
  isTarget: boolean;
}

export const ThreatMap: React.FC = () => {
  const [selectedVector, setSelectedVector] = useState<string>('All');
  const [activeArcId, setActiveArcId] = useState<string>('arc-1');
  const [selectedHub, setSelectedHub] = useState<GhanaHub3DSpec>(GHANA_HUBS_3D[0]);
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('isometric');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [webglUnsupported, setWebglUnsupported] = useState<boolean>(false);
  const [cityLabels, setCityLabels] = useState<ProjectedCityLabel[]>([]);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeArcRef = useRef<string>(activeArcId);
  const selectedHubNameRef = useRef<string>(selectedHub.name);
  const selectedVectorRef = useRef<string>(selectedVector);
  const isPausedRef = useRef<boolean>(isPaused);

  // Interactive camera rotation/zoom targets controlled by drag, buttons, or presets
  const viewStateRef = useRef({
    targetRotX: CAMERA_PRESETS.isometric.rotX,
    targetRotZ: CAMERA_PRESETS.isometric.rotZ,
    currentRotX: CAMERA_PRESETS.isometric.rotX,
    currentRotZ: CAMERA_PRESETS.isometric.rotZ,
    targetZoom: CAMERA_PRESETS.isometric.zoom,
    currentZoom: CAMERA_PRESETS.isometric.zoom,
    targetPanY: CAMERA_PRESETS.isometric.panY,
    currentPanY: CAMERA_PRESETS.isometric.panY,
  });

  activeArcRef.current = activeArcId;
  selectedHubNameRef.current = selectedHub.name;
  selectedVectorRef.current = selectedVector;
  isPausedRef.current = isPaused;

  const filteredArcs =
    selectedVector === 'All'
      ? ILLUSTRATIVE_ARCS_3D
      : ILLUSTRATIVE_ARCS_3D.filter((arc) => arc.vector === selectedVector);

  const selectedArc =
    filteredArcs.find((a) => a.id === activeArcId) || filteredArcs[0] || ILLUSTRATIVE_ARCS_3D[0];

  const handleSelectArc = (arcId: string) => {
    setActiveArcId(arcId);
    const arcObj = ILLUSTRATIVE_ARCS_3D.find((a) => a.id === arcId);
    if (arcObj) {
      const hubObj = GHANA_HUBS_3D.find((h) => h.name === arcObj.hubName);
      if (hubObj) {
        setSelectedHub(hubObj);
      }
    }
  };

  const handleSelectHub = (hubName: string) => {
    const hubObj = GHANA_HUBS_3D.find((h) => h.name === hubName);
    if (!hubObj) return;
    setSelectedHub(hubObj);

    // If an arc targets this hub, highlight that arc automatically
    const matchingArc = ILLUSTRATIVE_ARCS_3D.find((a) => a.hubName === hubName);
    if (matchingArc) {
      if (selectedVector !== 'All' && matchingArc.vector !== selectedVector) {
        setSelectedVector('All');
      }
      setActiveArcId(matchingArc.id);
    }

    // Gently angle the 3D Ghana map toward the clicked regional hub
    viewStateRef.current.targetRotZ = -hubObj.pos.x * 0.14;
    viewStateRef.current.targetRotX = -0.38 + hubObj.pos.y * 0.06;
  };

  const applyCameraPreset = (preset: CameraViewPreset) => {
    setCameraPreset(preset);
    const cfg = CAMERA_PRESETS[preset];
    viewStateRef.current.targetRotX = cfg.rotX;
    viewStateRef.current.targetRotZ = cfg.rotZ;
    viewStateRef.current.targetZoom = cfg.zoom;
    viewStateRef.current.targetPanY = cfg.panY;
  };

  const handleZoom = (delta: number) => {
    viewStateRef.current.targetZoom = THREE.MathUtils.clamp(
      viewStateRef.current.targetZoom + delta,
      4.8,
      10.2
    );
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || webglUnsupported) return;

    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      } catch {
        setWebglUnsupported(true);
        return;
      }
    }

    const width = Math.max(container.clientWidth || 720, 320);
    const height = Math.max(container.clientHeight || 440, 410);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x040816, 1);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040816, 0.032);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, -1.05, viewStateRef.current.currentZoom);
    camera.lookAt(0, 0.08, 0);

    // Studio Environment Map via RoomEnvironment
    let envTexture: THREE.Texture | null = null;
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();
    } catch {
      // Continue with direct lights if PMREM fails
    }

    // Balanced 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x48e5ff, 0x091534, 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5db, 2.6);
    keyLight.position.set(4.2, 4.8, 6.8);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7c3aed, 2.1);
    rimLight.position.set(-4.5, -3.2, 4.5);
    scene.add(rimLight);

    // Composite 8-Part 3D Map of Ghana & Threat Interception Network Group
    const mapSystemGroup = new THREE.Group();
    mapSystemGroup.rotation.set(
      viewStateRef.current.currentRotX,
      0.08,
      viewStateRef.current.currentRotZ
    );
    mapSystemGroup.position.y = viewStateRef.current.currentPanY;
    scene.add(mapSystemGroup);

    const disposables: { dispose: () => void }[] = [];
    if (envTexture) disposables.push(envTexture);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const topoTex = buildGhanaTopographicTexture(maxAniso);
    disposables.push(topoTex);

    // Part 1: Primary Silhouette — Extruded 3D Geographic Map of Ghana with Normalized [0..1] UVs
    const borderPts = getGhanaBorderScenePoints();
    const ghanaShape = new THREE.Shape();
    borderPts.forEach((pt, idx) => {
      if (idx === 0) ghanaShape.moveTo(pt.x, pt.y);
      else ghanaShape.lineTo(pt.x, pt.y);
    });
    ghanaShape.closePath();

    const ghanaExtrudeGeo = new THREE.ExtrudeGeometry(ghanaShape, {
      depth: GHANA_GEO_PROJECTION.extrudeDepth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.045,
    });
    ghanaExtrudeGeo.translate(0, 0, -GHANA_GEO_PROJECTION.extrudeDepth * 0.5);

    // Normalize UVs across Ghana's bounding box so the 512x512 topographic texture maps cleanly
    const bounds = computeGhanaSceneBounds();
    const posAttr = ghanaExtrudeGeo.attributes.position;
    const uvAttr = ghanaExtrudeGeo.attributes.uv;
    if (posAttr && uvAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const { u, v } = normalizeScenePointToUV(vx, vy, bounds);
        uvAttr.setXY(i, u, v);
      }
      uvAttr.needsUpdate = true;
    }

    // Use color: 0xffffff and metalness: 0.22 so the texture map is never darkened
    const ghanaTopMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: topoTex,
      emissive: 0x103a75,
      emissiveMap: topoTex,
      emissiveIntensity: 0.65,
      metalness: 0.22,
      roughness: 0.35,
    });

    const ghanaSideMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x007799,
      emissiveIntensity: 0.75,
      metalness: 0.5,
      roughness: 0.25,
    });

    const ghanaMapMesh = new THREE.Mesh(ghanaExtrudeGeo, [ghanaTopMat, ghanaSideMat]);
    mapSystemGroup.add(ghanaMapMesh);
    disposables.push(ghanaExtrudeGeo, ghanaTopMat, ghanaSideMat);

    // Part 2: Glowing Sovereign Border Outline, Internal Regional Divisions & Stepped Elevation Rim
    const topZ = GHANA_GEO_PROJECTION.extrudeDepth * 0.5 + 0.052;
    const borderVec3s = borderPts.map((p) => new THREE.Vector3(p.x, p.y, topZ));
    const borderLineGeo = new THREE.BufferGeometry().setFromPoints(borderVec3s);
    const borderLineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.98,
    });
    const borderLineLoop = new THREE.LineLoop(borderLineGeo, borderLineMat);
    mapSystemGroup.add(borderLineLoop);

    const baseBorderVec3s = borderPts.map(
      (p) => new THREE.Vector3(p.x, p.y, -GHANA_GEO_PROJECTION.extrudeDepth * 0.5 - 0.04)
    );
    const baseBorderGeo = new THREE.BufferGeometry().setFromPoints(baseBorderVec3s);
    const baseBorderMat = new THREE.LineBasicMaterial({
      color: 0xf5b700,
      transparent: true,
      opacity: 0.72,
    });
    const baseBorderLoop = new THREE.LineLoop(baseBorderGeo, baseBorderMat);
    mapSystemGroup.add(baseBorderLoop);
    disposables.push(borderLineGeo, borderLineMat, baseBorderGeo, baseBorderMat);

    // 3D Internal Regional Division Polylines on top of the Ghana Map
    const regionLineMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.55,
    });
    disposables.push(regionLineMat);

    getGhanaRegionalDivisionSceneLines().forEach((linePts) => {
      const vecs = linePts.map((p) => new THREE.Vector3(p.x, p.y, topZ + 0.005));
      const rGeo = new THREE.BufferGeometry().setFromPoints(vecs);
      const rLine = new THREE.Line(rGeo, regionLineMat);
      mapSystemGroup.add(rLine);
      disposables.push(rGeo);
    });

    // Part 3: Lake Volta 3D Hydro-Basin Embedded on the Eastern/Central Surface of Ghana
    const voltaPts = getLakeVoltaScenePoints();
    const voltaShape = new THREE.Shape();
    voltaPts.forEach((pt, idx) => {
      if (idx === 0) voltaShape.moveTo(pt.x, pt.y);
      else voltaShape.lineTo(pt.x, pt.y);
    });
    voltaShape.closePath();

    const voltaGeo = new THREE.ExtrudeGeometry(voltaShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
    const voltaMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00bce6,
      emissiveIntensity: 0.85,
      metalness: 0.25,
      roughness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const voltaMesh = new THREE.Mesh(voltaGeo, voltaMat);
    voltaMesh.position.z = GHANA_GEO_PROJECTION.extrudeDepth * 0.5 + 0.038;
    mapSystemGroup.add(voltaMesh);
    disposables.push(voltaGeo, voltaMat);

    // Part 4: 8 Ghana Regional Defense Hub Beacons + Invisible Click Hitboxes for Raycasting
    const hubPedestalGeo = new THREE.CylinderGeometry(0.075, 0.105, 0.09, 6);
    hubPedestalGeo.rotateX(Math.PI / 2);
    const hubPillarGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.26, 8);
    hubPillarGeo.rotateX(Math.PI / 2);
    const hubSphereGeo = new THREE.OctahedronGeometry(0.068, 0);
    const hitSphereGeo = new THREE.SphereGeometry(0.24, 8, 8);

    const hubGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b700,
      emissive: 0xf5b700,
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.2,
    });
    const hubCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.85,
      metalness: 0.5,
      roughness: 0.2,
    });
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });

    const clickableMeshes: THREE.Object3D[] = [];
    const hubWorldRefs: {
      name: string;
      region: string;
      anchor: THREE.Object3D;
      crown: THREE.Mesh;
      pedestal: THREE.Mesh;
    }[] = [];

    GHANA_HUBS_3D.forEach((hub) => {
      const isCapitalOrMajor =
        hub.name === 'Accra' || hub.name === 'Kumasi' || hub.name === 'Tamale';
      const hubGroup = new THREE.Group();
      hubGroup.position.set(hub.pos.x, hub.pos.y, hub.pos.z);

      const ped = new THREE.Mesh(hubPedestalGeo, isCapitalOrMajor ? hubGoldMat : hubCyanMat);
      const pillar = new THREE.Mesh(hubPillarGeo, hubCyanMat);
      pillar.position.z = 0.13;
      const crown = new THREE.Mesh(hubSphereGeo, isCapitalOrMajor ? hubGoldMat : hubCyanMat);
      crown.position.z = 0.28;

      const hitMesh = new THREE.Mesh(hitSphereGeo, hitBoxMat);
      hitMesh.position.z = 0.18;
      hitMesh.userData = { hubName: hub.name };
      clickableMeshes.push(hitMesh);

      hubGroup.add(ped);
      hubGroup.add(pillar);
      hubGroup.add(crown);
      hubGroup.add(hitMesh);
      mapSystemGroup.add(hubGroup);

      hubWorldRefs.push({
        name: hub.name,
        region: hub.region,
        anchor: crown,
        crown,
        pedestal: ped,
      });
    });
    disposables.push(
      hubPedestalGeo,
      hubPillarGeo,
      hubSphereGeo,
      hitSphereGeo,
      hubGoldMat,
      hubCyanMat,
      hitBoxMat
    );

    // Part 5: 3D Threat Interception Arcs Arching Into the 3D Ghana Map
    const arcVisuals: {
      id: string;
      vector: string;
      hubName: string;
      curve: THREE.QuadraticBezierCurve3;
      tubeMesh: THREE.Mesh;
      tubeMat: THREE.MeshStandardMaterial;
      pulseMesh: THREE.Mesh;
      ringMesh: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
      originMesh: THREE.Mesh;
    }[] = [];

    const pulseGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const originGeo = new THREE.OctahedronGeometry(0.12, 0);
    const shieldRingGeo = new THREE.RingGeometry(0.15, 0.23, 28);
    disposables.push(pulseGeo, originGeo, shieldRingGeo);

    ILLUSTRATIVE_ARCS_3D.forEach((arc) => {
      const startVec = new THREE.Vector3(arc.sourcePos.x, arc.sourcePos.y, arc.sourcePos.z);
      const endVec = new THREE.Vector3(arc.targetPos.x, arc.targetPos.y, arc.targetPos.z + 0.2);
      const midVec = new THREE.Vector3(
        (startVec.x + endVec.x) * 0.5,
        (startVec.y + endVec.y) * 0.5 + 0.35,
        1.7
      );

      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.03, 8, false);
      const arcColor = new THREE.Color(arc.color);

      const tubeMat = new THREE.MeshStandardMaterial({
        color: arcColor,
        emissive: arcColor,
        emissiveIntensity: 0.9,
        transparent: true,
        opacity: 0.92,
        roughness: 0.25,
        metalness: 0.3,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.userData = { arcId: arc.id, hubName: arc.hubName };
      clickableMeshes.push(tubeMesh);
      mapSystemGroup.add(tubeMesh);

      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      mapSystemGroup.add(pulseMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const ringMesh = new THREE.Mesh(shieldRingGeo, ringMat);
      ringMesh.position.set(arc.targetPos.x, arc.targetPos.y, arc.targetPos.z + 0.065);
      mapSystemGroup.add(ringMesh);

      const originMat = new THREE.MeshStandardMaterial({
        color: arcColor,
        emissive: arcColor,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.4,
      });
      const originMesh = new THREE.Mesh(originGeo, originMat);
      originMesh.position.copy(startVec);
      originMesh.userData = { arcId: arc.id, hubName: arc.hubName };
      clickableMeshes.push(originMesh);
      mapSystemGroup.add(originMesh);

      arcVisuals.push({
        id: arc.id,
        vector: arc.vector,
        hubName: arc.hubName,
        curve,
        tubeMesh,
        tubeMat,
        pulseMesh,
        ringMesh,
        ringMat,
        originMesh,
      });

      disposables.push(tubeGeo, tubeMat, pulseMat, ringMat, originMat);
    });

    // Part 6: Holographic Radar Compass Ring & Pedestal Grid Beneath the 3D Ghana Map
    const radarRingGeo = new THREE.RingGeometry(2.45, 2.52, 64);
    const radarRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.32,
    });
    const radarRingMesh = new THREE.Mesh(radarRingGeo, radarRingMat);
    radarRingMesh.position.z = -GHANA_GEO_PROJECTION.extrudeDepth * 0.5 - 0.14;
    mapSystemGroup.add(radarRingMesh);
    disposables.push(radarRingGeo, radarRingMat);

    const outerRadarGeo = new THREE.RingGeometry(2.85, 2.89, 64);
    const outerRadarMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
    });
    const outerRadarMesh = new THREE.Mesh(outerRadarGeo, outerRadarMat);
    outerRadarMesh.position.z = -GHANA_GEO_PROJECTION.extrudeDepth * 0.5 - 0.16;
    mapSystemGroup.add(outerRadarMesh);
    disposables.push(outerRadarGeo, outerRadarMat);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Interactive Drag-to-Rotate + Click Raycasting on 3D Hubs & Arcs
    let isDragging = false;
    let dragDistance = 0;
    let prevPointerX = 0;
    let prevPointerY = 0;
    const hoverOffset = { x: 0, y: 0 };

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragDistance = 0;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      hoverOffset.x = THREE.MathUtils.clamp(nx, -1, 1) * 0.08;
      hoverOffset.y = THREE.MathUtils.clamp(ny, -1, 1) * 0.05;

      if (isDragging) {
        const dx = e.clientX - prevPointerX;
        const dy = e.clientY - prevPointerY;
        dragDistance += Math.hypot(dx, dy);
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;

        viewStateRef.current.targetRotZ = THREE.MathUtils.clamp(
          viewStateRef.current.targetRotZ + dx * 0.0075,
          -1.15,
          1.15
        );
        viewStateRef.current.targetRotX = THREE.MathUtils.clamp(
          viewStateRef.current.targetRotX + dy * 0.006,
          -0.95,
          0.25
        );
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const wasClick = isDragging && dragDistance < 8;
      isDragging = false;

      if (wasClick) {
        const rect = container.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointerNdc, camera);

        const hits = raycaster.intersectObjects(clickableMeshes, false);
        if (hits.length > 0) {
          const hitData = hits[0].object.userData;
          if (hitData?.arcId) {
            handleSelectArc(hitData.arcId);
          } else if (hitData?.hubName) {
            handleSelectHub(hitData.hubName);
          }
        }
      }
    };

    const handlePointerLeave = () => {
      isDragging = false;
      hoverOffset.x = 0;
      hoverOffset.y = 0;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerLeave);

    let currentW = width;
    let currentH = height;

    const updateSize = () => {
      if (!container) return;
      const nextW = Math.max(container.clientWidth || 720, 300);
      const nextH = Math.max(container.clientHeight || 440, 410);
      if (nextW === currentW && nextH === currentH) return;
      currentW = nextW;
      currentH = nextH;
      camera.aspect = currentW / currentH;
      camera.updateProjectionMatrix();
      renderer.setSize(currentW, currentH);
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSize) : null;
    if (resizeObserver) resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);

    const clock = new THREE.Clock();
    let elapsedSim = 0;
    let frameId = 0;
    let frameCounter = 0;
    let isDisposed = false;
    let isInViewport = true;
    let lastLabelsSignature = '';
    const tempVec3 = new THREE.Vector3();
    const projVec3 = new THREE.Vector3();

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 90);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 90);
      }
    }

    function tick() {
      if (isDisposed) return;
      if (!isInViewport && frameCounter > 12) {
        frameId = window.setTimeout(tick, 220);
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!isPausedRef.current) {
        elapsedSim += dt;
      }

      const vs = viewStateRef.current;
      vs.currentRotX = THREE.MathUtils.damp(vs.currentRotX, vs.targetRotX, 6, dt);
      vs.currentRotZ = THREE.MathUtils.damp(vs.currentRotZ, vs.targetRotZ, 6, dt);
      vs.currentZoom = THREE.MathUtils.damp(vs.currentZoom, vs.targetZoom, 6, dt);
      vs.currentPanY = THREE.MathUtils.damp(vs.currentPanY, vs.targetPanY, 6, dt);

      camera.position.z = vs.currentZoom;

      // Combine user drag/preset orientation with gentle floating motion
      mapSystemGroup.rotation.z =
        vs.currentRotZ + Math.sin(elapsedSim * 0.45) * 0.03 + hoverOffset.x;
      mapSystemGroup.rotation.x = vs.currentRotX - hoverOffset.y;
      mapSystemGroup.position.y = vs.currentPanY + Math.sin(elapsedSim * 0.9) * 0.025;

      const currentHubName = selectedHubNameRef.current;

      // Rotate & pulse hub beacon crowns
      for (let h = 0; h < hubWorldRefs.length; h++) {
        const item = hubWorldRefs[h];
        const isSelectedHub = item.name === currentHubName;
        item.crown.rotation.z = elapsedSim * 1.5 + h;
        item.crown.scale.setScalar(
          isSelectedHub ? 1.45 + Math.sin(elapsedSim * 4) * 0.15 : 1.0
        );
      }

      // Update 3D Threat Interception Arcs & traveling pulses
      const currentVector = selectedVectorRef.current;
      const currentActiveId = activeArcRef.current;

      for (let a = 0; a < arcVisuals.length; a++) {
        const av = arcVisuals[a];
        const isVisible = currentVector === 'All' || av.vector === currentVector;
        const isSelected = av.id === currentActiveId;

        av.tubeMesh.visible = isVisible;
        av.pulseMesh.visible = isVisible;
        av.ringMesh.visible = isVisible;
        av.originMesh.visible = isVisible;

        if (isVisible) {
          av.tubeMat.opacity = isSelected ? 0.98 : 0.42;
          av.tubeMat.emissiveIntensity = isSelected ? 1.25 : 0.45;
          av.ringMat.opacity = isSelected ? 0.96 : 0.45;
          av.ringMesh.scale.setScalar(isSelected ? 1.2 + Math.sin(elapsedSim * 4) * 0.14 : 0.85);
          av.originMesh.rotation.z = elapsedSim * 1.6;
          av.originMesh.rotation.x = elapsedSim * 1.1;

          const t = (elapsedSim * 0.42 + a * 0.25) % 1;
          av.curve.getPoint(t, tempVec3);
          av.pulseMesh.position.copy(tempVec3);
          av.pulseMesh.scale.setScalar(isSelected ? 1.3 : 0.85);
        }
      }

      renderer.render(scene, camera);

      // Update projected 2D interactive city buttons overlaid on the 3D Ghana Map
      if (frameCounter < 3 || frameCounter % 8 === 0) {
        const nextLabels: ProjectedCityLabel[] = [];
        for (let i = 0; i < hubWorldRefs.length; i++) {
          const item = hubWorldRefs[i];
          item.anchor.getWorldPosition(projVec3);
          projVec3.project(camera);
          const sx = Math.round(((projVec3.x * 0.5 + 0.5) * currentW) / 2) * 2;
          const sy = Math.round(((-projVec3.y * 0.5 + 0.5) * currentH) / 2) * 2;
          nextLabels.push({
            name: item.name,
            region: item.region,
            x: sx,
            y: sy,
            isTarget: item.name === currentHubName,
          });
        }
        const sig = JSON.stringify(nextLabels);
        if (sig !== lastLabelsSignature) {
          lastLabelsSignature = sig;
          setCityLabels(nextLabels);
        }
      }
      frameCounter++;

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              if (entries[0]) {
                isInViewport = entries[0].isIntersecting;
              }
            },
            { threshold: 0.02 }
          )
        : null;
    if (observer) observer.observe(container);

    tick();

    return () => {
      isDisposed = true;
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', updateSize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [webglUnsupported]);

  return (
    <div className="cybershield-glass rounded-2xl p-6 sm:p-8">
      {/* Mandatory Transparency & Non-Fabrication Notice */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5 text-xs text-cyan-300">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span className="font-mono">
            ILLUSTRATIVE 3D GHANA MAP · Educational simulation of common scam interception patterns (Not live network telemetry)
          </span>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Mobile Money Fraud', 'Scholarship Scams', 'Phishing Links'] as const).map(
            (filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setSelectedVector(filter);
                  const firstMatch =
                    filter === 'All'
                      ? ILLUSTRATIVE_ARCS_3D[0]
                      : ILLUSTRATIVE_ARCS_3D.find((a) => a.vector === filter);
                  if (firstMatch) handleSelectArc(firstMatch.id);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedVector === filter
                    ? 'bg-cyan-400 text-slate-950 font-semibold'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {filter}
              </button>
            )
          )}
          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={isPaused ? 'Resume 3D Ghana map animation' : 'Pause 3D Ghana map animation'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 transition-colors whitespace-nowrap shrink-0"
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        {/* Interactive 3D Map of Ghana Viewport */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-xl border border-cyan-400/25 bg-[#040816]">
          {webglUnsupported ? (
            <Static3DGhanaMapFallback
              selectedArcId={selectedArc.id}
              selectedHubName={selectedHub.name}
              onSelectArc={handleSelectArc}
              onSelectHub={handleSelectHub}
            />
          ) : (
            <div
              ref={mountRef}
              data-testid="threat-map-3d-ghana-canvas"
              role="img"
              aria-label="Interactive 3D geographic map of Ghana showing Lake Volta, regional hubs, and 3D scam interception arcs. Drag to rotate or click any city hub."
              className="h-[430px] w-full cursor-grab active:cursor-grabbing sm:h-[460px]"
            />
          )}

          {/* Clickable Projected 2D City Hub Badges Overlaid on the 3D Ghana Map */}
          {!webglUnsupported && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {cityLabels.map((lbl) => (
                <button
                  key={lbl.name}
                  type="button"
                  onClick={() => handleSelectHub(lbl.name)}
                  style={{
                    transform: `translate3d(${lbl.x + 8}px, ${lbl.y - 12}px, 0)`,
                  }}
                  aria-label={`Inspect ${lbl.name} (${lbl.region} Region) on 3D Ghana Map`}
                  className={`pointer-events-auto absolute left-0 top-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold tracking-tight transition-colors ${
                    lbl.isTarget
                      ? 'border border-amber-400 bg-[#050816]/95 text-amber-300 shadow-[0_0_12px_rgba(245,183,0,0.45)]'
                      : 'border border-slate-700/80 bg-[#050816]/85 text-slate-200 hover:border-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  {lbl.name}
                </button>
              ))}
            </div>
          )}

          {/* Non-occluding Top-Left Spec Badge */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-[#050816]/92 px-3 py-1.5 text-[11px] font-mono text-slate-200">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>3D GHANA TOPOGRAPHIC SHIELD · DRAG TO ROTATE · CLICK ANY CITY</span>
          </div>

          {/* Non-occluding Unified Bottom Control Dock (Camera Presets + Zoom + Reset) */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/90 bg-[#050816]/92 px-3 py-2 text-[11px] text-slate-300">
            <div
              role="group"
              aria-label="3D Ghana Map Camera Views"
              className="flex flex-wrap items-center gap-1.5"
            >
              <Compass className="mr-1 h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              {(Object.keys(CAMERA_PRESETS) as CameraViewPreset[]).map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => applyCameraPreset(presetKey)}
                  className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                    cameraPreset === presetKey
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {CAMERA_PRESETS[presetKey].label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleZoom(-0.7)}
                aria-label="Zoom in on 3D Ghana Map"
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-200 hover:border-cyan-400/60"
              >
                <ZoomIn className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span>Zoom +</span>
              </button>
              <button
                type="button"
                onClick={() => handleZoom(0.7)}
                aria-label="Zoom out on 3D Ghana Map"
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-200 hover:border-cyan-400/60"
              >
                <ZoomOut className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                <span>Zoom -</span>
              </button>
              <button
                type="button"
                onClick={() => applyCameraPreset('isometric')}
                aria-label="Reset 3D Ghana Map View"
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-[10px] text-amber-300 hover:border-amber-400/60"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Threat Vector & Regional Hub Inspector Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Active Regional Hub Card */}
          <div className="rounded-xl border border-amber-400/30 bg-[#080d1f] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-amber-300">
                ACTIVE REGIONAL HUB · {selectedHub.region.toUpperCase()}
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {selectedHub.lat.toFixed(2)}°N, {Math.abs(selectedHub.lon).toFixed(2)}°
                {selectedHub.lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
            <h3 className="mt-1 font-display text-base font-bold text-white">
              {selectedHub.name} Node
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{selectedHub.focusTip}</p>
          </div>

          {/* Active Threat Simulation Card */}
          <div className="rounded-xl border border-slate-800 bg-[#080d1f] p-5">
            <div className="text-xs font-mono text-cyan-300">
              SELECTED SIMULATION · {selectedArc.vector.toUpperCase()}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-white">
              {selectedArc.originLabel} → {selectedArc.targetCity}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
              {selectedArc.description}
            </p>
            <div className="mt-3.5 rounded-lg border border-cyan-400/25 bg-cyan-950/30 p-3 text-xs leading-relaxed text-cyan-100">
              <strong className="block font-semibold text-cyan-300">
                How CyberShield Defends:
              </strong>
              {selectedArc.blockedAction}
            </div>
          </div>

          {/* Clickable scenario list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">
              Select a simulated attack vector or click any city on the 3D map:
            </p>
            {filteredArcs.map((arc) => (
              <button
                key={arc.id}
                type="button"
                onClick={() => handleSelectArc(arc.id)}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-xs transition-colors ${
                  arc.id === selectedArc.id
                    ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span>{arc.vector}</span>
                  <span className="font-mono text-cyan-300">{arc.targetCity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
