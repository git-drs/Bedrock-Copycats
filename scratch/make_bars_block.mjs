import fs from "fs";
import path from "path";

// 15 permutations matching copycat_fence
const perms = [
  // 1-way
  {
    condition: "q.block_state('cc:north_connected') && !q.block_state('cc:south_connected') && !q.block_state('cc:east_connected') && !q.block_state('cc:west_connected')",
    components: {
      "minecraft:collision_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:selection_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side" }
    }
  },
  {
    condition: "q.block_state('cc:south_connected') && !q.block_state('cc:north_connected') && !q.block_state('cc:east_connected') && !q.block_state('cc:west_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 180, 0] },
      "minecraft:collision_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:selection_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side" }
    }
  },
  {
    condition: "q.block_state('cc:east_connected') && !q.block_state('cc:west_connected') && !q.block_state('cc:north_connected') && !q.block_state('cc:south_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 270, 0] },
      "minecraft:collision_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:selection_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side" }
    }
  },
  {
    condition: "q.block_state('cc:west_connected') && !q.block_state('cc:east_connected') && !q.block_state('cc:north_connected') && !q.block_state('cc:south_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:selection_box": { "origin": [-1, 0, -8], "size": [2, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side" }
    }
  },
  // 2-way straight
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:south_connected') && !q.block_state('cc:east_connected') && !q.block_state('cc:west_connected')",
    components: {
      "minecraft:collision_box": { "origin": [-1, 0, -8], "size": [2, 16, 16] },
      "minecraft:selection_box": { "origin": [-1, 0, -8], "size": [2, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_straight" }
    }
  },
  {
    condition: "q.block_state('cc:east_connected') && q.block_state('cc:west_connected') && !q.block_state('cc:north_connected') && !q.block_state('cc:south_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [-1, 0, -8], "size": [2, 16, 16] },
      "minecraft:selection_box": { "origin": [-1, 0, -8], "size": [2, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_straight" }
    }
  },
  // 2-way corner
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:west_connected') && !q.block_state('cc:south_connected') && !q.block_state('cc:east_connected')",
    components: {
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side2" }
    }
  },
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:east_connected') && !q.block_state('cc:south_connected') && !q.block_state('cc:west_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 270, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side2" }
    }
  },
  {
    condition: "q.block_state('cc:south_connected') && q.block_state('cc:west_connected') && !q.block_state('cc:north_connected') && !q.block_state('cc:east_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side2" }
    }
  },
  {
    condition: "q.block_state('cc:south_connected') && q.block_state('cc:east_connected') && !q.block_state('cc:north_connected') && !q.block_state('cc:west_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 180, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 9] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_side2" }
    }
  },
  // 3-way tee
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:south_connected') && q.block_state('cc:west_connected') && !q.block_state('cc:east_connected')",
    components: {
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_tee" }
    }
  },
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:south_connected') && q.block_state('cc:east_connected') && !q.block_state('cc:west_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 180, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_tee" }
    }
  },
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:east_connected') && q.block_state('cc:west_connected') && !q.block_state('cc:south_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 270, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_tee" }
    }
  },
  {
    condition: "q.block_state('cc:south_connected') && q.block_state('cc:east_connected') && q.block_state('cc:west_connected') && !q.block_state('cc:north_connected')",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [9, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_tee" }
    }
  },
  // 4-way quad
  {
    condition: "q.block_state('cc:north_connected') && q.block_state('cc:south_connected') && q.block_state('cc:east_connected') && q.block_state('cc:west_connected')",
    components: {
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, 16, 16] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_quad" }
    }
  }
];

const blockJson = {
  format_version: "1.21.70",
  "minecraft:block": {
    description: {
      identifier: "cc:copycat_bars",
      menu_category: { category: "construction" },
      states: {
        "cc:north_connected": [false, true],
        "cc:south_connected": [false, true],
        "cc:east_connected": [false, true],
        "cc:west_connected": [false, true]
      }
    },
    components: {
      "minecraft:collision_box": { "origin": [-1, 0, -1], "size": [2, 16, 2] },
      "minecraft:selection_box": { "origin": [-1, 0, -1], "size": [2, 16, 2] },
      "minecraft:geometry": { "identifier": "geometry.copycat_bars_post" },
      "minecraft:material_instances": { "*": { "texture": "copycat_base", "render_method": "alpha_test" } },
      "tag:bars": {},
      "tag:iron_bars": {},
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 5.0 },
      "minecraft:destructible_by_explosion": { "explosion_resistance": 30.0 },
      "minecraft:loot": "loot_tables/blocks/copycat_bars.json"
    },
    permutations: perms
  }
};

const targetPath = path.resolve("Bedrock Copycats [BP]/blocks/copycat/base/copycat_bars.block.json");
fs.writeFileSync(targetPath, JSON.stringify(blockJson, null, "\t"));
console.log("Wrote " + targetPath);
