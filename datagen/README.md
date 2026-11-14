# datagen

Generates every textured copycat variant block, the script registry, sounds, names and loot from **real vanilla data**.
No dependencies. Node 18+ (`pkg install nodejs` in Termux).

```
node datagen/run.mjs              # regenerate and auto-deploy to games/com.mojang
node datagen/run.mjs --no-deploy  # regenerate without deploying
node datagen/run.mjs --check      # write nothing, exit 1 if anything is out of date
node datagen/run.mjs --watch      # rebuild & deploy on base-block/config edits + poll upstream
node datagen/run.mjs --offline    # use the download cache only
node datagen/run.mjs --refresh    # ignore the cache, re-download
node datagen/run.mjs --stats      # counts only
node datagen/deploy.mjs           # sync BP & RP to development folders directly (dry-run with --dry-run)
```

## What you maintain by hand
| File | Purpose |
|---|---|
| `Bedrock Copycats [BP]/blocks/copycat/base/*.json` | The base shapes. **Single source of truth**: states, traits, permutations, components. Edit, re-run, all variants follow. |
| `Bedrock Copycats [RP]/models/blocks/copycat_*.geo.json` | Geometry. Datagen only adds a `material_instance` per face (idempotent). |
| `datagen/config.json` | Namespace, paths, group size, include/exclude filters. |
| `datagen/overrides.json` | The only hand-written facts (tints, technical blocks, 2 engine-hardcoded blocks). Validated against vanilla data each run. |
| `Bedrock Copycats [BP]/scripts/config.js` | Script tunables and fence connection rules. |

Everything else is generated. **Do not edit** `blocks/copycat/generated/`, `scripts/generated/registry.js`, the generated region of `en_US.lang`, `blocks.json`.

## Where the data comes from (nothing is guessed from names)
| Fact | Source |
|---|---|
| All block / item ids | `Mojang/bedrock-samples` `metadata/vanilladata_modules/mojang-blocks.json`, `mojang-items.json` |
| Game version of the snapshot | `resource_pack/manifest.json` `min_engine_version` |
| Per-face textures, sound | `resource_pack/blocks.json` (blocks without `sound` use the engine default `normal`) |
| Texture short names exist | `resource_pack/textures/terrain_texture.json` |
| Place / trapdoor sounds | `resource_pack/sounds.json` `block_sounds` |
| Full cube? | `PrismarineJS/minecraft-data` bedrock collision shapes (all states must be the unit cube) |
| Light emission | minecraft-data `emitLight` |
| `opaque` / `alpha_test` / `blend` | The **actual texture pixels' alpha** (PNG/TGA decoded locally) |
| Rotate / flip / connections per shape | The base block's own traits and states |

## Why blocks are grouped
A block state enum holds at most 16 values, and `sound` / `render_method` are per block. Materials are bucketed by
(sound, render class) and chunked into groups of 16, giving ids like `cc:copycat_slab__stone_3`. The state is `cc:material`.

## Updating for a new Minecraft version
Just re-run `node datagen/run.mjs` (or leave `--watch` running). It re-downloads changed source files (ETag), then:
- new vanilla blocks get new materials in free slots / new groups, new files are created;
- changed data (a sound, a texture, light level) rewrites only the affected files;
- files are written only when their content changes, and no duplicates are possible (deterministic names, owned directory is pruned);
- `datagen/lock.json` pins each material to its group, so **existing materials never move** and saved worlds keep working.
  **Commit `lock.json` and `manifest.json`.** A material removed by Mojang is "retired": it stays in the enum and renders with the base texture.
- `datagen/REPORT.md` lists new/retired materials, skipped blocks (with reasons) and the full group table.

In game, `systems/versionCheck.js` compares the live block list with the registry and warns in the content log when the
game is newer than the generated data.

## Tuning size
1,000+ blocks is heavy for a phone. Narrow it in `config.json`, then re-run (removed files are pruned):
```json
"materials": { "include": ["_planks$", "^stone", "_wool$", "glass"] },
"shapes":    { "exclude": ["cc:copycat_board"] }
```
