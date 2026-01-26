import { world, system } from "@minecraft/server";

/**
 * Connection rules enum
 */
const ConnectionRule = {
  SELF: "self",           // Only connects to same block type
  TAG: "tag",             // Connects to blocks with specific tag
  WHITELIST: "whitelist", // Only connects to blocks in allowList
  BLACKLIST: "blacklist"  // Connects to blocks with tag, except those in denyList
};

/**
 * Configuration for block connections
 * Add your blocks here with their connection rules
 */
const BLOCK_CONNECTION_CONFIG = {
  // Example: Copycat fence
  "cc:copycat_fence": {
    rule: ConnectionRule.BLACKLIST,
    tag: "fences",  // Connects to blocks with this tag
    denyList: ["slab", "stair", "trapdoor", "pannel", "board", "beam", "lantern", "torch", "layer", "grass", "pane"],
    directions: ["north", "south", "east", "west"],
    statePrefix: "cc:"  // Use "cc:" prefix for states
  },
  
  // Example: Glass connects only to itself
  "minecraft:glass": {
    rule: ConnectionRule.SELF,
    directions: ["north", "south", "east", "west"],
    statePrefix: ""  // No prefix
  }
};

/**
 * Direction vectors for neighbor checking
 */
const DIRECTIONS = {
  north: { x: 0, y: 0, z: -1 },
  south: { x: 0, y: 0, z: 1 },
  east: { x: 1, y: 0, z: 0 },
  west: { x: -1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  down: { x: 0, y: -1, z: 0 }
};

/**
 * Check if a block should connect based on the connection rule
 */
function shouldConnect(sourceBlock, neighborBlock, config) {
  if (!neighborBlock || neighborBlock.typeId === 'minecraft:air') return false;
  
  const neighborType = neighborBlock.typeId;
  const sourceType = sourceBlock.typeId;

  switch (config.rule) {
    case ConnectionRule.SELF:
      // Only connects to same block type
      return neighborType === sourceType;
    
    case ConnectionRule.TAG:
      // Connects to blocks with specific tag
      try {
        return neighborBlock.hasTag(config.tag);
      } catch (error) {
        return false;
      }
    
    case ConnectionRule.WHITELIST:
      // Only connects to blocks in allowList
      return config.allowList?.includes(neighborType) || false;
    
    case ConnectionRule.BLACKLIST:
      // Check if neighbor has the required tag
      try {
        if (config.tag && !neighborBlock.hasTag(config.tag)) {
          return false;
        }
      } catch (error) {
        return false;
      }
      
      // Check if neighbor type contains any word from denyList
      if (config.denyList) {
        const lowerNeighborType = neighborType.toLowerCase();
        for (const word of config.denyList) {
          if (lowerNeighborType.includes(word.toLowerCase())) {
            return false;
          }
        }
      }
      
      return true;
    
    default:
      return false;
  }
}

/**
 * Get connection states for a block based on its configuration
 */
function getConnectionStates(block, config) {
  const connections = {};
  const dimension = block.dimension;
  const { x, y, z } = block.location;

  for (const direction of config.directions) {
    const offset = DIRECTIONS[direction];
    const neighborPos = {
      x: x + offset.x,
      y: y + offset.y,
      z: z + offset.z
    };

    try {
      const neighbor = dimension.getBlock(neighborPos);
      connections[direction] = shouldConnect(block, neighbor, config);
    } catch (error) {
      connections[direction] = false;
    }
  }

  return connections;
}

/**
 * Update block permutations based on connections
 */
function updateBlockConnections(block) {
  const blockType = block.typeId;
  const config = BLOCK_CONNECTION_CONFIG[blockType];

  if (!config) {
    // Block not configured for connections
    return;
  }

  const connections = getConnectionStates(block, config);

  // Set permutation states
  const permutation = block.permutation;
  let newPermutation = permutation;
  let hasChanged = false;

  const statePrefix = config.statePrefix || "";

  for (const [direction, isConnected] of Object.entries(connections)) {
    const stateName = `${statePrefix}${direction}_connected`;
    try {
      const currentState = newPermutation.getState(stateName);
      if (currentState !== isConnected) {
        newPermutation = newPermutation.withState(stateName, isConnected);
        hasChanged = true;
      }
    } catch (error) {
      console.warn(`Failed to set state ${stateName} for ${blockType}`);
    }
  }

  if (hasChanged) {
    try {
      block.setPermutation(newPermutation);
    } catch (error) {
      console.warn("Failed to set block permutation:", error);
    }
  }
}

/**
 * Update a block and its neighbors
 */
function updateBlockAndNeighbors(block) {
  updateBlockConnections(block);

  const config = BLOCK_CONNECTION_CONFIG[block.typeId];
  if (!config) return;

  const { x, y, z } = block.location;
  const dimension = block.dimension;

  // Update all neighbors that might be affected
  for (const direction of config.directions) {
    const offset = DIRECTIONS[direction];
    const neighborPos = {
      x: x + offset.x,
      y: y + offset.y,
      z: z + offset.z
    };

    try {
      const neighbor = dimension.getBlock(neighborPos);
      if (neighbor && BLOCK_CONNECTION_CONFIG[neighbor.typeId]) {
        updateBlockConnections(neighbor);
      }
    } catch (error) {
      // Neighbor might be unloaded
    }
  }
}

/**
 * Main event handlers
 */
world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const { block } = event;
  system.run(() => {
    updateBlockAndNeighbors(block);
  });
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, dimension } = event;
  const { x, y, z } = block.location;

  system.run(() => {
    // Update all possible neighbors since block is gone
    for (const offset of Object.values(DIRECTIONS)) {
      const neighborPos = {
        x: x + offset.x,
        y: y + offset.y,
        z: z + offset.z
      };

      try {
        const neighbor = dimension.getBlock(neighborPos);
        if (neighbor && BLOCK_CONNECTION_CONFIG[neighbor.typeId]) {
          updateBlockConnections(neighbor);
        }
      } catch (error) {
        // Neighbor might be unloaded
      }
    }
  });
});

/**
 * Helper function to register a block with connection rules
 */
export function registerBlock(blockId, options = {}) {
  const {
    rule = ConnectionRule.SELF,
    tag = "",
    allowList = [],
    denyList = [],
    directions = ["north", "south", "east", "west"],
    statePrefix = ""
  } = options;

  BLOCK_CONNECTION_CONFIG[blockId] = {
    rule,
    tag,
    allowList,
    denyList,
    directions,
    statePrefix
  };
}

/**
 * Export for easy access
 */
export { ConnectionRule };

/**
 * Usage Examples:
 * 
 * // Copycat fence - connects to blocks with "fences" tag, except slabs/stairs
 * registerBlock("cc:copycat_fence", {
 *   rule: ConnectionRule.BLACKLIST,
 *   tag: "fences",
 *   denyList: ["slab", "stair", "trapdoor"],
 *   statePrefix: "cc:"  // Uses cc:north_connected, cc:south_connected, etc.
 * });
 * 
 * // Glass that only connects to itself
 * registerBlock("minecraft:glass", {
 *   rule: ConnectionRule.SELF
 * });
 * 
 * // Pipe that connects to blocks with "pipes" tag
 * registerBlock("custom:pipe", {
 *   rule: ConnectionRule.TAG,
 *   tag: "pipes",
 *   directions: ["north", "south", "east", "west", "up", "down"]
 * });
 * 
 * // Special block with whitelist
 * registerBlock("custom:special", {
 *   rule: ConnectionRule.WHITELIST,
 *   allowList: ["custom:special", "minecraft:stone"]
 * });
 */