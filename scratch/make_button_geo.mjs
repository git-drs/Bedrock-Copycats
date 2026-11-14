import fs from "fs";
import path from "path";

function mkButtonCube(height) {
  // Centered along X: [-3, 3] (size 6), Y: [0, height], Z: [-2, 2] (size 4)
  const ox = -3, oy = 0, oz = -2;
  const sx = 6, sy = height, sz = 4;
  const x0 = ox + 8, z0 = oz + 8;
  const y0 = 16 - (oy + sy);

  return {
    origin: [ox, oy, oz],
    size: [sx, sy, sz],
    uv: {
      north: { uv: [x0, y0], uv_size: [sx, sy], material_instance: "north" },
      south: { uv: [16 - (x0 + sx), y0], uv_size: [sx, sy], material_instance: "south" },
      east: { uv: [16 - (z0 + sz), y0], uv_size: [sz, sy], material_instance: "east" },
      west: { uv: [z0, y0], uv_size: [sz, sy], material_instance: "west" },
      up: { uv: [x0 + sx, z0 + sz], uv_size: [-sx, -sz], material_instance: "up" },
      down: { uv: [x0 + sx, z0 + sz], uv_size: [-sx, -sz], material_instance: "down" }
    }
  };
}

function mkGeo(id, cube) {
  return {
    description: {
      identifier: id,
      texture_width: 16,
      texture_height: 16,
      visible_bounds_width: 2,
      visible_bounds_height: 2,
      visible_bounds_offset: [0, 0.5, 0]
    },
    bones: [
      {
        name: "bb_main",
        pivot: [0, 0, 0],
        cubes: [cube]
      }
    ]
  };
}

const fileData = {
  format_version: "1.21.20",
  "minecraft:geometry": [
    mkGeo("geometry.copycat_button_unpressed", mkButtonCube(2)),
    mkGeo("geometry.copycat_button_pressed", mkButtonCube(1))
  ]
};

const targetPath = path.resolve("Bedrock Copycats [RP]/models/blocks/copycat_button.geo.json");
fs.writeFileSync(targetPath, JSON.stringify(fileData, null, "\t"));
console.log("Wrote " + targetPath);
