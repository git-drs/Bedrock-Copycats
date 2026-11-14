# Copycat Blocks: Java Comparison & Bedrock Addition Candidates

This document outlines the copycat block ecosystem from Java edition (**Create** and **Create: Copycats+**), compares it with what is currently implemented in this Bedrock addon, and proposes new blocks for addition.

> [!NOTE]
> **How to use this list**:
> Check or uncheck `[ ]` the blocks you want to add, or delete any blocks you don't need. Once you have finalized your choices, let me know and I will implement the selected blocks (geometry, base JSON, datagen integration, script interaction, and loot).

---

## 1. Currently Implemented in This Addon (13 Shapes)

| Block ID | Texturable? | Key Mechanics |
|---|---|---|
| `cc:copycat_block` | Yes | Full 16x16x16 cube. |
| `cc:copycat_slab` | Yes | Vertical half (bottom/top), wrench position toggle. |
| `cc:copycat_stair` | Yes | 5 corner shapes (`straight`, `inner_left`, `inner_right`, `outer_left`, `outer_right`), auto-cornering with adjacent stairs, stepped compound collision. |
| `cc:copycat_slope` | Yes | 45° ramp with 16-step smooth walk-up collision. |
| `cc:copycat_fence` | Yes | 4-way dynamic connections to fences/solid blocks, 1.5-block collision height (24px). |
| `cc:copycat_beam` | Yes | 8x8 center post, 3-axis placement (X, Y, Z cardinal & face). |
| `cc:copycat_beam_corner` | Yes | Vertical L-corner beam. |
| `cc:copycat_beam_horizontal_corner` | Yes | Horizontal L-corner beam. |
| `cc:copycat_pannel` | Yes | 2-pixel thick vertical wall panel, 4 cardinal rotations. |
| `cc:copycat_pannel_horizontal` | Yes | 2-pixel thick horizontal floor/ceiling panel. |
| `cc:copycat_board` | Yes | 2-pixel thin surface sheet/cover. |
| `cc:copycat_trapdoor` | Yes | Top/bottom half, open/closed interaction with sounds. |
| `cc:copycat_table` | No | Decorative untextured utility/crafting base. |

---

## 2. Java Mod Reference (Create & Create: Copycats+)

In Java Edition, copycat blocks originate from two primary mods:
* **Create Base Mod**: Introduced Copycat Step and Copycat Panel.
* **Create: Copycats+ (Addon)**: Expanded the concept to almost all vanilla block shapes (stairs, walls, bars, doors, etc.).

| Java Block Name | Mod Source | Java Behavior | Current Status in Bedrock Addon |
|---|---|---|---|
| **Copycat Block** | Copycats+ | Full cube copycat | **Implemented** (`copycat_block`) |
| **Copycat Slab** | Copycats+ | Half slab (horizontal/vertical) | **Implemented** (`copycat_slab`) |
| **Copycat Stairs** | Copycats+ | Stairs with corners | **Implemented** (`copycat_stair`) |
| **Copycat Slope** | Copycats+ | 45-degree ramp | **Implemented** (`copycat_slope`) |
| **Copycat Beam** | Copycats+ | 8x8 beam, 3-axis | **Implemented** (`copycat_beam`) |
| **Copycat Corner Beam** | Copycats+ | L-shaped beam | **Implemented** (`copycat_beam_corner`) |
| **Copycat Horizontal Corner Beam** | Copycats+ | Horizontal L-beam | **Implemented** (`copycat_beam_horizontal_corner`) |
| **Copycat Panel** | Create / Copycats+ | Thin vertical wall panel | **Implemented** (`copycat_pannel`) |
| **Copycat Horizontal Panel** | Copycats+ | Thin floor/ceiling panel | **Implemented** (`copycat_pannel_horizontal`) |
| **Copycat Board** | Copycats+ | Thin surface cover | **Implemented** (`copycat_board`) |
| **Copycat Fence** | Copycats+ | Connecting fence post + rails | **Implemented** (`copycat_fence`) |
| **Copycat Trapdoor** | Copycats+ | Interactive trapdoor | **Implemented** (`copycat_trapdoor`) |
| **Copycat Door** | Copycats+ | 2-block tall hinged door | **Candidate for Addition** |
| **Copycat Bars** | Copycats+ | 4-way thin pane/bars | **Candidate for Addition** |
| **Copycat Wall** | Copycats+ | Cobblestone-style wall with posts | **Candidate for Addition** |
| **Copycat Fence Gate** | Copycats+ | Swing-open fence gate | **Candidate for Addition** |
| **Copycat Ladder** | Copycats+ | Climbable surface block | **Candidate for Addition** |
| **Copycat Chain** | Copycats+ | Hanging/horizontal chain links | **Candidate for Addition** |
| **Copycat Vertical Step / Slab** | Copycats+ | Vertical half block (16x16x8 against wall) | **Candidate for Addition** |
| **Copycat Layer / Slice** | Copycats+ | Variable height layer (1-8 slices) | **Candidate for Addition** |
| **Copycat Pressure Plate** | Copycats+ | Floor trigger plate | **Candidate for Addition** |
| **Copycat Button** | Copycats+ | Interactive pulse button | **Candidate for Addition** |
| **Copycat Lantern** | Copycats+ | Standing & hanging lantern | **Candidate for Addition** |

---

## 3. Candidate Blocks for Addition to Bedrock

