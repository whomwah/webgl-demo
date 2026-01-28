import { Stats, CameraShake } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Butterfly } from "./threejs/butterfly";
import { GradientBackground } from "./threejs/GradientBackground";
import { Suspense } from "react";
import "./App.css";

import { Bloom, EffectComposer } from "@react-three/postprocessing";

function App() {
  return (
    <Canvas
      flat
      gl={{ antialias: false }}
      camera={{ position: [-135, -80, 210], rotation: [0.41, -0.5, -0.3] }}
      style={{ width: "100vw", height: "100vh" }}
    >
      <Scene />
    </Canvas>
  );
}

function Scene() {
  return (
    <>
      <Stats showPanel={0} />
      <GradientBackground />
      <Suspense fallback={null}>
        <Butterfly size={180} />
      </Suspense>
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.95}
          height={100}
        />
      </EffectComposer>
      <CameraShake
        maxYaw={0.03}
        maxPitch={0.05}
        maxRoll={0.04}
        yawFrequency={0.1}
        pitchFrequency={0.3}
        rollFrequency={0.2}
      />
    </>
  );
}

export default App;
