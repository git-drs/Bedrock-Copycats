# Bedrock Copycats: Expansion Tracker & Behavior Master Plan

This tracker records the roadmap, technical specifications, planning subagent outputs, sequential implementation progress, datagen integration, and git release tracking for adding all missing copycat blocks to **Bedrock-Copycats**.

Target Repository: `https://github.com/git-drs/Bedrock-Copycats`  
Working Branch: `feat/all-copycat-blocks`  
Status: **🎉 All 12 Copycat Blocks Fully Implemented, Datagenned, Tested & Deployed**

---

## 1. Master Block Inventory & Implementation Status

| # | Block ID | Family | Texturable? | Geometry File | Base Block JSON | Loot Table | Script Integration | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | `cc:copycat_vertical_slab` | Structural | Yes | `copycat_vertical_slab.geo.json` | `copycat_vertical_slab.block.json` | `copycat_vertical_slab.json` | `transform.js`, `wrench.js` | ✅ Implemented |
| 2 | `cc:copycat_step` | Structural | Yes | `copycat_step.geo.json` | `copycat_step.block.json` | `copycat_step.json` | `transform.js`, `wrench.js` | ✅ Implemented |
| 3 | `cc:copycat_ladder` | Structural | Yes | `copycat_ladder.geo.json` | `copycat_ladder.block.json` | `copycat_ladder.json` | `ladder.js` (climb/sneak) | ✅ Implemented |
| 4 | `cc:copycat_chain` | Structural | Yes | `copycat_chain.geo.json` | `copycat_chain.block.json` | `copycat_chain.json` | `transform.js` (3-axis cycle) | ✅ Implemented |
| 5 | `cc:copycat_bars` | Enclosures | Yes | `copycat_bars.geo.json` | `copycat_bars.block.json` | `copycat_bars.json` | `connections.js` (4-way bars) | ✅ Implemented |
| 6 | `cc:copycat_wall` | Enclosures | Yes | `copycat_wall.geo.json` | `copycat_wall.block.json` | `copycat_wall.json` | `connections.js` (post + 24px col) | ✅ Implemented |
| 7 | `cc:copycat_fence_gate` | Enclosures | Yes | `copycat_fence_gate.geo.json` | `copycat_fence_gate.block.json` | `copycat_fence_gate.json` | `fence_gate.js` (swing/in-wall) | ✅ Implemented |
| 8 | `cc:copycat_door` | Enclosures | Yes | `copycat_door.geo.json` | `copycat_door.block.json` | `copycat_door.json` | `door.js` (2-block multiblock) | ✅ Implemented |
| 9 | `cc:copycat_layer` | Interactive | Yes | `copycat_layer.geo.json` | `copycat_layer.block.json` | `copycat_layer.json` | `layer.js` (1-8 slice stack/drop) | ✅ Implemented |
| 10 | `cc:copycat_lantern` | Interactive | Yes | `copycat_lantern.geo.json` | `copycat_lantern.block.json` | `copycat_lantern.json` | `lantern.js` (hanging/emission 15)| ✅ Implemented |
| 11 | `cc:copycat_pressure_plate`| Interactive| Yes | `copycat_pressure_plate.geo.json` | `copycat_pressure_plate.block.json` | `copycat_pressure_plate.json` | `pressure_plate.js` (step query)| ✅ Implemented |
| 12 | `cc:copycat_button` | Interactive | Yes | `copycat_button.geo.json` | `copycat_button.block.json` | `copycat_button.json` | `button.js` (30-tick pulse) | ✅ Implemented |

---

## 2. Planning Phase Summary (Consolidated Specifications)

All 3 Planning Subagents have delivered comprehensive specifications:

### Family A: Enclosures & Passages
- **`copycat_door`**: Multiblock pair with upper & lower halves (`cc:half`), hinge side calculation (`cc:hinge`), open/close rotation, breaking cascade with drop de-duplication, and synchronized texturing across both halves.
- **`copycat_bars`**: Modular 2-pixel centered lattice with 4-way connections (`cc:north_connected`, etc.) in `connections.js`.
- **`copycat_wall`**: Post state (`cc:wall_post`) + 4-way connections with mandatory **24px collision height** (1.5 blocks) preventing jumping over.
- **`copycat_fence_gate`**: Cardinal placement, swings away from player, lowers height (`cc:in_wall`) next to stone walls, disables collision when opened.

### Family B: Structural & Architectural Elements
- **`copycat_vertical_slab`**: 8x16x16 vertical half block against 4 cardinal faces, rotating with wrench.
- **`copycat_step`**: 8-orientation quarter-step (lower 4 cardinal, upper 4 cardinal) with stepped collision boxes, wrench rotation & position toggle.
- **`copycat_ladder`**: 3D rung lattice against 4 walls, climbable script logic (`ladder.js`) supporting jump-climbing and sneak-hovering.
- **`copycat_chain`**: Centered 4x4 link geometry supporting 3 axes: Y (vertical hanging), X (east-west), Z (north-south) with wrench axis cycling.

