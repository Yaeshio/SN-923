'use client';

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';
import { useState, useEffect, Suspense } from 'react';
import { STLLoader } from 'three-stdlib';

function STLModel({ url }: { url: string }) {
    // URLが空の場合のガード
    if (!url) return null;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const geom = useLoader(STLLoader, url);
    return (
        <mesh geometry={geom}>
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