import { useRef, forwardRef, useEffect, useMemo } from "react";
import { useControls, button } from "leva";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, NearestFilter, Texture, DoubleSide, Mesh } from "three";
import { useButterflyDecay } from "./useButterflyDecay";
import fragmentShader from "../../glsl/butterfly.frag";
import vertexShader from "../../glsl/butterfly.vert";

/**
 * Maps butterfly type to texture path for dynamic loading
 * @param {number} type - Butterfly type (1-6)
 * @returns {string} Path to texture file
 */
const getTexturePath = (type: number): string => {
  return `/textures/butterfly${type}.png`;
};

interface ButterflyProps {
  size: number;
  autoPokeDelay?: number; // Base delay before auto-poke in seconds
}

export const Butterfly = forwardRef<Mesh, ButterflyProps>((props, ref) => {
  const meshRef = useRef<Mesh>(null!);
  const actualRef = ref || meshRef;

  // Use the decay hook
  const decay = useButterflyDecay({
    autoPokeDelay: props.autoPokeDelay ?? 0.5,
  });

  // Component-specific uniforms (not managed by hook)
  const componentUniforms = useRef({
    index: { type: "f", value: 0 },
    size: { type: "f", value: props.size },
    texture: { type: "t", value: null as unknown as Texture },
    colorH: { type: "f", value: 0.63 },
    restAngle: { type: "f", value: 10.0 },
  });

  // Merge hook uniforms with component uniforms
  const uniformsRef = useRef({
    ...componentUniforms.current,
    ...decay.uniforms,
  });

  const { bColour } = useControls("Butterfly", {
    bColour: {
      value: componentUniforms.current.colorH.value,
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
    poke: button(() => decay.pokeButterfly()),
  });

  // Auto-trigger decay after 2 seconds on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      decay.triggerDecay();
    }, 2000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load only the selected texture on demand
  const texturePath = useMemo(() => getTexturePath(0), []);
  const texture = useLoader(TextureLoader, texturePath) as Texture;

  // Update texture in uniforms after it loads
  useEffect(() => {
    if (texture) {
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      uniformsRef.current.texture.value = texture;
    }
  }, [texture]);

  // Update size when it changes
  useEffect(() => {
    componentUniforms.current.size.value = props.size;
    uniformsRef.current.size.value = props.size;
  }, [props.size]);

  useFrame((_state, delta) => {
    // Update decay logic via hook
    decay.updateFrame(delta);

    // Update color uniform
    componentUniforms.current.colorH.value = bColour;
    uniformsRef.current.colorH.value = bColour;
  });

  return (
    <mesh ref={actualRef} position={[0, 0, 0]}>
      <planeGeometry args={[props.size, props.size / 2, 24, 10]} />
      <rawShaderMaterial
        uniforms={uniformsRef.current}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={DoubleSide}
        transparent
      />
    </mesh>
  );
});

Butterfly.displayName = "Butterfly";
