precision highp float;

varying vec2 vUv;

// Gradient colors - teal center fading to dark edges
uniform vec3 uColorCenter; // Deep teal
uniform vec3 uColorEdge; // Dark blue-black

void main() {
  // Calculate distance from center (0.5, 0.5)
  vec2 center = vec2(0.5);
  float dist = distance(vUv, center);

  // Create smooth radial gradient with slight bias toward center
  // Adjust the multiplier to control gradient spread
  float gradient = smoothstep(0.0, 1.0, dist * 1.4);

  // Mix colors based on gradient
  vec3 color = mix(uColorCenter, uColorEdge, gradient);

  gl_FragColor = vec4(color, 1.0);
}
