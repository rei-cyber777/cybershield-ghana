import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ShieldAlert, Pause, Play, MapPin } from 'lucide-react';
import {
  GHANA_GEO_PROJECTION,
  GHANA_HUBS_3D,
  ILLUSTRATIVE_ARCS_3D,
  getGhanaBorderScenePoints,
  getLakeVoltaScenePoints,
} from '../lib/ghanaFlagGeometry';

/**
 * Static 3D-Perspective SVG Map of Ghana Fallback
 * Used if WebGL is unavailable in the browser.
 */
const Static3DGhanaMapFallback: React.FC<{
  selectedArcId: string;
  onSelectArc: (id: string) => void;
}> = ({ selectedArcId, onSelectArc }) => {
  const borderPts = getGhanaBorderScenePoints();
  const voltaPts = getLakeVoltaScenePoints();

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
        fill="#061029"
        stroke="#7C3AED"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      {/* Top Geographic Surface of Ghana */}
      <polygon
        points={polygonPoints}
        fill="#0c1b40"
        stroke="#00F0FF"
        strokeWidth="2.2"
      />
      {/* Lake Volta Basin */}
      <polygon
        points={voltaPolygonPoints}
        fill="#00F0FF"
        fillOpacity="0.32"
        stroke="#00F0FF"
        strokeWidth="1.2"
      />

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
              strokeWidth={isSelected ? '3' : '1.5'}
              strokeDasharray="7 4"
            />
            <circle
              cx={t.sx}
              cy={t.sy}
              r={isSelected ? '12' : '7'}
              fill="none"
              stroke={arc.color}
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
};

interface ProjectedCityLabel {
  name: string;
  x: number;
  y: number;
  isTarget: boolean;
}

