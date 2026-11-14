import fs from "fs";
import path from "path";

// Permutations for Door:
// States: cc:half ('lower'|'upper'), cc:hinge ('left'|'right'), cc:open (false|true), minecraft:cardinal_direction ('north'|'south'|'east'|'west')
const perms = [
  // Upper half geometry swap
  {
    condition: "q.block_state('cc:half') == 'upper'",
    components: {
      "minecraft:geometry": { "identifier": "geometry.copycat_door_upper" }
    }
  },
  // North Closed
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'north' && !q.block_state('cc:open')",
    components: {
      "minecraft:transformation": { "rotation": [0, 0, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] }
    }
  },
  // North Open Left Hinge (swings 90 deg)
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'north' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'left'",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [3, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [3, 16, 16] }
    }
  },
  // North Open Right Hinge (swings 270 deg)
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'north' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'right'",
    components: {
      "minecraft:transformation": { "rotation": [0, 270, 0] },
      "minecraft:collision_box": { "origin": [5, 0, -8], "size": [3, 16, 16] },
      "minecraft:selection_box": { "origin": [5, 0, -8], "size": [3, 16, 16] }
    }
  },
  // East Closed
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'east' && !q.block_state('cc:open')",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [5, 0, -8], "size": [3, 16, 16] },
      "minecraft:selection_box": { "origin": [5, 0, -8], "size": [3, 16, 16] }
    }
  },
  // East Open Left
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'east' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'left'",
    components: {
      "minecraft:transformation": { "rotation": [0, 180, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, 5], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, 5], "size": [16, 16, 3] }
    }
  },
  // East Open Right
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'east' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'right'",
    components: {
      "minecraft:transformation": { "rotation": [0, 0, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] }
    }
  },
  // South Closed
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'south' && !q.block_state('cc:open')",
    components: {
      "minecraft:transformation": { "rotation": [0, 180, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, 5], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, 5], "size": [16, 16, 3] }
    }
  },
  // South Open Left
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'south' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'left'",
    components: {
      "minecraft:transformation": { "rotation": [0, 270, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [3, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [3, 16, 16] }
    }
  },
  // South Open Right
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'south' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'right'",
    components: {
      "minecraft:transformation": { "rotation": [0, 90, 0] },
      "minecraft:collision_box": { "origin": [5, 0, -8], "size": [3, 16, 16] },
      "minecraft:selection_box": { "origin": [5, 0, -8], "size": [3, 16, 16] }
    }
  },
  // West Closed
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'west' && !q.block_state('cc:open')",
    components: {
      "minecraft:transformation": { "rotation": [0, 270, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [3, 16, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [3, 16, 16] }
    }
  },
  // West Open Left
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'west' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'left'",
    components: {
      "minecraft:transformation": { "rotation": [0, 0, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] }
    }
  },
  // West Open Right
  {
    condition: "q.block_state('minecraft:cardinal_direction') == 'west' && q.block_state('cc:open') && q.block_state('cc:hinge') == 'right'",
    components: {
      "minecraft:transformation": { "rotation": [0, 180, 0] },
      "minecraft:collision_box": { "origin": [-8, 0, 5], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, 5], "size": [16, 16, 3] }
    }
  }
];

const blockJson = {
  format_version: "1.21.70",
  "minecraft:block": {
    description: {
      identifier: "cc:copycat_door",
      menu_category: { category: "construction" },
      states: {
        "cc:half": ["lower", "upper"],
        "cc:hinge": ["left", "right"],
        "cc:open": [false, true]
      },
      traits: {
        "minecraft:placement_direction": {
          "enabled_states": ["minecraft:cardinal_direction"]
        }
      }
    },
    components: {
      "minecraft:custom_components": ["cc:door"],
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, 16, 3] },
      "minecraft:geometry": { "identifier": "geometry.copycat_door_lower" },
      "minecraft:material_instances": { "*": { "texture": "copycat_base", "render_method": "alpha_test" } },
      "tag:doors": {},
      "minecraft:destructible_by_mining": { "seconds_to_destroy": 3.0 },
      "minecraft:destructible_by_explosion": { "explosion_resistance": 15.0 },
      "minecraft:loot": "loot_tables/blocks/copycat_door.json"
    },
    permutations: perms
  }
};

const targetPath = path.resolve("Bedrock Copycats [BP]/blocks/copycat/base/copycat_door.block.json");
fs.writeFileSync(targetPath, JSON.stringify(blockJson, null, "\t"));
console.log("Wrote " + targetPath);
