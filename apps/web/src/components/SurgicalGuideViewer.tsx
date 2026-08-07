import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

type SurgicalGuideViewerProps = {
  className?: string;
  autoRotate?: boolean;
};

/** Horseshoe path for a maxillary surgical guide plate. */
function buildArchCurve() {
  const pts: THREE.Vector3[] = [];
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI;
    const x = Math.cos(t) * 1.55;
    const z = Math.sin(t) * 1.05 - 0.15;
    pts.push(new THREE.Vector3(x, 0, z));
  }
  return new THREE.CatmullRomCurve3(pts);
}

function GuideBody() {
  const geometry = useMemo(() => {
    const curve = buildArchCurve();
    const shape = new THREE.Shape();
    shape.moveTo(-0.22, -0.06);
    shape.lineTo(0.22, -0.06);
    shape.quadraticCurveTo(0.28, -0.06, 0.28, 0);
    shape.lineTo(0.28, 0.12);
    shape.quadraticCurveTo(0.28, 0.18, 0.22, 0.18);
    shape.lineTo(-0.22, 0.18);
    shape.quadraticCurveTo(-0.28, 0.18, -0.28, 0.12);
    shape.lineTo(-0.28, 0);
    shape.quadraticCurveTo(-0.28, -0.06, -0.22, -0.06);

    return new THREE.ExtrudeGeometry(shape, {
      steps: 64,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 3,
      extrudePath: curve,
    });
  }, []);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial
        color="#5ec8de"
        roughness={0.22}
        metalness={0.05}
        transmission={0.42}
        thickness={0.55}
        ior={1.45}
        transparent
        opacity={0.92}
        clearcoat={0.65}
        clearcoatRoughness={0.2}
        attenuationColor="#1fb6d1"
        attenuationDistance={0.8}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

function DrillSleeves() {
  const sleeves = useMemo(() => {
    const curve = buildArchCurve();
    const ts = [0.18, 0.32, 0.68, 0.82];
    return ts.map((t) => {
      const p = curve.getPoint(t);
      const outward = new THREE.Vector3(p.x, 0, p.z).normalize();
      const tilt = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(outward.x * 0.12, 1, outward.z * 0.12).normalize(),
      );
      return {
        position: [p.x, 0.22, p.z] as [number, number, number],
        quaternion: tilt,
        key: t,
      };
    });
  }, []);

  return (
    <group>
      {sleeves.map((s) => (
        <group key={s.key} position={s.position} quaternion={s.quaternion}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.28, 32]} />
            <meshStandardMaterial
              color="#c5ced8"
              metalness={0.92}
              roughness={0.18}
              envMapIntensity={1.4}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.065, 0.065, 0.3, 24]} />
            <meshStandardMaterial color="#1a2433" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <torusGeometry args={[0.11, 0.018, 12, 32]} />
            <meshStandardMaterial color="#e8eef4" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RidgeBase() {
  const geometry = useMemo(() => {
    const curve = buildArchCurve();
    const shape = new THREE.Shape();
    shape.moveTo(-0.38, -0.04);
    shape.lineTo(0.38, -0.04);
    shape.lineTo(0.38, 0.05);
    shape.lineTo(-0.38, 0.05);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {
      steps: 48,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 2,
      extrudePath: curve,
    });
  }, []);

  return (
    <mesh geometry={geometry} position={[0, -0.12, 0]} receiveShadow>
      <meshStandardMaterial color="#e8a090" roughness={0.75} metalness={0.02} />
    </mesh>
  );
}

function SurgicalGuideAssembly() {
  return (
    <Float speed={1.1} rotationIntensity={0.06} floatIntensity={0.16}>
      <group rotation={[-0.35, 0.35, 0.05]} scale={1.15}>
        <RidgeBase />
        <GuideBody />
        <DrillSleeves />
      </group>
    </Float>
  );
}

export function SurgicalGuideViewer({
  className = '',
  autoRotate = true,
}: SurgicalGuideViewerProps) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.6, 3.8], fov: 38, near: 0.1, far: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#0b1528']} />
        <fog attach="fog" args={['#0b1528', 8, 16]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          castShadow
          position={[4, 6, 3]}
          intensity={1.35}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.45} color="#9ad8e8" />
        <spotLight position={[0, 5, 2]} angle={0.4} penumbra={0.6} intensity={0.55} />
        <Suspense fallback={null}>
          <Environment preset="city" environmentIntensity={0.55} />
          <SurgicalGuideAssembly />
          <ContactShadows
            position={[0, -1.05, 0]}
            opacity={0.45}
            scale={8}
            blur={2.4}
            far={3}
            color="#04101c"
          />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={2.2}
          maxDistance={7}
          minPolarAngle={0.35}
          maxPolarAngle={Math.PI / 1.85}
          target={[0, 0.05, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={0.55}
        />
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex justify-center sm:justify-start">
        <span className="rounded-full bg-black/35 px-3 py-1 text-[10px] font-semibold tracking-wide text-white/80 backdrop-blur-sm">
          360° · Zoom · Pan
        </span>
      </div>
    </div>
  );
}
