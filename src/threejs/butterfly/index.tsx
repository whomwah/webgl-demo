import React, { useRef } from "react";
import { useControls } from "leva";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, NearestFilter, Texture, DoubleSide, Mesh } from "three";
import { customFragmentShader, customVertexShader } from "../butterfly/shaders";

import butterflyTexture from "./textures/butterfly1.png";

interface ButterflyProps {
  size: number;
}

export function Butterfly(props: ButterflyProps) {
  const ref = useRef<Mesh>(null!);
  const uniformsRef = React.useRef({
    index: { type: "f", value: 0 },
    time: { type: "f", value: 0 },
    speed: { type: "f", value: 4.0 },
    size: { type: "f", value: props.size },
    texture: { type: "t", value: null as unknown as Texture },
    colorH: { type: "f", value: 0.5 },
  });

  const { bColour } = useControls({
    bColour: {
      value: 0.5,
      min: 0.5,
      max: 1.0,
      step: 0.1,
    },
  });

  const texture = useLoader(TextureLoader, butterflyTexture) as Texture;

  // Update texture in uniforms after it loads
  React.useMemo(() => {
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    uniformsRef.current.texture.value = texture;
    return texture;
  }, [texture]);

  // Update size prop when it changes
  React.useEffect(() => {
    uniformsRef.current.size.value = props.size;
  }, [props.size]);

  useFrame((_state, delta) => {
    // Update time and color uniforms in animation frame
    uniformsRef.current.time.value += delta;
    uniformsRef.current.colorH.value = bColour;
  });

  return (
    <mesh
      ref={ref}
      position-x={-15}
      position-y={0}
      rotation-x={(-45 * Math.PI) / 180}
      rotation-y={0}
      rotation-z={0}
    >
      <planeGeometry
        // SIZE: overall width, SIZE/2: overall height,
        // 24: segments along width (increased detail),
        // 10: segments along height (affects vertical smoothness)
        args={[props.size, props.size / 2, 24, 10]}
      />
      <rawShaderMaterial
        uniforms={uniformsRef.current} // Custom uniforms for shader effects
        vertexShader={customVertexShader} // Custom vertex processing
        fragmentShader={customFragmentShader} // Custom fragment processing
        side={DoubleSide} // Render both sides of the plane
        transparent // Allows transparency rendering
      />
    </mesh>
  );
}
