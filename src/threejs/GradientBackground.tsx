import { useMemo } from "react";
import { ShaderMaterial, Color } from "three";
import vertexShader from "../glsl/gradient-bg.vert";
import fragmentShader from "../glsl/gradient-bg.frag";

// Deep teal center - complements the orange butterfly
const COLOR_CENTER = "#1a3a4a";
// Dark blue-black edges for vignette effect
const COLOR_EDGE = "#0a1418";

export function GradientBackground() {
  const shaderMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColorCenter: { value: new Color(COLOR_CENTER) },
        uColorEdge: { value: new Color(COLOR_EDGE) },
      },
      depthWrite: false,
    });
  }, []);

  return (
    <mesh renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}