### Family C: Stackable, Utility & Interactive Devices
- **`copycat_layer`**: 16x(2..16)x16 stacked slices with 8 height states. Right-click stacking, survival drop multiplier ($H$ items on break).
- **`copycat_lantern`**: Standing on floor vs hanging from ceiling (`cc:hanging`), finial chain geometry, light emission level 15.
- **`copycat_pressure_plate`**: Floor sensor with unpressed/pressed permutations, entity step-on detection, redstone power 15 output.
- **`copycat_button`**: 6-face attachment (walls, floor, ceiling) with 30-tick auto-reset pulse and click sounds.

---

## 3. Sequential Execution Order

We will build, test, and wire each block **one by one**:
1. `cc:copycat_vertical_slab`
2. `cc:copycat_step`
3. `cc:copycat_chain`
4. `cc:copycat_ladder`
5. `cc:copycat_bars`
6. `cc:copycat_wall`
7. `cc:copycat_fence_gate`
8. `cc:copycat_door`
9. `cc:copycat_layer`
10. `cc:copycat_lantern`
11. `cc:copycat_pressure_plate`
12. `cc:copycat_button`

For each block, the full lifecycle is:
`Model Geo JSON` ➔ `Base Block JSON` ➔ `Loot Table JSON` ➔ `Script Handler` ➔ `Datagen Check & Build` ➔ `Git Commit`

---

## 4. Execution Log

- **Step 0**: Repository synced with `origin/main`, branch `feat/all-copycat-blocks` created.
- **Step 1**: Datagen pipeline fixed (isotropic format version >= 1.21.70, minimum 2 enum values, auto-deploy).
- **Step 2**: Survival economy implemented (refund on break/wrench, item deduction on texturing).
- **Step 3**: Stair corner connection algorithm implemented in `connections.js`.
- **Step 4**: Baseline committed (`5c239b2`) and pushed to `origin/feat/all-copycat-blocks` on GitHub.
- **Step 5**: Planning Subagents executed and consolidated.
- **Step 6**: Sequential construction initialized and executed one by one:
  1. `cc:copycat_vertical_slab`: 8x16x16 cardinal traits, 87 variants, auto-deploy. (Commit: `ecc1288`)
  2. `cc:copycat_step`: 8-orientation quarter-step with stepped collision boxes, wrench rotation & position toggle, 87 variants. (Commit: `0243c49`)
  3. `cc:copycat_chain`: 3-axis rotation (Y hanging, X east-west, Z north-south) with wrench axis cycling, 87 variants. (Commit: `2c25cb3`)
  4. `cc:copycat_ladder`: 3D rung lattice against 4 walls, climbable script logic (`ladder.js`) supporting jump-climbing and sneak-hovering, 87 variants. (Commit: `50ca309`)
  5. `cc:copycat_bars`: 4-way dynamic connections (`connections.js`), 15 connection permutations, 87 variants. (Commit: `b609bf7`)
  6. `cc:copycat_wall`: Post state (`cc:wall_post`) + 4-way connections with 24px collision height (1.5 blocks), 87 variants. (Commit: `8059f60`)
  7. `cc:copycat_fence_gate`: Cardinal placement, directional swing away from player, height lowering (`cc:in_wall`) next to stone walls, collision disable when open, 87 variants. (Commit: `5469ad3`)
  8. `cc:copycat_door`: 2-block multiblock pair (`cc:half`: upper/lower), hinge calculation (`cc:hinge`: left/right), synchronized open/close, breaking cascade with duplicate drop prevention, synchronized material texturing, 87 variants. (Commit: `2de2299`)
  9. `cc:copycat_layer`: 16x(2..16)x16 stacked slices with 8 height states, right-click stacking, survival drop multiplier ($H$ items on break), sneak-wrench refund $H$ items, 87 variants. (Commit: `3b1b876`)
  10. `cc:copycat_lantern`: Standing on floor vs hanging from ceiling (`cc:hanging`), finial chain geometry, light emission level 15, 87 variants. (Commit: `3a5a368`)
  11. `cc:copycat_pressure_plate`: Floor sensor with unpressed/pressed permutations, entity step-on detection (`pressurePlate.js`), redstone power 15 output, 87 variants. (Commit: `d07f5a5`)
  12. `cc:copycat_button`: 6-face attachment (walls, floor, ceiling), 30-tick pulse timer with click sounds (`button.js`), relative face redstone powering, 87 variants. (Commit: `6782350`)
- **Step 7**: Datagen check verified 24 texturable shapes, 87 material groups, and 2,088 generated block variants.
- **Step 8**: All commits pushed to GitHub repository `git-drs/Bedrock-Copycats` on branch `feat/all-copycat-blocks`.
- **Step 9**: In-game validation fixes: adjusted `copycat_fence_gate` bounding boxes for `cc:in_wall` state to prevent negative origin coordinates, and bumped format version to `1.21.120` for `copycat_button` and `copycat_pressure_plate` to enable `minecraft:redstone_producer`. (Commit: `543edaa`)
- **Step 10**: Official Java Create Model Conversion: Downloaded source models from official `copycats-plus/copycats` and `Creators-of-Create/Create` repositories. Converted all 12 block models to Bedrock format following Blockbench's conversion engine with exact sub-quadrant slicing, directional face UV mappings, and multi-permutation states. Regenerated all 2,088 block definitions and verified 0 errors.