export const ThreatMap: React.FC = () => {
  const [selectedVector, setSelectedVector] = useState<string>('All');
  const [activeArcId, setActiveArcId] = useState<string>('arc-1');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [webglUnsupported, setWebglUnsupported] = useState<boolean>(false);
  const [cityLabels, setCityLabels] = useState<ProjectedCityLabel[]>([]);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const activeArcRef = useRef<string>(activeArcId);
  const selectedVectorRef = useRef<string>(selectedVector);
  const isPausedRef = useRef<boolean>(isPaused);

  activeArcRef.current = activeArcId;
  selectedVectorRef.current = selectedVector;
  isPausedRef.current = isPaused;

  const filteredArcs =
    selectedVector === 'All'
      ? ILLUSTRATIVE_ARCS_3D
      : ILLUSTRATIVE_ARCS_3D.filter((arc) => arc.vector === selectedVector);

  const selectedArc =
    filteredArcs.find((a) => a.id === activeArcId) || filteredArcs[0] || ILLUSTRATIVE_ARCS_3D[0];

  useEffect(() => {
    const container = mountRef.current;
    if (!container || webglUnsupported) return;

    // 1. Detect Software WebGL per Three.js skill rules
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 410);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x03050c, 1);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03050c, 0.055);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, -1.1, 7.75);
    camera.lookAt(0, 0.1, 0);

    // 2. Studio Environment Map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Balanced 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x050816, 1.0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5db, 2.5);
    keyLight.position.set(4.0, 4.5, 6.5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7c3aed, 2.1);
    rimLight.position.set(-4.5, -3.0, 4.0);
    scene.add(rimLight);

    // 4. Composite 8-Part 3D Map of Ghana & Threat Interception Network Group
    const mapSystemGroup = new THREE.Group();
    // Tilt the 3D Ghana Map slightly backward (-0.34 rad on X) and lift Y so Cape Three Points has breathing room
    mapSystemGroup.rotation.set(-0.34, 0.12, 0);
    mapSystemGroup.position.y = 0.24;
    scene.add(mapSystemGroup);

    const disposables: { dispose: () => void }[] = [];

    // Procedural Topographic Cyber-Grid Texture for the 3D Ghana Map Surface
    const topoCanvas = document.createElement('canvas');
    topoCanvas.width = 256;
    topoCanvas.height = 256;
    const tCtx = topoCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#0d1f45';
      tCtx.fillRect(0, 0, 256, 256);
      tCtx.strokeStyle = 'rgba(0, 240, 255, 0.24)';
      tCtx.lineWidth = 1;
      for (let i = 0; i <= 256; i += 16) {
        tCtx.beginPath();
        tCtx.moveTo(i, 0);
        tCtx.lineTo(i, 256);
        tCtx.stroke();
        tCtx.beginPath();
        tCtx.moveTo(0, i);
        tCtx.lineTo(256, i);
        tCtx.stroke();
      }
    }
    const topoTex = new THREE.CanvasTexture(topoCanvas);
    topoTex.wrapS = THREE.RepeatWrapping;
    topoTex.wrapT = THREE.RepeatWrapping;
    topoTex.repeat.set(1.2, 1.2);
    topoTex.colorSpace = THREE.SRGBColorSpace;
    topoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    disposables.push(topoTex);

    // Part 1: Primary Silhouette — Extruded 3D Geographic Map of Ghana
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
      bevelSegments: 4,
      steps: 2,
      bevelSize: 0.035,
      bevelThickness: 0.045,
    });
    // Center on Z so top face is at +extrudeDepth/2
    ghanaExtrudeGeo.translate(0, 0, -GHANA_GEO_PROJECTION.extrudeDepth * 0.5);

    const ghanaTopMat = new THREE.MeshPhysicalMaterial({
      color: 0x102859,
      map: topoTex,
      emissive: 0x061536,
      emissiveIntensity: 0.4,
      metalness: 0.72,
      roughness: 0.26,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
    });

    const ghanaSideMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x005577,
      emissiveIntensity: 0.65,
      metalness: 0.88,
      roughness: 0.2,
    });

    const ghanaMapMesh = new THREE.Mesh(ghanaExtrudeGeo, [ghanaTopMat, ghanaSideMat]);
    mapSystemGroup.add(ghanaMapMesh);
    disposables.push(ghanaExtrudeGeo, ghanaTopMat, ghanaSideMat);

    // Part 2: Glowing Sovereign Border Outline & Stepped Elevation Rim on the 3D Ghana Map
    const borderVec3s = borderPts.map(
      (p) => new THREE.Vector3(p.x, p.y, GHANA_GEO_PROJECTION.extrudeDepth * 0.5 + 0.052)
    );
    const borderLineGeo = new THREE.BufferGeometry().setFromPoints(borderVec3s);
    const borderLineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95,
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
      opacity: 0.55,
    });
    const baseBorderLoop = new THREE.LineLoop(baseBorderGeo, baseBorderMat);
    mapSystemGroup.add(baseBorderLoop);
    disposables.push(borderLineGeo, borderLineMat, baseBorderGeo, baseBorderMat);

    // Part 3: Lake Volta 3D Hydro-Basin Embedded on the Eastern/Central Surface of Ghana
    const voltaPts = getLakeVoltaScenePoints();
    const voltaShape = new THREE.Shape();
    voltaPts.forEach((pt, idx) => {
      if (idx === 0) voltaShape.moveTo(pt.x, pt.y);
      else voltaShape.lineTo(pt.x, pt.y);
    });
    voltaShape.closePath();

    const voltaGeo = new THREE.ExtrudeGeometry(voltaShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    });
    const voltaMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      emissive: 0x00a8cc,
      emissiveIntensity: 0.65,
      metalness: 0.3,
      roughness: 0.12,
      clearcoat: 1.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const voltaMesh = new THREE.Mesh(voltaGeo, voltaMat);
    voltaMesh.position.z = GHANA_GEO_PROJECTION.extrudeDepth * 0.5 + 0.038;
    mapSystemGroup.add(voltaMesh);
    disposables.push(voltaGeo, voltaMat);

    // Part 4: 8 Ghana Regional Defense Hub Beacons Mounted on their Real Coordinates
    const hubPedestalGeo = new THREE.CylinderGeometry(0.065, 0.095, 0.08, 6);
    hubPedestalGeo.rotateX(Math.PI / 2);
    const hubPillarGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.24, 8);
    hubPillarGeo.rotateX(Math.PI / 2);
    const hubSphereGeo = new THREE.OctahedronGeometry(0.055, 0);

    const hubGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b700,
      emissive: 0xf5b700,
      emissiveIntensity: 0.7,
      metalness: 0.9,
      roughness: 0.2,
    });
    const hubCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.75,
      metalness: 0.85,
      roughness: 0.2,
    });

    const hubWorldRefs: { name: string; anchor: THREE.Object3D; crown: THREE.Mesh }[] = [];

    GHANA_HUBS_3D.forEach((hub) => {
      const isCapitalOrMajor = hub.name === 'Accra' || hub.name === 'Kumasi' || hub.name === 'Tamale';
      const hubGroup = new THREE.Group();
      hubGroup.position.set(hub.pos.x, hub.pos.y, hub.pos.z);

      const ped = new THREE.Mesh(hubPedestalGeo, isCapitalOrMajor ? hubGoldMat : hubCyanMat);
      const pillar = new THREE.Mesh(hubPillarGeo, hubCyanMat);
      pillar.position.z = 0.12;
      const crown = new THREE.Mesh(hubSphereGeo, isCapitalOrMajor ? hubGoldMat : hubCyanMat);
      crown.position.z = 0.26;

      hubGroup.add(ped);
      hubGroup.add(pillar);
      hubGroup.add(crown);
      mapSystemGroup.add(hubGroup);

      hubWorldRefs.push({ name: hub.name, anchor: crown, crown });
    });
    disposables.push(hubPedestalGeo, hubPillarGeo, hubSphereGeo, hubGoldMat, hubCyanMat);

    // Part 5: 3D Threat Interception Arcs Arching Into the 3D Ghana Map
    const arcVisuals: {
      id: string;
      vector: string;
      curve: THREE.QuadraticBezierCurve3;
      tubeMesh: THREE.Mesh;
      tubeMat: THREE.MeshStandardMaterial;
      pulseMesh: THREE.Mesh;
      ringMesh: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
      originMesh: THREE.Mesh;
    }[] = [];

    const pulseGeo = new THREE.SphereGeometry(0.085, 16, 16);
    const originGeo = new THREE.OctahedronGeometry(0.11, 0);
    const shieldRingGeo = new THREE.RingGeometry(0.14, 0.21, 28);
    disposables.push(pulseGeo, originGeo, shieldRingGeo);

    ILLUSTRATIVE_ARCS_3D.forEach((arc) => {
      const startVec = new THREE.Vector3(arc.sourcePos.x, arc.sourcePos.y, arc.sourcePos.z);
      const endVec = new THREE.Vector3(arc.targetPos.x, arc.targetPos.y, arc.targetPos.z + 0.18);
      const midVec = new THREE.Vector3(
        (startVec.x + endVec.x) * 0.5,
        (startVec.y + endVec.y) * 0.5 + 0.35,
        1.65
      );

      const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.026, 8, false);
      const arcColor = new THREE.Color(arc.color);

      const tubeMat = new THREE.MeshStandardMaterial({
        color: arcColor,
        emissive: arcColor,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.88,
        roughness: 0.25,
        metalness: 0.5,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      mapSystemGroup.add(tubeMesh);

      const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      mapSystemGroup.add(pulseMesh);

      const ringMat = new THREE.MeshBasicMaterial({
        color: arcColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ringMesh = new THREE.Mesh(shieldRingGeo, ringMat);
      ringMesh.position.set(arc.targetPos.x, arc.targetPos.y, arc.targetPos.z + 0.06);
      mapSystemGroup.add(ringMesh);

      const originMat = new THREE.MeshStandardMaterial({
        color: arcColor,
        emissive: arcColor,
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.7,
      });
      const originMesh = new THREE.Mesh(originGeo, originMat);
      originMesh.position.copy(startVec);
      mapSystemGroup.add(originMesh);

      arcVisuals.push({
        id: arc.id,
        vector: arc.vector,
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
      opacity: 0.26,
    });
    const radarRingMesh = new THREE.Mesh(radarRingGeo, radarRingMat);
    radarRingMesh.position.z = -GHANA_GEO_PROJECTION.extrudeDepth * 0.5 - 0.14;
    mapSystemGroup.add(radarRingMesh);
    disposables.push(radarRingGeo, radarRingMat);

    const outerRadarGeo = new THREE.RingGeometry(2.85, 2.88, 64);
    const outerRadarMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const outerRadarMesh = new THREE.Mesh(outerRadarGeo, outerRadarMat);
    outerRadarMesh.position.z = -GHANA_GEO_PROJECTION.extrudeDepth * 0.5 - 0.16;
    mapSystemGroup.add(outerRadarMesh);
    disposables.push(outerRadarGeo, outerRadarMat);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer interactive tilt / orbit
    const targetPointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetPointer.x = THREE.MathUtils.clamp(nx, -1, 1);
      targetPointer.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    const handlePointerLeave = () => {
      targetPointer.x = 0;
      targetPointer.y = 0;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    let currentW = width;
    let currentH = height;

    const handleResize = () => {
      if (!container) return;
      currentW = Math.max(container.clientWidth, 300);
      currentH = Math.max(container.clientHeight, 410);
      camera.aspect = currentW / currentH;
      camera.updateProjectionMatrix();
      renderer.setSize(currentW, currentH);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let elapsedSim = 0;
    let frameId = 0;
    let frameCounter = 0;
    let isDisposed = false;
    let isInViewport = true;
    let lastLabelsSignature = '';
    const tempVec3 = new THREE.Vector3();
    const projVec3 = new THREE.Vector3();

    // Software WebGL fence-sync frame pacing per Three.js skill rules
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
            frameId = window.setTimeout(cb, 140);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 140);
      }
    }

    function tick() {
      if (isDisposed) return;
      if (!isInViewport && frameCounter > 2) {
        frameId = window.setTimeout(tick, 250);
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!isPausedRef.current) {
        elapsedSim += dt;
      }

      currentPointer.x = THREE.MathUtils.damp(currentPointer.x, targetPointer.x, 4.5, dt);
      currentPointer.y = THREE.MathUtils.damp(currentPointer.y, targetPointer.y, 4.5, dt);

      // Gentle 3D floating & pointer-responsive tilt of the 3D Ghana Map
      mapSystemGroup.rotation.z = Math.sin(elapsedSim * 0.45) * 0.04 + currentPointer.x * 0.28;
      mapSystemGroup.rotation.x = -0.34 - currentPointer.y * 0.18;
      mapSystemGroup.position.y = 0.24 + Math.sin(elapsedSim * 0.9) * 0.04;

      // Rotate hub beacon crowns
      for (let h = 0; h < hubWorldRefs.length; h++) {
        hubWorldRefs[h].crown.rotation.z = elapsedSim * 1.4 + h;
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
          av.tubeMat.opacity = isSelected ? 0.96 : 0.35;
          av.tubeMat.emissiveIntensity = isSelected ? 1.15 : 0.35;
          av.ringMat.opacity = isSelected ? 0.95 : 0.4;
          av.ringMesh.scale.setScalar(isSelected ? 1.18 + Math.sin(elapsedSim * 4) * 0.14 : 0.85);
          av.originMesh.rotation.z = elapsedSim * 1.6;
          av.originMesh.rotation.x = elapsedSim * 1.1;

          const t = (elapsedSim * 0.42 + a * 0.25) % 1;
          av.curve.getPoint(t, tempVec3);
          av.pulseMesh.position.copy(tempVec3);
          av.pulseMesh.scale.setScalar(isSelected ? 1.25 : 0.8);
        }
      }

      renderer.render(scene, camera);

      // Update projected 2D city coordinates only on first frame or when target changes
      if (frameCounter === 0 || frameCounter % 15 === 0) {
        const activeArcObj =
          ILLUSTRATIVE_ARCS_3D.find((item) => item.id === currentActiveId) ||
          ILLUSTRATIVE_ARCS_3D[0];
        const nextLabels: ProjectedCityLabel[] = [];
        for (let i = 0; i < hubWorldRefs.length; i++) {
          const item = hubWorldRefs[i];
          item.anchor.getWorldPosition(projVec3);
          projVec3.project(camera);
          const sx = Math.round(((projVec3.x * 0.5 + 0.5) * currentW) / 4) * 4;
          const sy = Math.round(((-projVec3.y * 0.5 + 0.5) * currentH) / 4) * 4;
          nextLabels.push({
            name: item.name,
            x: sx,
            y: sy,
            isTarget: activeArcObj.targetCity.startsWith(item.name),
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
            { threshold: 0.05 }
          )
        : null;
    if (observer) observer.observe(container);

    tick();

    return () => {
      isDisposed = true;
      if (observer) observer.disconnect();
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
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
                  if (firstMatch) setActiveArcId(firstMatch.id);
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
        <div className="lg:col-span-8 relative overflow-hidden rounded-xl border border-slate-800/90 bg-[#03050c]">
          {webglUnsupported ? (
            <Static3DGhanaMapFallback
              selectedArcId={selectedArc.id}
              onSelectArc={(id) => setActiveArcId(id)}
            />
          ) : (
            <div
              ref={mountRef}
              data-testid="threat-map-3d-ghana-canvas"
              role="img"
              aria-label="Interactive 3D geographic map of Ghana showing Lake Volta, regional hubs, and 3D scam interception arcs"
              className="h-[410px] w-full sm:h-[440px]"
            />
          )}

          {/* Projected 2D City Labels Overlaid on the 3D Ghana Map */}
          {!webglUnsupported && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {cityLabels.map((lbl) => (
                <div
                  key={lbl.name}
                  style={{
                    transform: `translate3d(${lbl.x + 8}px, ${lbl.y - 10}px, 0)`,
                  }}
                  className={`absolute left-0 top-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight transition-colors ${
                    lbl.isTarget
                      ? 'border border-amber-400/80 bg-[#050816]/95 text-amber-300'
                      : 'bg-[#050816]/80 text-slate-200'
                  }`}
                >
                  {lbl.name}
                </div>
              ))}
            </div>
          )}

          {/* Non-occluding Top-Left Spec Badge */}
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-slate-800 bg-[#050816]/90 px-3 py-1.5 text-[11px] font-mono text-slate-200">
            <MapPin className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
            <span>3D GHANA TOPOGRAPHIC SHIELD · 4.74°N–11.17°N · LAKE VOLTA BASIN</span>
          </div>

          {/* Non-occluding Bottom Legend Dock */}
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-[#050816]/90 px-3 py-1.5 text-[11px] text-slate-300">
            <div className="flex flex-wrap items-center gap-3 font-mono">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />
                <span>Primary Hubs (Accra · Kumasi · Tamale)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-cyan-400" />
                <span>Regional Nodes & Lake Volta</span>
              </span>
            </div>
            <span className="font-mono text-cyan-300">Move pointer to tilt 3D Ghana map</span>
          </div>
        </div>

        {/* Selected Threat Vector Inspector Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-5">
          <div className="rounded-xl border border-slate-800 bg-[#080d1f] p-5">
            <div className="text-xs font-mono text-cyan-300">
              SELECTED SIMULATION · {selectedArc.vector.toUpperCase()}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-white">
              {selectedArc.originLabel} → {selectedArc.targetCity}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {selectedArc.description}
            </p>
            <div className="mt-4 rounded-lg border border-cyan-400/25 bg-cyan-950/30 p-3.5 text-xs leading-relaxed text-cyan-100">
              <strong className="block font-semibold text-cyan-300">
                How CyberShield Defends:
              </strong>
              {selectedArc.blockedAction}
            </div>
          </div>

          {/* Clickable scenario list */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">
              Select a simulated attack vector on the 3D Ghana Map:
            </p>
            {filteredArcs.map((arc) => (
              <button
                key={arc.id}
                type="button"
                onClick={() => setActiveArcId(arc.id)}
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
