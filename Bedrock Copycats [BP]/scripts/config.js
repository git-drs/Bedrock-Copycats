import "./utils";
import { canChangePosition, canRotate } from "./utils";

// config.js - Configuration and constants
export const copycatBlocks = [
  //copycat blocks
  "cc:copycat_block",
  "cc:copycat_slab",
  "cc:copycat_beam",
  "cc:copycat_slope",
  "cc:copycat_corner_beam",
  "cc:copycat_horizontal_corner_beam",
  "cc:copycat_trapdoor",
  "cc:copycat_fence",
  "cc:copycat_board",
  "cc:copycat_stair",
  "cc:copycat_pannel",
  "cc:copycat_horizontal_pannel",
  "cc:copycat_table",
  //copycat blocks varients

  //copper

  //deepslate

  //end

  //glass 0
  "cc:copycat_block_glass_0",
  "cc:copycat_slab_glass_0",
  "cc:copycat_beam_glass_0",
  "cc:copycat_slope_glass_0",
  "cc:copycat_corner_beam_glass_0",
  "cc:copycat_horizontal_corner_beam_glass_0",
  "cc:copycat_trapdoor_glass_0",
  "cc:copycat_fence_glass_0",
  "cc:copycat_board_glass_0",
  "cc:copycat_stair_glass_0",
  "cc:copycat_pannel_glass_0",
  "cc:copycat_horizontal_pannel_glass_0",

  //glass
  "cc:copycat_block_glass",
  "cc:copycat_slab_glass",
  "cc:copycat_beam_glass",
  "cc:copycat_slope_glass",
  "cc:copycat_corner_beam_glass",
  "cc:copycat_horizontal_corner_beam_glass",
  "cc:copycat_trapdoor_glass",
  "cc:copycat_fence_glass",
  "cc:copycat_board_glass",
  "cc:copycat_stair_glass",
  "cc:copycat_pannel_glass",
  "cc:copycat_horizontal_pannel_glass",


  //leaves

  //logs
  "cc:copycat_block_log",

  //metals

  //nether

  //ores

  //planks

  //raw

  //stone

  //teracotta

  //tuff

  //wool
  "cc:copycat_block_wool",
  "cc:copycat_slab_wool"
];

// Transform state configuration - defines which blocks can do what
export const transformStates = {
  "cc:copycat_horizontal_corner_beam": {
    canRotate: true,
    canChangePosition: true
  },
  "cc:copycat_slope": {
    canRotate: true,
    canChangePosition: true
  },
  "cc:copycat_beam": {
    canRotate: true,
    canChangePosition: false
  },
  "cc:copycat_corner_beam": {
    canRotate: true,
    canChangePosition: false
  },
  "cc:copycat_slab": {
    canRotate: false,
    canChangePosition: true
  },
  "cc:copycat_trapdoor": {
    canRotate: true,
    canChangePosition: true
  },
  "cc:copycat_stair": {
    canRotate: true,
    canChangePosition: true
  },
  "cc:copycat_pannel": {
    canRotate: true,
    canChangePosition: true
  },
  "cc:copycat_horizontal_pannel": {
    canRotate: true,
    canChangePosition: true
  }
  // Add more blocks and their capabilities here
};

// Position and rotation states
export const positionStates = {
  LOWER: "lower",
  UPPER: "upper"
};

export const rotationStates = {
  NORTH: "north",
  EAST: "east",
  SOUTH: "south",
  WEST: "west"
};

// ============================================
// NEW DYNAMIC TEXTURE SYSTEM
// ============================================

// Define copycat block types that can receive textures
export const texturableCopycatBlocks = [
  "cc:copycat_block",
  "cc:copycat_slab",
  "cc:copycat_beam",
  "cc:copycat_slope",
  "cc:copycat_corner_beam",
  "cc:copycat_horizontal_corner_beam",
  "cc:copycat_trapdoor",
  "cc:copycat_stair",
  "cc:copycat_fence",
  "cc:copycat_pannel",
  "cc:copycat_horizontal_pannel",
  "cc:copycat_board",
  // Add more copycat blocks here as needed
];

