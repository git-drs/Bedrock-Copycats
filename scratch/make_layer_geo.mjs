import fs from "fs";
import path from "path";

const geometries = [];

for (let h = 1; h <= 8; h++) {
  const height = h * 2;
  const cube = {
    origin: [-8, 0, -8],
    size: [16, height, 16],
    uv: {
      north: { uv: [0, 16 - height], uv_size: [16, height], material_instance: "north" },
      south: { uv: [0, 16 - height], uv_size: [16, height], material_instance: "south" },
      east: { uv: [0, 16 - height], uv_size: [16, height], material_instance: "east" },
      west: { uv: [0, 16 - height], uv_size: [16, height], material_instance: "west" },
      up: { uv: [16, 16], uv_size: [-16, -16], material_instance: "up" },
      down: { uv: [16, 16], uv_size: [-16, -16], material_instance: "down" }
    }
  };

  geometries.push({
    description: {
      identifier: `geometry.copycat_layer_${h}`,
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
  });
}

const fileData = {
  format_version: "1.21.20",
  "minecraft:geometry": geometries
};

const targetPath = path.resolve("Bedrock Copycats [RP]/models/blocks/copycat_layer.geo.json");
fs.writeFileSync(targetPath, JSON.stringify(fileData, null, "\t"));
console.log("Wrote " + targetPath);
