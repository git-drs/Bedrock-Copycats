import fs from "fs";
import path from "path";

function mkPlateCube(height) {
  return {
    origin: [-7, 0, -7],
    size: [14, height, 14],
    uv: {
      north: { uv: [1, 16 - height], uv_size: [14, height], material_instance: "north" },
      south: { uv: [1, 16 - height], uv_size: [14, height], material_instance: "south" },
      east: { uv: [1, 16 - height], uv_size: [14, height], material_instance: "east" },
      west: { uv: [1, 16 - height], uv_size: [14, height], material_instance: "west" },
      up: { uv: [15, 15], uv_size: [-14, -14], material_instance: "up" },
      down: { uv: [15, 15], uv_size: [-14, -14], material_instance: "down" }
    }
  };
}

function mkGeo(id, cube) {
  return {
    description: {
      identifier: id,
      texture_width: 16,
      texture_height: 16,
      visible_bounds_width: 3,
      visible_bounds_height: 2.5,
      visible_bounds_offset: [0, 0.75, 0]
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
    mkGeo("geometry.copycat_pressure_plate_unpressed", mkPlateCube(1)),
    mkGeo("geometry.copycat_pressure_plate_pressed", mkPlateCube(0.5))
  ]
};

const targetPath = path.resolve("Bedrock Copycats [RP]/models/blocks/copycat_pressure_plate.geo.json");
fs.writeFileSync(targetPath, JSON.stringify(fileData, null, "\t"));
console.log("Wrote " + targetPath);
