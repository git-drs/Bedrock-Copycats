# Bedrock Copycats: Expansion Tracker & Behavior Master Plan

This tracker records the roadmap, technical specifications, planning subagent outputs, sequential implementation progress, datagen integration, and git release tracking for adding all missing copycat blocks to **Bedrock-Copycats**.

Target Repository: `https://github.com/git-drs/Bedrock-Copycats`  
Working Branch: `feat/all-copycat-blocks`  
Status: **Phase 1 - Planning & Architectural Design**

---

## 1. Master Block Inventory & Implementation Status

| # | Block ID | Family | Texturable? | Geometry Source | Permutations / States | Script Logic | Status |
|---|---|---|---|---|---|---|---|
| 1 | `cc:copycat_door` | Enclosures | Yes | Custom 2-part Geo / Bedrock door model | `minecraft:cardinal_direction`, `cc:half` (upper/lower), `cc:hinge` (left/right), `cc:open` | 2-block multiblock placement, breaking sync, open toggle, hinge mirror | ⏳ Planned |
| 2 | `cc:copycat_bars` | Enclosures | Yes | 4-way lattice geo (center + 4 wings) | `cc:north_connected`, `cc:south_connected`, `cc:east_connected`, `cc:west_connected` | Dynamic 4-way connection via `connections.js` | ⏳ Planned |
| 3 | `cc:copycat_wall` | Enclosures | Yes | Post + 4 connecting walls | `cc:wall_post`, `cc:north`, `cc:south`, `cc:east`, `cc:west` | Dynamic wall connections, 24px collision height | ⏳ Planned |
| 4 | `cc:copycat_fence_gate` | Enclosures | Yes | Gate frame + dual swing leaves | `minecraft:cardinal_direction`, `cc:open`, `cc:in_wall` | Swing away from player, connect to fences/walls | ⏳ Planned |
| 5 | `cc:copycat_vertical_slab` | Structural | Yes | 8x16x16 vertical half cube | `minecraft:cardinal_direction` | 4 cardinal wall-mounted slab placements | ⏳ Planned |
| 6 | `cc:copycat_step` | Structural | Yes | 8x8x16 quarter step | `minecraft:cardinal_direction`, `cc:vertical_half` | 8-orientation quarter-block stair step | ⏳ Planned |
| 7 | `cc:copycat_ladder` | Structural | Yes | 1-pixel flat wall rung lattice | `minecraft:cardinal_direction` | Climbable wall ladder, no collision | ⏳ Planned |
| 8 | `cc:copycat_chain` | Structural | Yes | 4x4 centered link geometry | `cc:axis` (`x`, `y`, `z`) | 3-axis orientation (hanging / horizontal) | ⏳ Planned |
| 9 | `cc:copycat_layer` | Interactive | Yes | 16x(2..16)x16 stacked slices | `cc:height` (1 to 8) | Stacking on right-click, stepped collision | ⏳ Planned |
| 10 | `cc:copycat_lantern` | Interactive | Yes | Lantern body + standing/hanging finial | `cc:hanging` (true/false) | Standing vs hanging, `minecraft:light_emission: 15` | ⏳ Planned |
| 11 | `cc:copycat_pressure_plate` | Interactive | Yes | Floor plate (1px raised vs flat) | `cc:pressed` (true/false) | Entity stepping detection, sound, unpress | ⏳ Planned |
| 12 | `cc:copycat_button` | Interactive | Yes | Small button box (face + wall) | `minecraft:block_face`, `minecraft:cardinal_direction`, `cc:pressed` | 30-tick pulse timer, click sounds | ⏳ Planned |

---

## 2. Planning Subagent Assignments

We divide the planning across 3 dedicated specialized subagents:
1. **Agent 1: Enclosures & Multiblock Mechanisms** (`copycat_door`, `copycat_fence_gate`, `copycat_bars`, `copycat_wall`)
   - Detailed collision/selection box geometry specifications.
   - Script multiblock synchronization: door lower/upper pair placement, breaking cascade, texturing cascade.
   - Open/close state transitions, sound definitions, and hinge side calculation.
   - Dynamic 4-way connection algorithms matching vanilla bars and walls.
2. **Agent 2: Structural & Architectural Elements** (`copycat_vertical_slab`, `copycat_step`, `copycat_ladder`, `copycat_chain`)
   - Rotational traits (`minecraft:placement_direction`, cardinal orientation).
   - Blockbench geometry bone hierarchy and UV unwrapping for copycat texturing.
   - Climbable behavior for ladder (`tag:climbable`, `minecraft:climber` or custom player velocity handling).
   - Axis placement traits for chain.
3. **Agent 3: Stackable, Utility & Interactive Devices** (`copycat_layer`, `copycat_lantern`, `copycat_pressure_plate`, `copycat_button`)
   - Stacking mechanics for layers (handling item consumption and height state increments).
   - Light emission components and ceiling vs floor attachment for lantern.
   - Pressure plate entity detection (custom component vs entity tick query).
   - Button pulse timing, attachment directions (ceiling, floor, wall).

---

## 3. Implementation Workflow Rules

Each block MUST follow this strict sequential lifecycle:
1. **Geometry Model**: Authored in `Bedrock Copycats [RP]/models/blocks/copycat_<shape>.geo.json` with per-face UV material instance tagging (`north`, `south`, `east`, `west`, `up`, `down`).
2. **Base Block Definition**: Authored in `Bedrock Copycats [BP]/blocks/copycat/base/copycat_<shape>.block.json` with format version `1.21.70` (or `1.21.130` for compound collision), traits, states, permutations, and loot component.
3. **Loot Table**: Defined in `Bedrock Copycats [BP]/loot_tables/blocks/copycat_<shape>.json`.
4. **Script Mechanics**: Wired into `scripts/systems/` (e.g., `multiblock.js`, `connections.js`, `transform.js`, `texturing.js`, `wrench.js`).
5. **Datagen Pipeline Validation**: Run `node datagen/run.mjs --check` to verify no schema errors, state conflicts, or missing geometries.
6. **Full Variant Generation**: Run `npm run datagen` (emits all 87 material variant blocks, updates `scripts/generated/registry.js`, updates `blocks.json`, updates `en_US.lang`, and auto-deploys to `games/com.mojang/`).
7. **Git Commit**: Commit the completed, tested block with an informative commit message.

---

## 4. Execution Log

- **Step 0**: Initial repository state reset to `origin/main`, branch `feat/all-copycat-blocks` created.
- **Step 1**: Datagen pipeline fixed (format version >= 1.21.70 for isotropic, minimum 2 enum state values, auto-deploy to com.mojang).
- **Step 2**: Survival economy implemented (item deduction, refunds on wrench/re-texture, block break drop).
- **Step 3**: Stair corner connection algorithm implemented in `connections.js`.
- **Step 4**: Baseline committed and pushed to `origin/feat/all-copycat-blocks`.
- **Step 5**: Planning Subagents launched for Families A, B, and C.
