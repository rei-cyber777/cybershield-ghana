import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  GHANA_GLOBE_HIGHLIGHT_LON_LAT,
  GLOBAL_CYBER_RELAY_NODES,
  GLOBE_CONTINENT_PRESETS,
  WORLD_CONTINENT_POLYGONS,
  latLonToGlobePoint,
  lonLatToEquirectangularXY,
} from '../lib/worldGlobeTexture';

interface Hero3DProps {
  forceStaticFallback: boolean;
}

/**
 * Generates a crisp procedural equirectangular World Map CanvasTexture (512x256)
 * with continent polygons, graticules, continent labels, and Ghana highlighted in radiant Gold at 5.55°N, 0.20°W.
 */
function buildProceduralWorldGlobeTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const W = 512;
  const H = 256;

  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = W;
  albedoCanvas.height = H;
  const aCtx = albedoCanvas.getContext('2d');

  if (aCtx) {
    // Deep cyber ocean base
    const oceanGrad = aCtx.createLinearGradient(0, 0, 0, H);
    oceanGrad.addColorStop(0, '#040b1e');
    oceanGrad.addColorStop(0.5, '#071a3e');
    oceanGrad.addColorStop(1, '#040b1e');
    aCtx.fillStyle = oceanGrad;
    aCtx.fillRect(0, 0, W, H);

    // Draw latitude / longitude graticule lines every 15 degrees
    aCtx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    aCtx.lineWidth = 1;

    for (let lon = -165; lon <= 180; lon += 15) {
      const { x } = lonLatToEquirectangularXY(lon, 0, W, H);
      aCtx.beginPath();
      aCtx.moveTo(x, 0);
      aCtx.lineTo(x, H);
      aCtx.stroke();

      if (lon === 0) {
        // Highlight Prime Meridian (passes directly through Ghana!)
        aCtx.strokeStyle = 'rgba(245, 183, 0, 0.45)';
        aCtx.beginPath();
        aCtx.moveTo(x, 0);
        aCtx.lineTo(x, H);
        aCtx.stroke();
        aCtx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      }
    }

    for (let lat = -75; lat <= 75; lat += 15) {
      const { y } = lonLatToEquirectangularXY(0, lat, W, H);
      aCtx.beginPath();
      aCtx.moveTo(0, y);
      aCtx.lineTo(W, y);
      aCtx.stroke();

      if (lat === 0) {
        // Highlight Equator
        aCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        aCtx.beginPath();
        aCtx.moveTo(0, y);
        aCtx.lineTo(W, y);
        aCtx.stroke();
        aCtx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      }
    }

    // Draw all World Continents with glowing cyan coastlines and continent labels
    WORLD_CONTINENT_POLYGONS.forEach((continent) => {
      aCtx.beginPath();
      continent.lonLatPoints.forEach(([lon, lat], idx) => {
        const pt = lonLatToEquirectangularXY(lon, lat, W, H);
        if (idx === 0) aCtx.moveTo(pt.x, pt.y);
        else aCtx.lineTo(pt.x, pt.y);
      });
      aCtx.closePath();

      aCtx.fillStyle = continent.fillColor;
      aCtx.fill();
      aCtx.strokeStyle = '#00f0ff';
      aCtx.lineWidth = 1.8;
      aCtx.stroke();

      // Continent Name Label on the Globe Map
      if (continent.labelLonLat) {
        const lblPt = lonLatToEquirectangularXY(
          continent.labelLonLat[0],
          continent.labelLonLat[1],
          W,
          H
        );
        aCtx.font = 'bold 8px "JetBrains Mono", monospace';
        aCtx.textAlign = 'center';
        aCtx.fillStyle = '#e2e8f0';
        aCtx.fillText(continent.name, lblPt.x, lblPt.y);
      }
    });

    // Soft golden radar halo around Ghana on the globe texture
    const ghanaPx = lonLatToEquirectangularXY(-0.2, 5.55, W, H);
    const halo = aCtx.createRadialGradient(ghanaPx.x, ghanaPx.y, 2, ghanaPx.x, ghanaPx.y, 22);
    halo.addColorStop(0, 'rgba(245, 183, 0, 0.95)');
    halo.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    aCtx.fillStyle = halo;
    aCtx.beginPath();
    aCtx.arc(ghanaPx.x, ghanaPx.y, 22, 0, Math.PI * 2);
    aCtx.fill();

    // Highlight Sovereign Ghana in Radiant Gold (#F5B700) on Africa
    aCtx.beginPath();
    GHANA_GLOBE_HIGHLIGHT_LON_LAT.forEach(([lon, lat], idx) => {
      const pt = lonLatToEquirectangularXY(lon, lat, W, H);
      if (idx === 0) aCtx.moveTo(pt.x, pt.y);
      else aCtx.lineTo(pt.x, pt.y);
    });
    aCtx.closePath();
    aCtx.fillStyle = '#F5B700';
    aCtx.fill();
    aCtx.strokeStyle = '#FFFFFF';
    aCtx.lineWidth = 1.5;
    aCtx.stroke();
  }

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.anisotropy = maxAnisotropy;

  return albedoMap;
}

