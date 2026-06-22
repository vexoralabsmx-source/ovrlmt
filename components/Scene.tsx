"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";

function Sculpture() {
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * .09;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * .25) * .08;
  });
  return <group ref={group} rotation={[.35, -.5, -.15]}>
    <Float speed={1.2} rotationIntensity={.15} floatIntensity={.35}>
      <mesh><torusGeometry args={[1.55, .16, 20, 120]} /><meshStandardMaterial color="#090909" metalness={.96} roughness={.18} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, .55]}><torusGeometry args={[1.1, .055, 12, 100]} /><meshStandardMaterial color="#C1121F" emissive="#650008" emissiveIntensity={2} metalness={.6} roughness={.22} /></mesh>
      <mesh rotation={[0.2, -.35, 0]}><boxGeometry args={[2.25, .08, .72]} /><MeshTransmissionMaterial color="#BFC5CC" thickness={.3} roughness={.2} transmission={.38} metalness={.9} /></mesh>
    </Float>
  </group>;
}

export function Scene() {
  return <div className="scene" aria-hidden="true"><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 5.5], fov: 42 }} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={.7} /><spotLight position={[4, 5, 5]} intensity={20} angle={.3} color="#dce2e8" /><pointLight position={[-3, -1, 2]} intensity={14} color="#C1121F" />
    <Sculpture />
  </Canvas></div>;
}
