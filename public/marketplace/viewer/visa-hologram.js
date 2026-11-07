// Adapted from the owner's Holo Card: foil follows the viewing angle of the printed face.
// The existing model owns geometry, artwork, rotation, alpha clipping and color management.
const vertexDeclarations = /* glsl */ `
uniform vec2 visaFoilMin;
uniform vec2 visaFoilSize;
varying vec2 vVisaFoilUv;
varying vec3 vVisaFoilView;
`;

const vertexProjection = /* glsl */ `
float visaSide = normal.z < 0.0 ? -1.0 : 1.0;
vec2 visaUv = (position.xy - visaFoilMin) / visaFoilSize;
vVisaFoilUv = vec2(visaSide < 0.0 ? 1.0 - visaUv.x : visaUv.x, 1.0 - visaUv.y);
vec3 visaEye = normalize(-mvPosition.xyz);
vVisaFoilView = vec3(
  dot(visaEye, normalize(modelViewMatrix[0].xyz)) * visaSide,
  -dot(visaEye, normalize(modelViewMatrix[1].xyz)),
  dot(visaEye, normalize(modelViewMatrix[2].xyz)) * visaSide
);
`;

const fragmentDeclarations = /* glsl */ `
uniform vec2 visaFoilSize;
varying vec2 vVisaFoilUv;
varying vec3 vVisaFoilView;

float visaHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 visaSpectrum(float phase) {
  return 0.66 + 0.25 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.67)));
}

vec3 visaFoil(vec3 printed, vec2 uv, vec3 view) {
  vec2 p = (uv - vec2(0.5, 0.46)) * vec2(visaFoilSize.x / visaFoilSize.y, 1.0);
  // Periodic angular ruling avoids a seam where atan wraps from +pi to -pi.
  float grating = sin(atan(p.y, p.x) * 3.0) + length(p) * 6.0;
  float phase = uv.x * 0.85 + uv.y * 0.55 + view.x * 1.5 - view.y * 0.9
    + grating * 0.22;
  vec3 foil = visaSpectrum(phase);
  float band = pow(0.5 + 0.5 * sin(
    (uv.x * 0.72 + uv.y * 0.45 + view.x * 1.2 + view.y * 0.6) * 6.2831853
  ), 10.0);
  float luminance = dot(printed, vec3(0.2126, 0.7152, 0.0722));
  // Keep the dark visa lettering crisp while the laminate catches light above it.
  float ink = smoothstep(0.025, 0.15, luminance);
  vec3 color = printed * (1.0 - 0.21 * (1.0 - foil) * (0.2 + band * 0.8));
  color += foil * band * (0.065 + 0.11 * (1.0 - luminance)) * ink;

  float edge = 1.0 - smoothstep(0.015, 0.06,
    min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  color = mix(color, foil * 0.75 + 0.21, edge * 0.3 * ink);

  vec2 cell = floor(uv * vec2(480.0, 720.0));
  float flake = step(0.994, visaHash(cell)) * pow(
    0.5 + 0.5 * sin(visaHash(cell + 8.0) * 30.0 + view.x * 20.0 - view.y * 12.0),
    10.0
  );
  // No time uniform: stationary and reduced-motion previews hold the foil still.
  color += foil * flake * 0.13 * ink;
  return max(color, vec3(0.0));
}
`;

export function applyVisaHologram(model) {
  const materials = new Set();
  model.traverse((object) => {
    if (!object.isMesh || !object.geometry.getAttribute("normal")) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!material.isMeshBasicMaterial || !material.map || materials.has(material)) continue;
      object.geometry.computeBoundingBox();
      const bounds = object.geometry.boundingBox;
      const size = { x: bounds.max.x - bounds.min.x, y: bounds.max.y - bounds.min.y };
      if (!(size.x > 0 && size.y > 0)) continue;

      const previousCompile = material.onBeforeCompile;
      const previousKey = material.customProgramCacheKey();
      material.onBeforeCompile = (shader, renderer) => {
        previousCompile.call(material, shader, renderer);
        shader.uniforms.visaFoilMin = { value: { x: bounds.min.x, y: bounds.min.y } };
        shader.uniforms.visaFoilSize = { value: size };
        shader.vertexShader =
          vertexDeclarations +
          shader.vertexShader.replace(
            "#include <project_vertex>",
            `#include <project_vertex>\n${vertexProjection}`,
          );
        shader.fragmentShader =
          fragmentDeclarations +
          shader.fragmentShader.replace(
            "#include <opaque_fragment>",
            "outgoingLight = visaFoil(outgoingLight, vVisaFoilUv, normalize(vVisaFoilView));\n#include <opaque_fragment>",
          );
      };
      material.customProgramCacheKey = () => `${previousKey}|moon-visa-foil-v1`;
      material.needsUpdate = true;
      materials.add(material);
    }
  });
  return materials.size;
}
