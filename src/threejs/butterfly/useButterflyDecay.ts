import { useRef, useState, useEffect } from "react";

// Constants
const WING_SPEED = 30.0;

interface ButterflyDecayConfig {
  autoPokeDelay?: number; // Base delay before auto-poke in seconds
  minSpeedMultiplier?: number; // Minimum speed as fraction of full speed (e.g., 0.1 = 10%)
  rampUpDuration?: number; // Seconds to reach full speed after poke (default 0.3s)
  decayRate?: number; // Rate of flapping decay (0-1)
}

interface ButterflyDecayUniforms {
  time: { type: string; value: number };
  speed: { type: string; value: number };
  wingFlapAng: { type: string; value: number };
  decayStart: { type: string; value: number };
  decayRate: { type: string; value: number };
  minSpeedMultiplier: { type: string; value: number };
  rampUpProgress: { type: string; value: number };
}

export interface ButterflyDecayReturn {
  triggerDecay: () => void;
  pokeButterfly: () => void;
  updateFrame: (delta: number) => void;
  uniforms: ButterflyDecayUniforms;
}

/**
 * Custom hook for managing butterfly wing decay and auto-poke behavior
 * Handles all decay state, timing, and auto-poke scheduling
 */
export function useButterflyDecay(config: ButterflyDecayConfig = {}): ButterflyDecayReturn {
  const {
    autoPokeDelay = 0.5,
    minSpeedMultiplier = 0.1,
    rampUpDuration = 0.3,
    decayRate = 0.2,
  } = config;

  // State management
  const [decayTriggered, setDecayTriggered] = useState(false);
  const [wasFullyDecayed, setWasFullyDecayed] = useState(false);

  // Refs for persistent values
  const timeBaseRef = useRef(0);
  const debugCounterRef = useRef(0);
  const lastLogTimeRef = useRef(0);
  const autoPokeTimeoutRef = useRef<number | null>(null);
  const rampUpStartTimeRef = useRef(0);
  const rampUpDurationRef = useRef(rampUpDuration);

  // Update rampUpDuration ref when config changes
  useEffect(() => {
    rampUpDurationRef.current = rampUpDuration;
  }, [rampUpDuration]);

  // Uniforms for shader
  const uniformsRef = useRef<ButterflyDecayUniforms>({
    time: { type: "f", value: 0 },
    speed: { type: "f", value: WING_SPEED },
    wingFlapAng: { type: "f", value: 5.0 },
    decayStart: { type: "f", value: 9999999 },
    decayRate: { type: "f", value: decayRate },
    minSpeedMultiplier: { type: "f", value: minSpeedMultiplier },
    rampUpProgress: { type: "f", value: 1.0 },
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
  const triggerDecay = () => {
    // First reset any ongoing decay
    resetDecayState();

    // Then trigger new decay
    setDecayTriggered(true);
    uniformsRef.current.decayStart.value = uniformsRef.current.time.value;

    // Reset ramp-up progress and start time
    uniformsRef.current.rampUpProgress.value = 0.0;
    rampUpStartTimeRef.current = uniformsRef.current.time.value;
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

  /**
   * Poke the butterfly with random wing angle
   */
  const pokeButterfly = () => {
    // Generate random wing flap angle between 1-70 degrees
    const randomWingAngle = Math.random() * 69 + 1;

    // Update the uniform
    uniformsRef.current.wingFlapAng.value = randomWingAngle;

    // Log poke cycle and wing data
    debugCounterRef.current += 1;
    console.log(
      `[Poke #${debugCounterRef.current}] Wing angle: ${randomWingAngle.toFixed(2)}, Speed: ${uniformsRef.current.speed.value.toFixed(2)}`,
    );

    triggerDecay();
  };

  /**
   * Update frame - called from useFrame
   */
  const updateFrame = (delta: number) => {
    // Always increment time - wings never fully stop
    uniformsRef.current.time.value += delta;

    const elapsedTime =
      uniformsRef.current.time.value - uniformsRef.current.decayStart.value;
    
    // Check if decay has reached threshold (near minimum speed)
    const decayThreshold = 10 / decayRate;
    const nearMinimumSpeed = elapsedTime > decayThreshold && decayTriggered;

    // Animate ramp-up progress
    const rampUpElapsed = uniformsRef.current.time.value - rampUpStartTimeRef.current;
    if (rampUpElapsed < rampUpDurationRef.current) {
      uniformsRef.current.rampUpProgress.value = Math.min(1.0, rampUpElapsed / rampUpDurationRef.current);
    } else {
      uniformsRef.current.rampUpProgress.value = 1.0;
    }

    // Schedule auto-poke when butterfly reaches minimum speed
    if (nearMinimumSpeed && !wasFullyDecayed) {
      setWasFullyDecayed(true);
      console.log(
        `[Decay Complete] Time: ${uniformsRef.current.time.value.toFixed(2)}, TimeBase: ${timeBaseRef.current.toFixed(2)}`,
      );
      scheduleAutoPoke();
    } else if (!nearMinimumSpeed && wasFullyDecayed) {
      // Reset the state tracking when butterfly becomes active again
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
        `[Status] Time: ${uniformsRef.current.time.value.toFixed(2)}, Speed: ${uniformsRef.current.speed.value.toFixed(2)}, Decaying: ${decayTriggered}, ElapsedTime: ${elapsedTime.toFixed(2)}, RampUp: ${uniformsRef.current.rampUpProgress.value.toFixed(2)}`,
      );
    }
  };

  // Clean up timeout when unmounting
  useEffect(() => {
    return () => {
      if (autoPokeTimeoutRef.current) {
        clearTimeout(autoPokeTimeoutRef.current);
      }
    };
  }, []);

  return {
    triggerDecay,
    pokeButterfly,
    updateFrame,
    uniforms: uniformsRef.current,
  };
}
