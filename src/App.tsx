import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Butterfly } from './threejs/butterfly';
import './App.css'

function App() {
  function Scene() {
    return <Butterfly size={200} />;
  }

  return (
    <div className="iphone-container">
      <h4>28x WebGl Demo</h4>
      <Canvas
        flat
        gl={{ antialias: false }}
        camera={{ position: [150, 160, 200] }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App
