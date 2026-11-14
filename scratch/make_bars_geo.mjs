// scratch/make_bars_geo.mjs
import fs from "fs";
import path from "path";

// 1. Center post: [-1, 0, -1] size [2, 16, 2]
const POST_CUBE = {
  origin: [-1, 0, -1],
  size: [2, 16, 2],
  uv: {
    north: { uv: [7, 0], uv_size: [2, 16], material_instance: "north" },
    south: { uv: [7, 0], uv_size: [2, 16], material_instance: "south" },
    west:  { uv: [7, 0], uv_size: [2, 16], material_instance: "west" },
    east:  { uv: [7, 0], uv_size: [2, 16], material_instance: "east" },
    up:    { uv: [7, 7], uv_size: [2, 2], material_instance: "up" },
    down:  { uv: [7, 7], uv_size: [2, 2], material_instance: "down" }
  }
};

// 2. North arm: Z in [-8, -1]
const NORTH_ARM_CUBES = [
  // Vertical post in North arm: Z in [-6, -4]
  {
    origin: [-1, 0, -6],
    size: [2, 16, 2],
    uv: {
      north: { uv: [7, 0], uv_size: [2, 16], material_instance: "north" },
      south: { uv: [7, 0], uv_size: [2, 16], material_instance: "south" },
      west:  { uv: [2, 0], uv_size: [2, 16], material_instance: "west" },
      east:  { uv: [12, 0], uv_size: [2, 16], material_instance: "east" },
      up:    { uv: [7, 2], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [7, 2], uv_size: [2, 2], material_instance: "down" }
    }
  },
  // Upper crossbar in North arm: Z in [-4, -1], Y in [12, 14]
  {
    origin: [-1, 12, -4],
    size: [2, 2, 3],
    uv: {
      north: { uv: [7, 2], uv_size: [2, 2], material_instance: "north" },
      south: { uv: [7, 2], uv_size: [2, 2], material_instance: "south" },
      west:  { uv: [4, 2], uv_size: [3, 2], material_instance: "west" },
      east:  { uv: [9, 2], uv_size: [3, 2], material_instance: "east" },
      up:    { uv: [7, 4], uv_size: [2, 3], material_instance: "up" },
      down:  { uv: [7, 4], uv_size: [2, 3], material_instance: "down" }
    }
  },
  // Middle crossbar extension to block edge: Z in [-8, -6], Y in [7, 9]
  {
    origin: [-1, 7, -8],
    size: [2, 2, 2],
    uv: {
      north: { uv: [7, 7], uv_size: [2, 2], material_instance: "north" },
      south: { uv: [7, 7], uv_size: [2, 2], material_instance: "south" },
      west:  { uv: [0, 7], uv_size: [2, 2], material_instance: "west" },
      east:  { uv: [14, 7], uv_size: [2, 2], material_instance: "east" },
      up:    { uv: [7, 0], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [7, 0], uv_size: [2, 2], material_instance: "down" }
    }
  }
];

// 3. South arm: Z in [1, 8]
const SOUTH_ARM_CUBES = [
  // Vertical post in South arm: Z in [4, 6]
  {
    origin: [-1, 0, 4],
    size: [2, 16, 2],
    uv: {
      north: { uv: [7, 0], uv_size: [2, 16], material_instance: "north" },
      south: { uv: [7, 0], uv_size: [2, 16], material_instance: "south" },
      west:  { uv: [12, 0], uv_size: [2, 16], material_instance: "west" },
      east:  { uv: [2, 0], uv_size: [2, 16], material_instance: "east" },
      up:    { uv: [7, 12], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [7, 12], uv_size: [2, 2], material_instance: "down" }
    }
  },
  // Lower crossbar in South arm: Z in [1, 4], Y in [2, 4]
  {
    origin: [-1, 2, 1],
    size: [2, 2, 3],
    uv: {
      north: { uv: [7, 12], uv_size: [2, 2], material_instance: "north" },
      south: { uv: [7, 12], uv_size: [2, 2], material_instance: "south" },
      west:  { uv: [9, 12], uv_size: [3, 2], material_instance: "west" },
      east:  { uv: [4, 12], uv_size: [3, 2], material_instance: "east" },
      up:    { uv: [7, 9], uv_size: [2, 3], material_instance: "up" },
      down:  { uv: [7, 9], uv_size: [2, 3], material_instance: "down" }
    }
  },
  // Middle crossbar extension to block edge: Z in [6, 8], Y in [7, 9]
  {
    origin: [-1, 7, 6],
    size: [2, 2, 2],
    uv: {
      north: { uv: [7, 7], uv_size: [2, 2], material_instance: "north" },
      south: { uv: [7, 7], uv_size: [2, 2], material_instance: "south" },
      west:  { uv: [14, 7], uv_size: [2, 2], material_instance: "west" },
      east:  { uv: [0, 7], uv_size: [2, 2], material_instance: "east" },
      up:    { uv: [7, 14], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [7, 14], uv_size: [2, 2], material_instance: "down" }
    }
  }
];

