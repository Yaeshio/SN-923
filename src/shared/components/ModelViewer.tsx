'use client';

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { useState, useEffect, Suspense } from 'react';
import { STLLoader } from 'three-stdlib';

function STLModel({ url }: { url: string }) {
    if (!url) return null;

    const geom = useLoader(STLLoader, url);

    return (
        /* rotation: [x, y, z] 
           Math.PI / 2 は 90度です。
           CADのZ上をThree.jsのY上に合わせるため、X軸を軸にマイナス90度回転させます。
        */
        <mesh
            geometry={geom}
            rotation={[-Math.PI / 2, 0, 0]}
        >
            <meshStandardMaterial color="#3b82f6" />
        </mesh>
    );
}

export function ModelViewer({ url }: { url: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-full h-[400px] bg-gray-900 rounded-lg" />;
    }

    return (
        <div className="w-full h-[400px] bg-gray-900 rounded-lg">
            <Canvas shadows camera={{ position: [0, 0, 20], fov: 50 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.5}>
                        <STLModel url={url} />
                    </Stage>
                </Suspense>
                <OrbitControls autoRotate />
            </Canvas>
        </div>
    );
}