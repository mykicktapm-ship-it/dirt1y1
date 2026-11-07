#!/usr/bin/env python3
"""Generate the Market card camera profile from the shipped GLB geometry.

Requires NumPy and Pillow. It never rewrites model/image assets. Coordinates use
the active glTF scene and positive Y rotation. Its pivot/extent reproduce
THREE.Box3.setFromObject(model), retaining the existing cover perspective, while
its actual framing uses the complete world-space mesh vertices.
"""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
from pathlib import Path
import struct

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "public/marketplace/viewer/card-framing.json"
ASPECT = 220 / 150
FOV = 38
OCCUPANCY = 0.88
STEP = 2
ITEMS = (
    "glock18",
    "weapon-case",
    "briefcase",
    "bulletproof-umbrella",
    "to-the-moon-visa",
    "bitcoin",
    "ethereum",
)


def world_vertices(path: Path) -> tuple[np.ndarray, np.ndarray]:
    """Read uncompressed, rigid glTF positions without loading textures/renderers."""
    data = path.read_bytes()
    magic, version, length = struct.unpack_from("<III", data)
    if magic != 0x46546C67 or version != 2 or length != len(data):
        raise ValueError(f"Invalid GLB: {path}")
    document = None
    binary = None
    offset = 12
    while offset < len(data):
        size, kind = struct.unpack_from("<II", data, offset)
        chunk = data[offset + 8 : offset + 8 + size]
        if kind == 0x4E4F534A:
            document = json.loads(chunk)
        elif kind == 0x004E4942:
            binary = chunk
        offset += 8 + size
    if document is None or binary is None or document.get("skins"):
        raise ValueError(f"Expected a rigid, embedded-buffer GLB: {path}")

    def positions(index: int) -> np.ndarray:
        accessor = document["accessors"][index]
        if (
            accessor["componentType"] != 5126
            or accessor["type"] != "VEC3"
            or accessor.get("sparse")
            or accessor.get("normalized")
        ):
            raise ValueError(f"Unsupported position accessor in {path}")
        view = document["bufferViews"][accessor["bufferView"]]
        if view.get("buffer", 0) != 0:
            raise ValueError(f"Expected embedded buffer zero: {path}")
        return np.ndarray(
            (accessor["count"], 3),
            dtype="<f4",
            buffer=binary,
            offset=view.get("byteOffset", 0) + accessor.get("byteOffset", 0),
            strides=(view.get("byteStride", 12), 4),
        ).astype(np.float64)

    def matrix(node: dict) -> np.ndarray:
        if "matrix" in node:
            return np.array(node["matrix"], dtype=float).reshape(4, 4, order="F")
        x, y, z, w = node.get("rotation", (0, 0, 0, 1))
        rotation = np.array(
            [
                [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
            ]
        )
        result = np.eye(4)
        result[:3, :3] = rotation @ np.diag(node.get("scale", (1, 1, 1)))
        result[:3, 3] = node.get("translation", (0, 0, 0))
        return result

    parts = []
    bounds_parts = []

    def visit(index: int, parent: np.ndarray) -> None:
        node = document["nodes"][index]
        if "skin" in node:
            raise ValueError(f"Skinned mesh requires a separate extractor: {path}")
        world = parent @ matrix(node)
        if "mesh" in node:
            for primitive in document["meshes"][node["mesh"]]["primitives"]:
                if primitive.get("targets") or primitive.get("extensions", {}).get(
                    "KHR_draco_mesh_compression"
                ):
                    raise ValueError(f"Unsupported animated/compressed mesh: {path}")
                points = positions(primitive["attributes"]["POSITION"])
                homogeneous = np.column_stack((points, np.ones(len(points))))
                parts.append((homogeneous @ world.T)[:, :3])
                # THREE's default (non-precise) Box3 transforms every geometry's
                # local bounding-box corners, not only the actual mesh vertices.
                corners = np.array(list(itertools.product(*zip(points.min(0), points.max(0)))))
                bounds_parts.append((np.column_stack((corners, np.ones(8))) @ world.T)[:, :3])
        for child in node.get("children", []):
            visit(child, world)

    scene = document["scenes"][document.get("scene", 0)]
    for root in scene["nodes"]:
        visit(root, np.eye(4))
    if not parts:
        raise ValueError(f"No active-scene mesh vertices: {path}")
    return np.concatenate(parts), np.concatenate(bounds_parts)


def camera_basis(asset: str) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    elevation = 0 if asset == "to-the-moon-visa" else 0.5 if asset == "weapon-case" else 0.3
    direction = np.array((0 if asset == "to-the-moon-visa" else -0.55, elevation, 0.84))
    direction /= np.linalg.norm(direction)
    right = np.cross((0, 1, 0), direction)
    right /= np.linalg.norm(right)
    up = np.cross(direction, right)
    return direction, right, up


def camera_coordinates(points: np.ndarray, angle: float, basis: tuple) -> tuple:
    c, s = math.cos(angle), math.sin(angle)
    x = points[:, 0] * c + points[:, 2] * s
    y = points[:, 1]
    z = -points[:, 0] * s + points[:, 2] * c
    # Elementwise expressions avoid BLAS thread-start overhead for these small
    # vectors and keep generation inexpensive even for the 41k-vertex case.
    return tuple(x * a[0] + y * a[1] + z * a[2] for a in basis)


TAN = math.tan(math.radians(FOV / 2))


def projected_bounds(coordinates: tuple, distance: float) -> np.ndarray:
    depth, horizontal, vertical = coordinates
    denominator = distance - depth
    if np.min(denominator) <= 0:
        raise ValueError("Camera must stay in front of every model vertex")
    x = horizontal / (denominator * TAN * ASPECT)
    y = vertical / (denominator * TAN)
    return np.array((np.min(x), np.min(y), np.max(x), np.max(y)))


def capture_distance(points: np.ndarray, basis: tuple, asset: str) -> float:
    """Keep the original cover camera distance and therefore its perspective."""
    distance = 0.0
    vertical_slope = TAN * 0.93
    horizontal_slope = vertical_slope * 556 / 384
    for degree in range(0, 360, 5):
        depth, horizontal, vertical = camera_coordinates(points, math.radians(degree), basis)
        distance = max(
            distance,
            float(np.max(depth + np.abs(horizontal) / horizontal_slope)),
            float(np.max(depth + np.abs(vertical) / vertical_slope)),
        )
    return distance * (1.15 if asset == "glock18" else 1)


def fit_frame(coordinates: tuple, distance: float) -> tuple[list[float], np.ndarray]:
    bounds = projected_bounds(coordinates, distance)
    zoom = OCCUPANCY / (max(bounds[2] - bounds[0], bounds[3] - bounds[1]) / 2)
    bounds *= zoom
    center_x = (bounds[0] + bounds[2]) / 2
    center_y = (bounds[1] + bounds[3]) / 2
    centered = bounds - np.array((center_x, center_y, center_x, center_y))
    return [zoom, center_x, center_y], centered


def generate() -> dict:
    items = {}
    for asset in ITEMS:
        directory = ROOT / "public/marketplace" / asset
        model_path = directory / "model.glb"
        points, bounds = world_vertices(model_path)
        minimum, maximum = bounds.min(axis=0), bounds.max(axis=0)
        points -= (minimum + maximum) / 2
        extent = float(np.max(maximum - minimum))
        basis = camera_basis(asset)
        distance = capture_distance(points, basis, asset)
        frames = []
        initial = None
        for degree in range(0, 361, STEP):
            coordinates = camera_coordinates(points, math.radians(degree), basis)
            frame, centered = fit_frame(coordinates, distance)
            frames.append([round(value, 9) for value in frame])
            if degree == 0:
                # Convert NDC (positive Y up) to CSS fractions (positive Y down).
                initial = [
                    (centered[0] + 1) / 2,
                    (1 - centered[3]) / 2,
                    (centered[2] + 1) / 2,
                    (1 - centered[1]) / 2,
                ]
        # Remove even tiny floating-point differences at the loop seam.
        frames[-1] = frames[0].copy()
        worst = 0.0
        for degree in range(1, 360, STEP):
            index = degree // STEP
            frame = (np.array(frames[index]) + np.array(frames[index + 1])) / 2
            bounds = projected_bounds(
                camera_coordinates(points, math.radians(degree), basis), distance
            ) * frame[0]
            centered = bounds - np.array((frame[1], frame[2], frame[1], frame[2]))
            worst = max(worst, float(np.max(np.abs(centered))))
        if worst > 0.9:
            raise ValueError(f"Interpolated card camera clips its comfort margin: {asset}: {worst}")
        with Image.open(directory / "cover.webp") as cover:
            if cover.size != (556, 384):
                raise ValueError(f"Unexpected cover dimensions: {asset}: {cover.size}")
            alpha = cover.convert("RGBA").getchannel("A")
            alpha_bounds = alpha.point(lambda value: 255 if value >= 32 else 0).getbbox()
            if alpha_bounds is None:
                raise ValueError(f"Empty cover: {asset}")
        items[asset] = {
            "alphaBounds": list(alpha_bounds),
            "initialBounds": [round(float(value), 9) for value in initial],
            "baseDistance": round(distance / extent, 9),
            "frames": frames,
            "modelSha256": hashlib.sha256(model_path.read_bytes()).hexdigest(),
        }
        print(
            f"{asset}: {len(points)} vertices; initial longest dimension {OCCUPANCY:.0%}; "
            f"interpolated maximum {worst:.6f}",
            flush=True,
        )
    return {
        "version": 1,
        "aspect": ASPECT,
        "fov": FOV,
        "occupancy": OCCUPANCY,
        "frameType": "zoom",
        "step": STEP,
        "source": {"width": 556, "height": 384},
        "items": items,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify the checked-in profile without writing it")
    args = parser.parse_args()
    profile = generate()
    encoded = json.dumps(profile, separators=(",", ":"), ensure_ascii=True) + "\n"
    if args.check:
        if not DESTINATION.exists() or DESTINATION.read_text(encoding="utf-8") != encoded:
            raise SystemExit("Market camera profile is stale; rerun scripts/generate-market-framing.py")
        print("Market camera profile is current", flush=True)
    else:
        DESTINATION.write_text(encoded, encoding="utf-8")
        print(f"Wrote {DESTINATION.relative_to(ROOT)} ({len(encoded)} bytes)", flush=True)


if __name__ == "__main__":
    main()
