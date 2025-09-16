import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useFaceLandmarks } from "@/hooks/useFaceLandmarks";

export const Fabric: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const landmarks = useFaceLandmarks();

  useFrame(() => {
    if (!landmarks || !meshRef.current) return;

    const geom = meshRef.current.geometry as THREE.PlaneGeometry;
    const pos = geom.attributes.position as THREE.BufferAttribute;

    // Reset fabric back to flat
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, 0);
    }

    // Push fabric where landmarks hit
    for (const lm of landmarks) {
      // Map MediaPipe [0,1] → plane [-1,1]
      const x = (lm.x - 0.5) * 2;
      const y = -(lm.y - 0.5) * 2; // invert Y
      const z = lm.z * 0.5; // scale depth

      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);

        const dist = Math.hypot(vx - x, vy - y);
        if (dist < 0.15) {
          const influence = Math.cos((dist / 0.15) * Math.PI) * z;
          pos.setZ(i, pos.getZ(i) - influence * 0.3);
        }
      }
    }

    pos.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[2, 2, 100, 100]} />
      <meshStandardMaterial
        color="#e0e0e0"
        roughness={1}
        metalness={0}
        side={THREE.DoubleSide}
        wireframe
      />
    </mesh>
  );
};