// 4. West arm: X in [-8, -1]
const WEST_ARM_CUBES = [
  // Vertical post in West arm: X in [-6, -4]
  {
    origin: [-6, 0, -1],
    size: [2, 16, 2],
    uv: {
      north: { uv: [2, 0], uv_size: [2, 16], material_instance: "north" },
      south: { uv: [12, 0], uv_size: [2, 16], material_instance: "south" },
      west:  { uv: [7, 0], uv_size: [2, 16], material_instance: "west" },
      east:  { uv: [7, 0], uv_size: [2, 16], material_instance: "east" },
      up:    { uv: [2, 7], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [2, 7], uv_size: [2, 2], material_instance: "down" }
    }
  },
  // Upper crossbar in West arm: X in [-4, -1], Y in [12, 14]
  {
    origin: [-4, 12, -1],
    size: [3, 2, 2],
    uv: {
      north: { uv: [4, 2], uv_size: [3, 2], material_instance: "north" },
      south: { uv: [9, 2], uv_size: [3, 2], material_instance: "south" },
      west:  { uv: [7, 2], uv_size: [2, 2], material_instance: "west" },
      east:  { uv: [7, 2], uv_size: [2, 2], material_instance: "east" },
      up:    { uv: [4, 7], uv_size: [3, 2], material_instance: "up" },
      down:  { uv: [4, 7], uv_size: [3, 2], material_instance: "down" }
    }
  },
  // Middle crossbar extension to block edge: X in [-8, -6], Y in [7, 9]
  {
    origin: [-8, 7, -1],
    size: [2, 2, 2],
    uv: {
      north: { uv: [0, 7], uv_size: [2, 2], material_instance: "north" },
      south: { uv: [14, 7], uv_size: [2, 2], material_instance: "south" },
      west:  { uv: [7, 7], uv_size: [2, 2], material_instance: "west" },
      east:  { uv: [7, 7], uv_size: [2, 2], material_instance: "east" },
      up:    { uv: [0, 7], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [0, 7], uv_size: [2, 2], material_instance: "down" }
    }
  }
];

