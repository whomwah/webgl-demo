import React, { useRef, forwardRef, useState, useEffect, useMemo } from "react";
import { useControls, button } from "leva";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader, NearestFilter, Texture, DoubleSide, Mesh } from "three";
import fragmentShader from "../../glsl/butterfly.frag";
import vertexShader from "../../glsl/butterfly.vert";

// Constants
const WING_SPEED = 30.0;
const DECAY_RATE = 0.2;

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
  const [decayTriggered, setDecayTriggered] = useState(false);
  // Remove the initialTime state that's causing accumulation
  const timeBaseRef = useRef(0);
  const [wasFullyDecayed, setWasFullyDecayed] = useState(false);
  const triggerDecayRef = useRef<() => void>(() => {});

  // Add debug counter to track poke cycles
  const debugCounterRef = useRef(0);
  // Add last logged time for rate limiting
  const lastLogTimeRef = useRef(0);

  // Auto-poke timeout ref
  const autoPokeTimeoutRef = useRef<number | null>(null);

  // Default to 0.5 seconds if not provided
  const autoPokeDelay = props.autoPokeDelay ?? 0.5;

  const uniformsRef = React.useRef({
    index: { type: "f", value: 0 },
    time: { type: "f", value: 0 },
    speed: { type: "f", value: WING_SPEED },
    size: { type: "f", value: props.size },
    texture: { type: "t", value: null as unknown as Texture },
    colorH: { type: "f", value: 0.63 },
    wingFlapAng: { type: "f", value: 5.0 },
    decayStart: { type: "f", value: 9999999 },
    decayRate: { type: "f", value: DECAY_RATE },
    restAngle: { type: "f", value: 10.0 },
  });

  /**
   * Reset decay state and capture current time for reference
   */
  const resetDecayState = () => {
    setDecayTriggered(false);
    // Keep only the phase information, discard accumulated time
    const currentPhase = uniformsRef.current.time.value % (Math.PI * 2);

    console.log(
      `[Reset] Time: ${uniformsRef.current.time.value.toFixed(2)}, Phase: ${currentPhase.toFixed(2)}`,
    );

    // Reset time to a small base value plus just the phase
    timeBaseRef.current = currentPhase;
    uniformsRef.current.time.value = currentPhase;
    uniformsRef.current.decayStart.value = 9999999; // Far future
  };

  /**
   * Trigger decay animation
   */
  const handleTriggerDecay = () => {
    // First reset any ongoing decay
    resetDecayState();

    // Then trigger new decay
    setDecayTriggered(true);
    uniformsRef.current.decayStart.value = uniformsRef.current.time.value;
  };

  /**
   * Schedule next auto-poke with randomization
   */
  const scheduleAutoPoke = () => {
    // Clear any existing timeout
    if (autoPokeTimeoutRef.current) {
      clearTimeout(autoPokeTimeoutRef.current);
    }

    // Add randomization (±30% of delay)
    const randomFactor = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3
    const randomizedDelay = autoPokeDelay * randomFactor * 1000; // Convert to ms

    autoPokeTimeoutRef.current = setTimeout(() => {
      pokeButterfly();
    }, randomizedDelay);
  };

  const pokeButterfly = () => {
    // Generate random wing flap angle between 1-70 degrees
    const randomWingAngle = Math.random() * 69 + 1;

    // Update both the uniform and the control
    uniformsRef.current.wingFlapAng.value = randomWingAngle;

    // Log poke cycle and wing data
    debugCounterRef.current += 1;
    console.log(
      `[Poke #${debugCounterRef.current}] Wing angle: ${randomWingAngle.toFixed(2)}, Speed: ${uniformsRef.current.speed.value.toFixed(2)}`,
    );

    handleTriggerDecay();
  };

  // Store trigger function in ref for use in useEffect
  triggerDecayRef.current = handleTriggerDecay;

  // Clean up timeout when unmounting
  useEffect(() => {
    return () => {
      if (autoPokeTimeoutRef.current) {
        clearTimeout(autoPokeTimeoutRef.current);
      }
    };
  }, []);

  const { bColour } = useControls("Butterfly", {
    bColour: {
      value: uniformsRef.current.colorH.value,
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
    poke: button(() => pokeButterfly()),
  });

  // Auto-trigger decay after 2 seconds on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerDecayRef.current();
    }, 2000);

    return () => clearTimeout(timer);
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
    uniformsRef.current.size.value = props.size;
  }, [props.size]);

  useFrame((_state, delta) => {
    const elapsedTime =
      uniformsRef.current.time.value - uniformsRef.current.decayStart.value;
    const fullyDecayed = elapsedTime > 10 / DECAY_RATE && decayTriggered;

    // Only increment time when not fully decayed
    if (!fullyDecayed) {
      uniformsRef.current.time.value += delta;
    }

    // Check if butterfly just entered fully decayed state
    if (fullyDecayed && !wasFullyDecayed) {
      setWasFullyDecayed(true);
      console.log(
        `[Decay Complete] Time: ${uniformsRef.current.time.value.toFixed(2)}, TimeBase: ${timeBaseRef.current.toFixed(2)}`,
      );
      scheduleAutoPoke();
    } else if (!fullyDecayed && wasFullyDecayed) {
      // Reset the fully decayed state tracking
      setWasFullyDecayed(false);
      // Clear any scheduled auto-poke when butterfly is active again
      if (autoPokeTimeoutRef.current) {
        clearTimeout(autoPokeTimeoutRef.current);
        autoPokeTimeoutRef.current = null;
      }
    }

    // Log key values every second to avoid console spam
    const now = Date.now();
    if (now - lastLogTimeRef.current > 1000) {
      lastLogTimeRef.current = now;
      console.log(
        `[Status] Time: ${uniformsRef.current.time.value.toFixed(2)}, Speed: ${uniformsRef.current.speed.value.toFixed(2)}, Decaying: ${decayTriggered}, ElapsedTime: ${elapsedTime.toFixed(2)}`,
      );
    }

    // Update shader uniforms
    uniformsRef.current.colorH.value = bColour;
    // uniformsRef.current.speed.value = WING_SPEED;
    // uniformsRef.current.decayRate.value = DECAY_RATE;
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
