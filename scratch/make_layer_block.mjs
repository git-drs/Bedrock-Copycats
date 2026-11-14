import fs from "fs";
import path from "path";

const perms = [];
for (let h = 2; h <= 8; h++) {
  const height = h * 2;
  perms.push({
    condition: `q.block_state('cc:height') == ${h}`,
    components: {
      "minecraft:geometry": { "identifier": `geometry.copycat_layer_${h}` },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, height, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, height, 16] }
    }
  });
}

const blockJson = {
  format_version: "1.21.70",
  "minecraft:block": {
    description: {
      identifier: "cc:copycat_layer",
      menu_category: { category: "construction" },
      states: {
        "cc:height": [1, 2, 3, 4, 5, 6, 7, 8]
      }
    },
    components: {
      "minecraft:custom_components": ["cc:layer"],
      "minecraft:geometry": { "identifier": "geometry.copycat_layer_1" },
      "minecraft:collision_box": { "origin": [-8, 0, -8], "size": [16, 2, 16] },
      "minecraft:selection_box": { "origin": [-8, 0, -8], "size": [16, 2, 16] },
      "minecraft:material_instances": { "*": { "texture": "copycat_base", "render_method": "alpha_test" } },
      "minecraft:destructible_by_mining": {
        "seconds_to_destroy": 7.5,
        "item_specific_speeds": [
          { "item": { "tags": "q.all_tags('minecraft:is_pickaxe', 'minecraft:wooden_tier')" }, "destroy_speed": 1.15 },
          { "item": { "tags": "q.all_tags('minecraft:is_pickaxe', 'minecraft:stone_tier')" }, "destroy_speed": 0.6 },
          { "item": { "tags": "q.all_tags('minecraft:is_pickaxe', 'minecraft:iron_tier')" }, "destroy_speed": 0.4 },
          { "item": { "tags": "q.all_tags('minecraft:is_pickaxe', 'minecraft:golden_tier')" }, "destroy_speed": 0.2 },
          { "item": { "tags": "q.all_tags('minecraft:is_pickaxe', 'minecraft:diamond_tier')" }, "destroy_speed": 0.3 },
          { "item": { "tags": "q.all_tags('minecraft:is_pickaxe', 'minecraft:netherite_tier')" }, "destroy_speed": 0.25 }
        ]
      },
      "minecraft:destructible_by_explosion": { "explosion_resistance": 30.0 },
      "minecraft:map_color": "#ff7336",
      "minecraft:liquid_detection": {
        "detection_rules": [
          { "liquid_type": "water", "can_contain_liquid": true, "on_liquid_touches": "blocking" }
        ]
      },
      "minecraft:light_dampening": 0,
      "minecraft:loot": "loot_tables/blocks/copycat_layer.json"
    },
    permutations: perms
  }
};

const targetPath = path.resolve("Bedrock Copycats [BP]/blocks/copycat/base/copycat_layer.block.json");
fs.writeFileSync(targetPath, JSON.stringify(blockJson, null, "\t"));
console.log("Wrote " + targetPath);
