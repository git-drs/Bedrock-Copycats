# Datagen Architecture & Feature Comparison

A detailed evaluation comparing the datagen systems in **`Bedrockaddon`** (Node.js engine) and **`Bedrock Copycats`** (Python engine).

---

## Executive Summary: Is `Bedrockaddon` Better Overall?

**Yes, `Bedrockaddon`'s datagen architecture is significantly more advanced, robust, and accurate overall.** 

It eliminates guesswork by querying real vanilla metadata, pixel alpha data, and collision bounding boxes. However, **`Bedrock Copycats`** has intuitive category-based naming (`planks`, `wool`, etc.) and active in-game runtime scripts (stair connection states, fence neighbor linking, wrench handling) that should be retained.

The ideal outcome is **taking the missing generation features and blocks from `Bedrockaddon` and bringing them into `Bedrock Copycats`**.

---

## Feature-by-Feature Matrix

| Feature / Capability | `Bedrockaddon` (Node.js) | `Bedrock Copycats` (Python) | Winner / Advantage |
| :--- | :--- | :--- | :--- |
| **Vanilla Material Coverage** | **450 materials** verified from vanilla data | 409 items (misses 52 valid full cubes) | 🏆 **`Bedrockaddon`** |
| **Cube Detection Accuracy** | **PrismarineJS collision boxes** (`[0,0,0,1,1,1]`) | Regex / keyword blacklist heuristics | 🏆 **`Bedrockaddon`** (no false exclusions) |
| **Item Form Validation** | Checks `mojang-items.json` (guarantees survival item exists) | Assumes item exists based on name | 🏆 **`Bedrockaddon`** |
| **Pixel Alpha & Render Method** | **Decodes PNG / TGA alpha channels** (`imagealpha.mjs`) | Heuristic substring matching (`if 'glass' in name`) | 🏆 **`Bedrockaddon`** |
| **Model Geometry UV Face Tagging** | **Auto-patches all 12 copycat models** (1,697 faces) with `material_instance` | None (models lack `material_instance` on UV faces) | 🏆 **`Bedrockaddon`** (Critical for multi-face rendering) |
| **Light Emission on Permutations** | **Extracts `emitLight`** and emits `minecraft:light_emission` (1–15) | Completely omitted (all variant blocks have light 0) | 🏆 **`Bedrockaddon`** |
| **Localization (`en_US.lang`)** | Auto-merges all variant block names between markers | Omitted (variants display raw `%tile.cc:...` keys) | 🏆 **`Bedrockaddon`** |
| **Isotropic Texturing** | Propagates `"isotropic": true` from vanilla | Omitted | 🏆 **`Bedrockaddon`** |
| **World Save Stability (`lock.json`)** | Pins material slots permanently; retired materials preserved | Dynamic chunk indices may shift state order | 🏆 **`Bedrockaddon`** |
| **Block Naming Convention** | By `sound + render` (`cc:copycat_block__stone_0`) | By theme category (`cc:copycat_block_planks`) | 🤝 **`Bedrock Copycats`** (More human-readable) |
| **Script Runtime Integration** | Lean registry object (`REGISTRY`) | O(1) maps (`ITEM_TO_VARIANT`, `VARIANT_TO_ITEM`) + Neighbor/Stair logic | 🤝 **`Bedrock Copycats`** (Tailored for active gameplay) |

---

## Deep Dive: Critical Advantages in `Bedrockaddon`

### 1. Model UV Geometry Face Tagging (`planGeometryPatches`)
* **The Problem in `Bedrock Copycats`:** In Bedrock Edition, defining `up`, `down`, `north`, `south`, etc. in `minecraft:material_instances` does **nothing** unless the `.geo.json` model explicitly attaches `"material_instance": "<face>"` to each cube UV face. `Bedrock Copycats` models lacked this tag across all 12 geometry files.
* **The `Bedrockaddon` Solution:** The datagen scans `copycat_*.geo.json` and automatically injects `"material_instance": face` onto 1,697 cube faces safely and idempotently.

### 2. Light Emission Generation
* **The Problem in `Bedrock Copycats`:** If a player textures a copycat block with Glowstone, Sea Lantern, Shroomlight, or Froglights, it remains completely dark.
* **The `Bedrockaddon` Solution:** Automatically extracts light emission levels from vanilla metadata and injects `"minecraft:light_emission": <level>` into the variant permutations.

### 3. The 52 Missing Full Cube Blocks
`Bedrock Copycats`'s `auto_detector.py` used substring filtering (`"bubble"`, `"fire"`, `"shulker"`, `"spawner"`, etc.) which accidentally filtered out legitimate 1x1x1 solid blocks. `Bedrockaddon` includes all 52:
* **Light Blocks:** `ochre_froglight`, `pearlescent_froglight`, `verdant_froglight`, `shroomlight`, `sea_lantern`
* **Corals:** `bubble_coral_block`, `fire_coral_block`, `dead_bubble_coral_block`, `dead_fire_coral_block`
* **Shulker Boxes:** All 16 dyed colors + `undyed_shulker_box`
* **Redstone / Utility:** `crafter`, `dispenser`, `dropper`, `observer`, `piston`, `sticky_piston`, `tnt`, `respawn_anchor`
* **Roots:** `dirt_with_roots`, `mangrove_roots`, `muddy_mangrove_roots`
* **Spawners & Vaults:** `mob_spawner`, `trial_spawner`, `vault`
* **Decorative Solids:** `snow`, `dragon_egg`, `chorus_flower`, `mushroom_stem`, `budding_amethyst`, `beacon`, `potent_sulfur`, `azalea`, `flowering_azalea`, `bedrock`, `allow`, `deny`

### 4. Real Pixel Alpha Analysis
Instead of guessing whether a block should render as `opaque`, `alpha_test`, or `blend` based on its name, `Bedrockaddon` reads the raw image bytes:
* If all pixels are alpha 255 $\rightarrow$ `opaque`
* If pixels are strictly 0 or 255 $\rightarrow$ `alpha_test`
* If pixels contain fractional alpha (translucency) $\rightarrow$ `blend`

---

## Recommended Action Plan

To get the best of both worlds:
1. **Bring the 52 missing vanilla materials** into `Bedrock Copycats/datagen/categories.json`.
2. **Add Geometry Face Patching** into `Bedrock Copycats` datagen to fix multi-face texturing for logs, crafting tables, etc.
3. **Add Light Emission Injection** into `Bedrock Copycats` datagen so light-emitting copycats glow.
4. **Add `en_US.lang` Name Generation** into `Bedrock Copycats` datagen so variant blocks have clean in-game names.
5. **Add Isotropic Texture Support** to prevent texture grid seams on stone, sand, and leaves.
6. **Fix `auto_detector.py`** so its blacklist doesn't prune valid full blocks in future scans.