/**
 * Static SVG/CSS World Globe & Continents Fallback
 * Rendered on low-power devices, when prefers-reduced-motion is active,
 * when Save-Data is enabled, or when the user toggles "Data Saver Mode".
 */
const StaticShieldFallback: React.FC = () => {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#070d24] via-[#050816] to-[#120b29] p-6"
      role="img"
      aria-label="3D World Globe with maps of all continents and Ghana highlighted inside an orbital cyber defense shield"
    >
      <svg
        viewBox="0 0 420 420"
        className="h-full max-h-[360px] w-full max-w-[360px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="globeCoreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#7C3AED" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#050816" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="210" cy="210" r="175" fill="url(#globeCoreGlow)" />

        {/* Orbital rings */}
        <ellipse
          cx="210"
          cy="210"
          rx="168"
          ry="66"
          transform="rotate(-22 210 210)"
          stroke="#00F0FF"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <ellipse
          cx="210"
          cy="210"
          rx="160"
          ry="62"
          transform="rotate(30 210 210)"
          stroke="#7C3AED"
          strokeOpacity="0.5"
          strokeWidth="1.5"
        />

        {/* World Globe Sphere & Graticules */}
        <circle
          cx="210"
          cy="210"
          r="122"
          fill="#061430"
          stroke="#00F0FF"
          strokeOpacity="0.7"
          strokeWidth="2"
        />
        <ellipse cx="210" cy="210" rx="65" ry="122" stroke="#00F0FF" strokeOpacity="0.22" />
        <ellipse cx="210" cy="210" rx="122" ry="48" stroke="#00F0FF" strokeOpacity="0.22" />
        <line x1="88" y1="210" x2="332" y2="210" stroke="#00F0FF" strokeOpacity="0.3" />
        <line x1="210" y1="88" x2="210" y2="332" stroke="#F5B700" strokeOpacity="0.3" />

        {/* Europe */}
        <path
          d="M180 142 L205 122 L238 128 L242 148 L215 152 L190 150 Z"
          fill="#143c6e"
          stroke="#00F0FF"
          strokeWidth="1.5"
        />
        {/* Africa */}
        <path
          d="M175 158 L215 154 L245 172 L262 198 L242 238 L226 282 L205 278 L195 235 L182 210 L164 202 L160 180 Z"
          fill="#174882"
          stroke="#00F0FF"
          strokeWidth="1.8"
        />
        {/* Americas Edge */}
        <path
          d="M108 152 L134 146 L142 175 L125 198 L145 228 L132 275 L112 252 Z"
          fill="#143c6e"
          stroke="#00F0FF"
          strokeWidth="1.5"
        />
        {/* Asia Edge */}
        <path
          d="M248 134 L298 148 L314 185 L286 205 L260 182 Z"
          fill="#123663"
          stroke="#00F0FF"
          strokeWidth="1.5"
        />

        {/* Ghana Highlighted in Gold */}
        <circle cx="188" cy="200" r="14" fill="#F5B700" fillOpacity="0.28" />
        <circle cx="188" cy="200" r="6" fill="#F5B700" stroke="#FFF" strokeWidth="1.5" />
        <text
          x="210"
          y="362"
          textAnchor="middle"
          fill="#F5B700"
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
        >
          WORLD GLOBE SHIELD · GHANA (5.55°N, 0.20°W)
        </text>
      </svg>
    </div>
  );
};