// Define texture categories with their variants
export const textureCategories = {
  // Glass category
  glass: {
    // Special glass blocks (glass_0 type)
    special: {
      blockSuffix: "_glass_0",
      stateName: "cc:glass",
      sound: "dig.glass",
      variants: {
        
        
        "minecraft:glass": "clear",
        "minecraft:tinted_glass": "tinted"
      }
    },
    // Colored glass blocks
    colored: {
      blockSuffix: "_glass",
      stateName: "cc:glass_type",
      sound: "dig.glass",
      variants: {
        "minecraft:white_stained_glass": "white",
        "minecraft:blue_stained_glass": "blue",
        "minecraft:brown_stained_glass": "brown",
        "minecraft:orange_stained_glass": "orange",
        "minecraft:magenta_stained_glass": "magenta",
        "minecraft:light_blue_stained_glass": "light_blue",
        "minecraft:yellow_stained_glass": "yellow",
        "minecraft:lime_stained_glass": "lime",
        "minecraft:pink_stained_glass": "pink",
        "minecraft:gray_stained_glass": "gray",
        "minecraft:light_gray_stained_glass": "light_gray",
        "minecraft:cyan_stained_glass": "cyan",
        "minecraft:purple_stained_glass": "purple",
        "minecraft:green_stained_glass": "green",
        "minecraft:red_stained_glass": "red",
        "minecraft:black_stained_glass": "black"
      }
    }
  },

  // Wool category (example for future expansion)
  wool: {
    colored: {
      blockSuffix: "_wool",
      stateName: "cc:wool_type",
      sound: "dig.cloth",
      variants: {
        "minecraft:white_wool": "white",
        "minecraft:orange_wool": "orange",
        "minecraft:magenta_wool": "magenta",
        "minecraft:light_blue_wool": "light_blue",
        "minecraft:yellow_wool": "yellow",
        "minecraft:lime_wool": "lime",
        "minecraft:pink_wool": "pink",
        "minecraft:gray_wool": "gray",
        "minecraft:light_gray_wool": "light_gray",
        "minecraft:cyan_wool": "cyan",
        "minecraft:purple_wool": "purple",
        "minecraft:blue_wool": "blue",
        "minecraft:brown_wool": "brown",
        "minecraft:green_wool": "green",
        "minecraft:red_wool": "red",
        "minecraft:black_wool": "black"
      }
    }
  },

  // Planks category (example for future expansion)
  planks: {
    wood: {
      blockSuffix: "_planks",
      stateName: "cc:wood_type",
      sound: "dig.wood",
      variants: {
        "minecraft:oak_planks": "oak",
        "minecraft:spruce_planks": "spruce",
        "minecraft:birch_planks": "birch",
        "minecraft:jungle_planks": "jungle",
        "minecraft:acacia_planks": "acacia",
        "minecraft:dark_oak_planks": "dark_oak",
        "minecraft:mangrove_planks": "mangrove",
        "minecraft:cherry_planks": "cherry",
        "minecraft:pale_oak_planks": "pale_oak",
        "minecraft:bamboo_planks": "bamboo",
        "minecraft:bamboo_mosaic": "mosaic",
        "minecraft:crimson_planks": "crimson",
        "minecraft:warped_planks": "warped"
      }
    }
  },
  stone: {
    rock: {
      blockSuffix: "_stone",
      stateName: "cc:stone_type",
      sound: "dig.stone",
      variants: {
        "minecraft:stone": "stone",
        "minecraft:stone_bricks": "bricks",
        "minecraft:cracked_stone_bricks": "cracked_bricks",
        "minecraft:chiseled_stone_bricks": "chiseled",
        "minecraft:cobblestone": "cobblestone",
        "minecraft:mossy_cobblestone": "mossy_cobblestone",
        "minecraft:smooth_stone": "smooth_stone",
        "minecraft:granite": "granite",
        "minecraft:polished_granite": "polished_granite",
        "minecraft:diorite": "diorite",
        "minecraft:polished_diorite": "polished_diorite",
        "minecraft:andesite": "andesite",
        "minecraft:polished_andesite": "polished_andesite",
        "minecraft:calcite": "calcite",
        "minecraft:dripstone_block": "dripstone_block",
      }
    },
    rock: {
      blockSuffix: "_deepslate",
      stateName: "cc:deepslate_type",
      sound: "dig.deepslate",
      variants: {
        "minecraft:deepslate": "deepslate",
        "minecraft:cobbled_deepslate": "cobbled_deepslate",
        "minecraft:polished_deepslate": "polished_deepslate",
        "minecraft:deepslate_bricks": "deepslate_bricks",
        "minecraft:deepslate_tiles": "deepslate_tiles",
        "minecraft:cracked_deepslate_bricks": "cracked_deepslate_bricks",
        "minecraft:cracked_deepslate_tiles": "cracked_deepslate_tiles",
      }
    },
    tuff: {
      blockSuffix: "_tuff",
      stateName: "cc:tuff_type",
      sound: "dig.tuff",
      variants: {
        "minecraft:tuff": "tuff",
        "minecraft:polished_tuff": "polished_tuff",
        "minecraft:tuff_bricks": "tuff_bricks",
        "minecraft:chiseled_tuff": "chiseled_tuff",
        "minecraft:chiseled_tuff_bricks": "chiseled_tuff_bricks",
      }
    }
  },
  copper: {
    copper: {
      blockSuffix: "_copper",
      stateName: "cc:copper_type",
      sound: "dig.copper",
      variants: {
      }
    }
  }
};