Select which blocks you want implemented. Each entry details the Bedrock mechanics required.

### Tier 1: Highly Requested & High Aesthetic Value

- [ ] **Copycat Door (`cc:copycat_door`)**
  - **Description**: A 2-block tall textured door matching vanilla wooden/iron door mechanics.
  - **Bedrock Mechanics**:
    - Upper and lower block halves (`cc:half`: `upper` / `lower`).
    - Hinge state (`cc:hinge`: `left` / `right`).
    - Open state (`cc:open`: `true` / `false`) with opening/closing rotation and door sound effects.
    - Breaking lower half breaks upper half and drops the item (and vice versa).
  - **Complexity**: Moderate (requires 2-block multi-block handling in script).

- [ ] **Copycat Bars (`cc:copycat_bars`)**
  - **Description**: Iron bars / glass pane style thin central lattice with 4-way dynamic connections.
  - **Bedrock Mechanics**:
    - Connection states: `cc:north_connected`, `cc:south_connected`, `cc:east_connected`, `cc:west_connected`.
    - Auto-connects to adjacent bars, solid blocks, and walls via `connections.js`.
    - Thin 2-pixel wide geometry per direction.
  - **Complexity**: Low-Moderate (reuses proven `connections.js` logic from fences).

- [ ] **Copycat Wall (`cc:copycat_wall`)**
  - **Description**: Cobblestone wall style barrier with center post and adaptive wall height.
  - **Bedrock Mechanics**:
    - 4-way connections (`cc:north`, `cc:south`, `cc:east`, `cc:west`) plus center post state (`cc:up`: `true`/`false`).
    - 1.5-block collision height (24px) preventing mobs from jumping over.
  - **Complexity**: Moderate (requires post + side connection permutations).

- [ ] **Copycat Fence Gate (`cc:copycat_fence_gate`)**
  - **Description**: Swingable gate that connects seamlessly to copycat fences and walls.
  - **Bedrock Mechanics**:
    - Placement direction (cardinal direction).
    - Open/closed state (`cc:open`), swinging away from player.
    - Lowers height slightly when attached to walls (vanilla mechanic).
  - **Complexity**: Low-Moderate.

---

### Tier 2: Utility & Structural Details

- [ ] **Copycat Ladder (`cc:copycat_ladder`)**
  - **Description**: Wall-mounted climbable ladder textured with any vanilla block.
  - **Bedrock Mechanics**:
    - 4 cardinal wall placement directions.
    - No collision box, selection box attached to wall.
    - Script or scaffolding-based climbing support.
  - **Complexity**: Low.

- [ ] **Copycat Vertical Slab / Quarter Block (`cc:copycat_vertical_slab`)**
  - **Description**: A slab standing vertically (8x16x16) placed against walls or dividing rooms.
  - **Bedrock Mechanics**:
    - 4 cardinal directions (`north`, `south`, `east`, `west`).
    - Clean 8-pixel thick collision and selection box.
  - **Complexity**: Very Low.

- [ ] **Copycat Chain (`cc:copycat_chain`)**
  - **Description**: Hanging or horizontal chain links textured with any material.
  - **Bedrock Mechanics**:
    - 3-axis orientation: Y (vertical hanging), X (east-west), Z (north-south).
    - Centered 4x4 link geometry.
  - **Complexity**: Low.

- [ ] **Copycat Layer / Slice (`cc:copycat_layer`)**
  - **Description**: Snow-layer style block where height increases from 2px up to 16px.
  - **Bedrock Mechanics**:
    - Height state: `cc:height` (1 through 8, each adding 2 pixels of height).
    - Stacking: clicking with another copycat adds another layer.
  - **Complexity**: Moderate.

---

### Tier 3: Interactive & Lighting Blocks

- [ ] **Copycat Pressure Plate (`cc:copycat_pressure_plate`)**
  - **Description**: Floor plate that triggers redstone or interaction when stepped on.
  - **Bedrock Mechanics**:
    - Depressed visual permutation when active.
    - Entity detection via script query or custom component.
  - **Complexity**: Moderate.

- [ ] **Copycat Button (`cc:copycat_button`)**
  - **Description**: Wall, floor, or ceiling mounted push-button.
  - **Bedrock Mechanics**:
    - Placement face (`up`, `down`, `wall`) and cardinal direction.
    - Pressed state with automatic reset timer (1-1.5s).
  - **Complexity**: Moderate.

- [ ] **Copycat Lantern (`cc:copycat_lantern`)**
  - **Description**: Standing or ceiling-hanging lantern with customizable texture and light emission.
  - **Bedrock Mechanics**:
    - Hanging vs standing permutation (`cc:hanging`: `true` / `false`).
    - Inherent light emission component (`minecraft:light_emission`: 15).
  - **Complexity**: Low.

---

## 4. Next Steps

1. Open this file in your editor or review the list above.
2. Tell me which blocks you want to add (e.g., *"Add copycat door and copycat bars"* or specify your selection).
3. Once confirmed, I will:
   - Create the Blockbench geometry models in RP (`models/blocks/copycat_<shape>.geo.json`).
   - Create the base block definitions in BP (`blocks/copycat/base/copycat_<shape>.block.json`).
   - Add any script event handlers needed (e.g., door 2-block sync, bars connections).
   - Re-run datagen to generate all 87 material variant blocks for each new shape.
   - Deploy directly to your development folders and verify in-game.