export const Hero3D: React.FC<Hero3DProps> = ({ forceStaticFallback }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglUnsupported, setWebglUnsupported] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeContinentId, setActiveContinentId] = useState<string>('auto');

  const activeContinentRef = useRef<string>(activeContinentId);
  activeContinentRef.current = activeContinentId;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (forceStaticFallback || prefersReducedMotion || webglUnsupported) return;
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL (SwiftShader / llvmpipe) per Three.js skill rules
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
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglUnsupported(true);
      return;
    }

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 340);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050816, 0.072);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.08, 6.8);

    // 2. Studio Environment Map via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Balanced 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x00f0ff, 0x050816, 1.05);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.4);
    keyLight.position.set(4.5, 5.0, 5.0);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7c3aed, 2.0);
    rimLight.position.set(-4.5, -2.0, -3.0);
    scene.add(rimLight);

    // 4. Composite 9-Part 3D World Globe with Raised 3D Continent Maps & Orbital Shield
    const rootGroup = new THREE.Group();
    rootGroup.position.y = 0.25;
    scene.add(rootGroup);

    const worldGlobeGroup = new THREE.Group();
    rootGroup.add(worldGlobeGroup);

    const GLOBE_RADIUS = 1.44;
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const albedoMap = buildProceduralWorldGlobeTexture(maxAniso);

    // Part 1: Primary Silhouette — High-Resolution 3D World Globe with Continents & Oceans
    const globeGeo = new THREE.SphereGeometry(
      GLOBE_RADIUS,
      isSoftwareGl ? 32 : 48,
      isSoftwareGl ? 24 : 36
    );
    globeGeo.rotateY(-Math.PI / 2);

    const globeMat = new THREE.MeshStandardMaterial({
      map: albedoMap,
      emissive: 0x0a2548,
      emissiveMap: albedoMap,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.5,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    worldGlobeGroup.add(globeMesh);

    // Part 2: 3D Spherical Continent Coastline Polylines (Merged into 1 LineSegments draw call)
    const continentLineDisposables: { dispose: () => void }[] = [];
    const continentLineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
    });
    continentLineDisposables.push(continentLineMat);

    const allSegmentPoints: THREE.Vector3[] = [];
    WORLD_CONTINENT_POLYGONS.forEach((continent) => {
      const pts = continent.lonLatPoints;
      for (let i = 0; i < pts.length; i++) {
        const [lon1, lat1] = pts[i];
        const [lon2, lat2] = pts[(i + 1) % pts.length];
        const steps = 2;
        for (let s = 0; s < steps; s++) {
          const t1 = s / steps;
          const t2 = (s + 1) / steps;
          const p1 = latLonToGlobePoint(
            lat1 + (lat2 - lat1) * t1,
            lon1 + (lon2 - lon1) * t1,
            GLOBE_RADIUS + 0.01
          );
          const p2 = latLonToGlobePoint(
            lat1 + (lat2 - lat1) * t2,
            lon1 + (lon2 - lon1) * t2,
            GLOBE_RADIUS + 0.01
          );
          allSegmentPoints.push(
            new THREE.Vector3(p1.x, p1.y, p1.z),
            new THREE.Vector3(p2.x, p2.y, p2.z)
          );
        }
      }
    });
    const mergedCoastGeo = new THREE.BufferGeometry().setFromPoints(allSegmentPoints);
    const mergedCoastLines = new THREE.LineSegments(mergedCoastGeo, continentLineMat);
    worldGlobeGroup.add(mergedCoastLines);
    continentLineDisposables.push(mergedCoastGeo);

    // 3D Gold Border Loop for Sovereign Ghana on the Globe
    const ghanaBorderVecs = GHANA_GLOBE_HIGHLIGHT_LON_LAT.map(([lon, lat]) => {
      const p = latLonToGlobePoint(lat, lon, GLOBE_RADIUS + 0.014);
      return new THREE.Vector3(p.x, p.y, p.z);
    });
    const ghanaBorderGeo = new THREE.BufferGeometry().setFromPoints(ghanaBorderVecs);
    const ghanaBorderMat = new THREE.LineBasicMaterial({ color: 0xf5b700 });
    const ghanaBorderLoop = new THREE.LineLoop(ghanaBorderGeo, ghanaBorderMat);
    worldGlobeGroup.add(ghanaBorderLoop);
    continentLineDisposables.push(ghanaBorderGeo, ghanaBorderMat);

    // Part 3: Ghana Sovereign Gold Beacon & Mini Shield Crest at (5.55°N, -0.20°W)
    const ghanaPt = latLonToGlobePoint(5.55, -0.2, GLOBE_RADIUS + 0.02);
    const ghanaBeaconGroup = new THREE.Group();
    ghanaBeaconGroup.position.set(ghanaPt.x, ghanaPt.y, ghanaPt.z);
    ghanaBeaconGroup.lookAt(ghanaPt.x * 2, ghanaPt.y * 2, ghanaPt.z * 2);

    const beaconRingGeo = new THREE.RingGeometry(0.09, 0.145, 24);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0xf5b700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    ghanaBeaconGroup.add(beaconRing);

    const beaconCoreGeo = new THREE.OctahedronGeometry(0.075, 0);
    const beaconGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b700,
      emissive: 0xf5b700,
      emissiveIntensity: 0.85,
      metalness: 0.92,
      roughness: 0.15,
    });
    const beaconCore = new THREE.Mesh(beaconCoreGeo, beaconGoldMat);
    beaconCore.position.z = 0.05;
    ghanaBeaconGroup.add(beaconCore);
    worldGlobeGroup.add(ghanaBeaconGroup);

    // Part 4: Global Cyber Relay Nodes Across World Continents + Intercontinental Arcs to Ghana
    const relayGeo = new THREE.SphereGeometry(0.038, 12, 12);
    const relayMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const arcDisposables: { dispose: () => void }[] = [];

    const ghanaVec = new THREE.Vector3(ghanaPt.x, ghanaPt.y, ghanaPt.z);

    GLOBAL_CYBER_RELAY_NODES.forEach((node) => {
      if (node.isGhana) return;
      const pt = latLonToGlobePoint(node.lat, node.lon, GLOBE_RADIUS + 0.016);
      const relayMesh = new THREE.Mesh(relayGeo, relayMat);
      relayMesh.position.set(pt.x, pt.y, pt.z);
      worldGlobeGroup.add(relayMesh);

      const targetVec = new THREE.Vector3(pt.x, pt.y, pt.z);
      const midVec = ghanaVec
        .clone()
        .add(targetVec)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(GLOBE_RADIUS + 0.38);

      const curve = new THREE.QuadraticBezierCurve3(ghanaVec, midVec, targetVec);
      const arcPoints = curve.getPoints(28);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.48,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      worldGlobeGroup.add(arcLine);
      arcDisposables.push(arcGeo, arcMat);
    });

    // Part 5 & 6: Secondary Read — Counter-Rotating Orbital Defense Rings Around the World Globe
    const ringCyanGeo = new THREE.TorusGeometry(1.96, 0.02, 16, 80);
    const ringCyanMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.55,
      metalness: 0.8,
      roughness: 0.2,
    });
    const ringCyan = new THREE.Mesh(ringCyanGeo, ringCyanMat);
    ringCyan.rotation.set(Math.PI / 2.7, 0.32, 0);
    rootGroup.add(ringCyan);

    const ringVioletGeo = new THREE.TorusGeometry(2.2, 0.016, 16, 80);
    const ringVioletMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.6,
      metalness: 0.65,
      roughness: 0.4,
    });
    const ringViolet = new THREE.Mesh(ringVioletGeo, ringVioletMat);
    ringViolet.rotation.set(-Math.PI / 3.0, -0.4, 0.2);
    rootGroup.add(ringViolet);

    const ringGoldGeo = new THREE.TorusGeometry(1.74, 0.012, 12, 72);
    const ringGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf5b700,
      emissive: 0xf5b700,
      emissiveIntensity: 0.45,
      metalness: 0.9,
      roughness: 0.2,
    });
    const ringGold = new THREE.Mesh(ringGoldGeo, ringGoldMat);
    ringGold.rotation.set(Math.PI / 2.1, -0.15, 0.1);
    rootGroup.add(ringGold);

    // Part 7: Accent Detail — InstancedMesh Orbiting Satellite Defense Nodes
    const isMobileViewport = window.innerWidth < 768;
    const nodeCount = isMobileViewport ? 28 : 48;
    const nodeGeo = new THREE.OctahedronGeometry(0.042, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.8,
    });
    const nodesInstanced = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);

    const dummyMat4 = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();
    const dummyColor = new THREE.Color();

    const nodeOrbits: {
      radius: number;
      angle: number;
      speed: number;
      yOffset: number;
      scale: number;
    }[] = [];
    const palette = [0x00f0ff, 0x7c3aed, 0xf5b700, 0xff1e8a];

    for (let i = 0; i < nodeCount; i++) {
      const radius = 1.72 + (i % 5) * 0.2;
      const angle = (i / nodeCount) * Math.PI * 2;
      const speed = 0.2 + (i % 4) * 0.07;
      const yOffset = ((i % 7) - 3) * 0.26;
      const scale = 0.85 + (i % 3) * 0.15;
      nodeOrbits.push({ radius, angle, speed, yOffset, scale });

      dummyPos.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius);
      dummyScale.setScalar(scale);
      dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
      nodesInstanced.setMatrixAt(i, dummyMat4);

      dummyColor.setHex(palette[i % palette.length]);
      nodesInstanced.setColorAt(i, dummyColor);
    }
    nodesInstanced.instanceMatrix.needsUpdate = true;
    if (nodesInstanced.instanceColor) nodesInstanced.instanceColor.needsUpdate = true;
    nodesInstanced.computeBoundingSphere();
    rootGroup.add(nodesInstanced);

    // Part 8: Contact Shadow Grounding Plane Beneath the World Globe
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
      grad.addColorStop(1, 'rgba(5, 8, 22, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 4.4),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.18;
    scene.add(shadowPlane);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer parallax / globe rotation control
    const targetPointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      targetPointer.x = THREE.MathUtils.clamp(nx, -1, 1);
      targetPointer.y = THREE.MathUtils.clamp(ny, -1, 1);
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 280);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let isInViewport = true;

    // Software WebGL fence-sync pacing helper
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
      if (!isInViewport) {
        frameId = window.setTimeout(tick, 250);
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      currentPointer.x = THREE.MathUtils.damp(currentPointer.x, targetPointer.x, 4, dt);
      currentPointer.y = THREE.MathUtils.damp(currentPointer.y, targetPointer.y, 4, dt);

      const selectedContinent = activeContinentRef.current;
      const preset = GLOBE_CONTINENT_PRESETS.find((p) => p.id === selectedContinent);

      if (!preset || preset.id === 'auto') {
        // Continuous 360° world globe rotation so all continents rotate into view
        const targetY = -0.15 + elapsed * 0.24 + currentPointer.x * 0.85;
        const targetX = 0.14 + currentPointer.y * 0.32;
        worldGlobeGroup.rotation.y = THREE.MathUtils.damp(
          worldGlobeGroup.rotation.y,
          targetY,
          5,
          dt
        );
        worldGlobeGroup.rotation.x = THREE.MathUtils.damp(
          worldGlobeGroup.rotation.x,
          targetX,
          5,
          dt
        );
      } else {
        // Smoothly rotate the 3D World Globe to focus on the chosen continent's map
        const targetY = preset.targetRotY + currentPointer.x * 0.45;
        const targetX = preset.targetRotX + currentPointer.y * 0.25;
        worldGlobeGroup.rotation.y = THREE.MathUtils.damp(
          worldGlobeGroup.rotation.y,
          targetY,
          5,
          dt
        );
        worldGlobeGroup.rotation.x = THREE.MathUtils.damp(
          worldGlobeGroup.rotation.x,
          targetX,
          5,
          dt
        );
      }

      beaconCore.rotation.z = elapsed * 1.8;
      beaconRing.scale.setScalar(1 + Math.sin(elapsed * 3.2) * 0.14);

      ringCyan.rotation.z = elapsed * 0.36;
      ringViolet.rotation.z = -elapsed * 0.28;
      ringGold.rotation.z = elapsed * 0.22;

      for (let i = 0; i < nodeCount; i++) {
        const o = nodeOrbits[i];
        const a = o.angle + elapsed * o.speed;
        dummyPos.set(
          Math.cos(a) * o.radius,
          o.yOffset + Math.sin(elapsed * 1.2 + i) * 0.08,
          Math.sin(a) * o.radius
        );
        dummyScale.setScalar(o.scale);
        dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
        nodesInstanced.setMatrixAt(i, dummyMat4);
      }
      nodesInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

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
      window.removeEventListener('resize', handleResize);
      globeGeo.dispose();
      globeMat.dispose();
      albedoMap.dispose();
      continentLineDisposables.forEach((d) => d.dispose());
      beaconRingGeo.dispose();
      beaconRingMat.dispose();
      beaconCoreGeo.dispose();
      beaconGoldMat.dispose();
      relayGeo.dispose();
      relayMat.dispose();
      arcDisposables.forEach((d) => d.dispose());
      ringCyanGeo.dispose();
      ringCyanMat.dispose();
      ringVioletGeo.dispose();
      ringVioletMat.dispose();
      ringGoldGeo.dispose();
      ringGoldMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, [forceStaticFallback, prefersReducedMotion, webglUnsupported]);

  if (forceStaticFallback || prefersReducedMotion || webglUnsupported) {
    return <StaticShieldFallback />;
  }

  return (
    <div className="relative h-[390px] w-full sm:h-[440px] lg:h-[470px]">
      <div
        ref={mountRef}
        data-testid="hero-3d-canvas-container"
        aria-label="Interactive 3D World Globe with maps of every continent and Ghana highlighted"
        role="img"
        className="h-full w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-[#081029]/70 to-[#050816]/90"
      />

      {/* Non-occluding Unified Bottom Dock: Continent Map Selector */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 rounded-xl border border-slate-800/90 bg-[#050816]/92 px-2.5 py-1.5 text-[10px] text-slate-300">
        <div
          role="group"
          aria-label="Inspect Continent Map on 3D Globe"
          className="flex flex-wrap items-center gap-1"
        >
          {GLOBE_CONTINENT_PRESETS.map((preset) => {
            const isSelected = activeContinentId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setActiveContinentId(preset.id)}
                className={`rounded-md px-1.5 py-1 font-mono text-[9.5px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <span className="hidden font-mono text-[10px] text-amber-300 2xl:inline whitespace-nowrap">
          Ghana · 5.55°N, 0.20°W
        </span>
      </div>
    </div>
  );
};