// 5. East arm: X in [1, 8]
const EAST_ARM_CUBES = [
  // Vertical post in East arm: X in [4, 6]
  {
    origin: [4, 0, -1],
    size: [2, 16, 2],
    uv: {
      north: { uv: [12, 0], uv_size: [2, 16], material_instance: "north" },
      south: { uv: [2, 0], uv_size: [2, 16], material_instance: "south" },
      west:  { uv: [7, 0], uv_size: [2, 16], material_instance: "west" },
      east:  { uv: [7, 0], uv_size: [2, 16], material_instance: "east" },
      up:    { uv: [12, 7], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [12, 7], uv_size: [2, 2], material_instance: "down" }
    }
  },
  // Lower crossbar in East arm: X in [1, 4], Y in [2, 4]
  {
    origin: [1, 2, -1],
    size: [3, 2, 2],
    uv: {
      north: { uv: [9, 12], uv_size: [3, 2], material_instance: "north" },
      south: { uv: [4, 12], uv_size: [3, 2], material_instance: "south" },
      west:  { uv: [7, 12], uv_size: [2, 2], material_instance: "west" },
      east:  { uv: [7, 12], uv_size: [2, 2], material_instance: "east" },
      up:    { uv: [9, 7], uv_size: [3, 2], material_instance: "up" },
      down:  { uv: [9, 7], uv_size: [3, 2], material_instance: "down" }
    }
  },
  // Middle crossbar extension to block edge: X in [6, 8], Y in [7, 9]
  {
    origin: [6, 7, -1],
    size: [2, 2, 2],
    uv: {
      north: { uv: [14, 7], uv_size: [2, 2], material_instance: "north" },
      south: { uv: [0, 7], uv_size: [2, 2], material_instance: "south" },
      west:  { uv: [7, 7], uv_size: [2, 2], material_instance: "west" },
      east:  { uv: [7, 7], uv_size: [2, 2], material_instance: "east" },
      up:    { uv: [14, 7], uv_size: [2, 2], material_instance: "up" },
      down:  { uv: [14, 7], uv_size: [2, 2], material_instance: "down" }
    }
  }
];

function makeGeo(id, arms) {
  const cubes = [POST_CUBE];
  if (arms.north) cubes.push(...NORTH_ARM_CUBES);
  if (arms.south) cubes.push(...SOUTH_ARM_CUBES);
  if (arms.west)  cubes.push(...WEST_ARM_CUBES);
  if (arms.east)  cubes.push(...EAST_ARM_CUBES);

  return {
    description: {
      identifier: id,
      texture_width: 16,
      texture_height: 16,
      visible_bounds_width: 2,
      visible_bounds_height: 2.5,
      visible_bounds_offset: [0, 0.75, 0]
    },
    bones: [
      {
        name: "bb_main",
        pivot: [0, 0, 0],
        cubes
      }
    ]
  };
}

const geometries = [
  makeGeo("geometry.copycat_bars_post", {}),
  makeGeo("geometry.copycat_bars_n", { north: true }),
  makeGeo("geometry.copycat_bars_s", { south: true }),
  makeGeo("geometry.copycat_bars_ns", { north: true, south: true }),
  makeGeo("geometry.copycat_bars_e", { east: true }),
  makeGeo("geometry.copycat_bars_w", { west: true }),
  makeGeo("geometry.copycat_bars_ew", { east: true, west: true }),
  makeGeo("geometry.copycat_bars_ne", { north: true, east: true }),
  makeGeo("geometry.copycat_bars_nw", { north: true, west: true }),
  makeGeo("geometry.copycat_bars_se", { south: true, east: true }),
  makeGeo("geometry.copycat_bars_sw", { south: true, west: true }),
  makeGeo("geometry.copycat_bars_new", { north: true, east: true, west: true }),
  makeGeo("geometry.copycat_bars_nse", { north: true, south: true, east: true }),
  makeGeo("geometry.copycat_bars_nsw", { north: true, south: true, west: true }),
  makeGeo("geometry.copycat_bars_sew", { south: true, east: true, west: true }),
  makeGeo("geometry.copycat_bars_nsew", { north: true, south: true, east: true, west: true }),

  // Canonical shapes used with block permutations and rotations:
  makeGeo("geometry.copycat_bars_side", { north: true }),
  makeGeo("geometry.copycat_bars_straight", { north: true, south: true }),
  makeGeo("geometry.copycat_bars_side2", { north: true, west: true }),
  makeGeo("geometry.copycat_bars_tee", { north: true, west: true, east: true }),
  makeGeo("geometry.copycat_bars_quad", { north: true, south: true, west: true, east: true })
];

const outJson = {
  format_version: "1.21.20",
  "minecraft:geometry": geometries
};

fs.writeFileSync(
  "Bedrock Copycats [RP]/models/blocks/copycat_bars.geo.json",
  JSON.stringify(outJson, null, "\t") + "\n"
);
console.log(`Generated ${geometries.length} bars geometries successfully!`);
