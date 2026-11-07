import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Both faces repeat the supplied artwork; the reverse is presentation geometry, not a scan.
const directory = path.resolve("public/marketplace/to-the-moon-visa");
const png = await readFile(path.join(directory, "visa-cutout.png"));
const { width, height, visibleBounds } = JSON.parse(
  await readFile(path.join(directory, "asset-metrics.json"), "utf8"),
);
const [left, top, right, bottom] = visibleBounds;
if (
  png.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
  png.readUInt32BE(16) !== width ||
  png.readUInt32BE(20) !== height ||
  !(right > left && bottom > top && left >= 0 && top >= 0 && right <= width && bottom <= height)
) {
  throw new Error("Visa texture bounds do not match the PNG");
}
const cardWidth = (right - left) / (bottom - top);
const cardHeight = 1;
const depth = 0.012;
const radius = Math.min(cardWidth, cardHeight) * 0.025;
const outline = [];
for (const [cx, cy, start] of [
  [cardWidth / 2 - radius, cardHeight / 2 - radius, 0],
  [-cardWidth / 2 + radius, cardHeight / 2 - radius, Math.PI / 2],
  [-cardWidth / 2 + radius, -cardHeight / 2 + radius, Math.PI],
  [cardWidth / 2 - radius, -cardHeight / 2 + radius, (3 * Math.PI) / 2],
]) {
  for (let step = 0; step <= 8; step++) {
    const angle = start + (step * Math.PI) / 16;
    outline.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
}
const positions = [];
const normals = [];
const uvs = [];
const front = [];
const reverse = [];
const edges = [];
function vertex(x, y, z, nx, ny, nz) {
  const index = positions.length / 3;
  positions.push(x, y, z);
  normals.push(nx, ny, nz);
  const horizontal = (x + cardWidth / 2) / cardWidth;
  // From behind, screen-right is world-left; flip U to keep the print readable.
  const textureX = nz < 0 ? 1 - horizontal : horizontal;
  uvs.push(
    (left + textureX * (right - left)) / width,
    (top + ((cardHeight / 2 - y) / cardHeight) * (bottom - top)) / height,
  );
  return index;
}
for (const [z, normal, target] of [
  [depth / 2, 1, front],
  [-depth / 2, -1, reverse],
]) {
  const center = vertex(0, 0, z, 0, 0, normal);
  const ring = outline.map(([x, y]) => vertex(x, y, z, 0, 0, normal));
  for (let index = 0; index < ring.length; index++) {
    const next = (index + 1) % ring.length;
    target.push(center, ring[normal > 0 ? index : next], ring[normal > 0 ? next : index]);
  }
}
for (let index = 0; index < outline.length; index++) {
  const [ax, ay] = outline[index];
  const [bx, by] = outline[(index + 1) % outline.length];
  const length = Math.hypot(bx - ax, by - ay);
  const nx = (by - ay) / length;
  const ny = (ax - bx) / length;
  const a = vertex(ax, ay, depth / 2, nx, ny, 0);
  const b = vertex(bx, by, depth / 2, nx, ny, 0);
  const c = vertex(bx, by, -depth / 2, nx, ny, 0);
  const d = vertex(ax, ay, -depth / 2, nx, ny, 0);
  edges.push(a, c, b, a, d, c);
}
const chunks = [];
const views = [];
let byteLength = 0;
function append(bytes, target) {
  const buffer = Buffer.from(bytes.buffer ?? bytes, bytes.byteOffset ?? 0, bytes.byteLength);
  const index = views.length;
  views.push({
    buffer: 0,
    byteOffset: byteLength,
    byteLength: buffer.length,
    ...(target && { target }),
  });
  const padding = Buffer.alloc((4 - (buffer.length % 4)) % 4);
  chunks.push(buffer, padding);
  byteLength += buffer.length + padding.length;
  return index;
}
const positionView = append(new Float32Array(positions), 34962);
const normalView = append(new Float32Array(normals), 34962);
const uvView = append(new Float32Array(uvs), 34962);
const indexViews = [front, reverse, edges].map((indices) =>
  append(new Uint16Array(indices), 34963),
);
const imageView = append(png);
const accessors = [
  {
    bufferView: positionView,
    componentType: 5126,
    count: positions.length / 3,
    type: "VEC3",
    min: [-cardWidth / 2, -0.5, -depth / 2],
    max: [cardWidth / 2, 0.5, depth / 2],
  },
  { bufferView: normalView, componentType: 5126, count: normals.length / 3, type: "VEC3" },
  { bufferView: uvView, componentType: 5126, count: uvs.length / 2, type: "VEC2" },
  ...[front, reverse, edges].map((indices, index) => ({
    bufferView: indexViews[index],
    componentType: 5123,
    count: indices.length,
    type: "SCALAR",
  })),
];
const gltf = {
  asset: {
    version: "2.0",
    generator: "Dirtycoin photo-card preview",
    extras: {
      source: "Dirtycoin Moon Visa artwork",
      reverse: "Front artwork repeated readably on reverse; no reverse-side scan supplied",
    },
  },
  extensionsUsed: ["KHR_materials_unlit"],
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "Moon Visa card" }],
  meshes: [
    {
      primitives: [front, reverse, edges].map((_, index) => ({
        attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
        indices: 3 + index,
        material: index === 2 ? 1 : 0,
      })),
    },
  ],
  materials: [
    {
      name: "Visa photo on both faces",
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicFactor: 0,
        roughnessFactor: 0.65,
      },
      alphaMode: "MASK",
      alphaCutoff: 0.2,
      extensions: { KHR_materials_unlit: {} },
    },
    {
      name: "Plain card edge",
      pbrMetallicRoughness: {
        baseColorFactor: [0.55, 0.52, 0.46, 1],
        metallicFactor: 0,
        roughnessFactor: 0.75,
      },
    },
  ],
  textures: [{ sampler: 0, source: 0 }],
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
  images: [{ bufferView: imageView, mimeType: "image/png" }],
  buffers: [{ byteLength }],
  bufferViews: views,
  accessors,
};
const rawJson = Buffer.from(JSON.stringify(gltf));
const json = Buffer.concat([rawJson, Buffer.alloc((4 - (rawJson.length % 4)) % 4, 0x20)]);
const binary = Buffer.concat(chunks);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + binary.length, 8);
function chunkHeader(length, type) {
  const result = Buffer.alloc(8);
  result.writeUInt32LE(length, 0);
  result.writeUInt32LE(type, 4);
  return result;
}
await writeFile(
  path.join(directory, "model.glb"),
  Buffer.concat([
    header,
    chunkHeader(json.length, 0x4e4f534a),
    json,
    chunkHeader(binary.length, 0x004e4942),
    binary,
  ]),
);
console.log(
  JSON.stringify({
    vertices: positions.length / 3,
    triangles: (front.length + reverse.length + edges.length) / 3,
    cardWidth,
    cardHeight,
    depth,
    byteLength,
  }),
);
