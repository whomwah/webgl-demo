attribute vec3 position; // Vertex position in 3D space
attribute vec2 uv;       // Texture coordinates

// Standard matrices for 3D transformations
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform float index;      // Butterfly instance identifier
uniform float time;       // Animation time
uniform float size;       // Butterfly size scaling
uniform float speed;      // Animation speed
uniform float wingFlapAng; // Minimum wing flap angle
uniform float decayStart;  // Time when decay starts
uniform float decayRate;   // Rate of flapping decay (0-1)
uniform float restAngle;   // Final rest angle after decay

// Values passed to fragment shader
varying vec3 vPosition;
varying vec2 vUv;
varying float vOpacity;

void main() {
  // Base flap calculation with consistent phase for all vertices
  float phase = time * speed + index * 2.0;
  float baseFlap = sin(phase - length(position.xy) / size * 2.0);

  // Calculate elapsed time since decay trigger
  float elapsedTime = max(0.0, time - decayStart);

  // Standard decay factor (1.0 → 0.0)
  float decayFactor = exp(-decayRate * elapsedTime);

  // Apply decay directly without the angle check
  // This eliminates the glitches from conditional decay
  float currentSpeed = speed * decayFactor;

  // Wing oscillation with smooth decay
  float flapPhase = time * currentSpeed + index * 2.0;
  float flapBase = sin(flapPhase - length(position.xy) / size * 2.0);

  // Linear interpolation between active and rest angles
  float minAngle = mix(restAngle, wingFlapAng, decayFactor);
  float maxAngle = 90.0;
  float range = maxAngle - minAngle;

  // Calculate final flap angle with reduced amplitude as decay progresses
  float flapAngle = minAngle + range * (flapBase * 0.5 + 0.5) * decayFactor;

  // Convert to radians for trig functions
  float flapTime = radians(flapAngle);

  // Decay completion check
  float isDecayComplete = step(decayFactor, 0.01);

  // Hovering motion with smooth stop
  float hoverScale = decayFactor * (1.0 - isDecayComplete);
  float hovering = cos(time * 2.0 + index * 3.0) * size / 32.0 * hoverScale;

  // Final vertex position
  vec3 updatePosition = vec3(cos(flapTime) * position.x, position.y + hovering, sin(flapTime) * abs(position.x) + hovering);

  // Pass values to fragment shader
  vPosition = position;
  vUv = uv;
  vOpacity = (1.0 - smoothstep(0.75, 1.0, abs((modelMatrix * vec4(updatePosition, 1.0)).z) / 900.0)) * 0.85;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix *
    vec4(updatePosition, 1.0);
}