// Function to generate texture variants dynamically
function generateTextureVariants() {
  const variants = {};

  // Iterate through each texture category
  for (const [categoryName, category] of Object.entries(textureCategories)) {
    for (const [subcategoryName, subcategory] of Object.entries(category)) {
      const { blockSuffix, stateName, sound, variants: itemVariants } = subcategory;

      // For each item in this subcategory
      for (const [itemId, stateValue] of Object.entries(itemVariants)) {
        // Create entries for each texturable copycat block
        for (const baseCopycatBlock of texturableCopycatBlocks) {
          const targetBlockType = baseCopycatBlock + blockSuffix;

          // Create a unique key for this item-block combination
          const variantKey = `${itemId}:${baseCopycatBlock}`;

          variants[variantKey] = {
            blockType: targetBlockType,
            stateValue: stateValue,
            stateName: stateName,
            sound: sound,
            baseBlock: baseCopycatBlock,
            category: categoryName,
            subcategory: subcategoryName
          };
        }
      }
    }
  }

  return variants;
}

// Generate the texture variants automatically
export const textureVariants = generateTextureVariants();

// Helper function to get texture variant for a specific item and base block
export const getTextureVariantForBlock = (itemId, baseBlockType) => {
  const key = `${itemId}:${baseBlockType}`;
  return textureVariants[key];
};

// Helper function to get all variants for a specific item
export const getTextureVariantsForItem = (itemId) => {
  const variants = {};
  for (const [key, variant] of Object.entries(textureVariants)) {
    if (key.startsWith(itemId + ":")) {
      variants[variant.baseBlock] = variant;
    }
  }
  return variants;
};

// Helper function to add new texture categories
export const addTextureCategory = (categoryName, categoryData) => {
  textureCategories[categoryName] = categoryData;

  // Regenerate texture variants
  const newVariants = generateTextureVariants();
  Object.assign(textureVariants, newVariants);

  console.log(`Added texture category: ${categoryName}`);
};

// Helper function to add new texturable copycat blocks
export const addTexturableCopycatBlock = (blockType) => {
  if (!texturableCopycatBlocks.includes(blockType)) {
    texturableCopycatBlocks.push(blockType);

    // Regenerate texture variants
    const newVariants = generateTextureVariants();
    Object.assign(textureVariants, newVariants);

    console.log(`Added texturable copycat block: ${blockType}`);
  }
};

// Debug function to log all generated variants
export const logTextureVariants = () => {
  console.log("Generated texture variants:");
  for (const [key, variant] of Object.entries(textureVariants)) {
    console.log(`${key} -> ${variant.blockType} (${variant.stateValue})`);
  }
};