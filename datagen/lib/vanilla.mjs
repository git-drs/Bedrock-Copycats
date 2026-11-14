// vanilla.mjs - load the vanilla data the generator derives everything from.
//
//  Mojang/bedrock-samples (official):
//    resource_pack/blocks.json                      per-block sound + per-face texture short names
//    resource_pack/textures/terrain_texture.json    short name -> texture file(s)
//    resource_pack/sounds.json                      block_sounds: place / break / trapdoor events
//    resource_pack/texts/en_US.lang                 display names
//    resource_pack/manifest.json                    min_engine_version = game version of the snapshot
//    metadata/vanilladata_modules/mojang-blocks.json, mojang-items.json   every block / item id
//  PrismarineJS/minecraft-data (community, tracks Bedrock releases):
//    blocks.json            transparent / emitLight / hardness
//    blockCollisionShapes   real collision boxes -> tells us which blocks are full cubes
import { parseJsonc, sha256, stripNs, cmpVersion } from "./util.mjs";

export async function loadVanilla(dl, cfg, log) {
  const s = cfg.source;
  const samples = `https://raw.githubusercontent.com/${s.samples.repo}/${s.samples.ref}`;
  const hashes = {};
  const get = async (name, url) => {
    const buf = await dl.buffer(url);
    hashes[name] = sha256(buf);
    return buf.toString("utf8");
  };

  const [manifestT, blocksT, terrainT, soundsT, langT, mBlocksT, mItemsT] = await Promise.all([
    get("rp_manifest", `${samples}/resource_pack/manifest.json`),
    get("blocks.json", `${samples}/resource_pack/blocks.json`),
    get("terrain_texture.json", `${samples}/resource_pack/textures/terrain_texture.json`),
    get("sounds.json", `${samples}/resource_pack/sounds.json`),
    get("en_US.lang", `${samples}/resource_pack/texts/en_US.lang`),
    get("mojang-blocks.json", `${samples}/metadata/vanilladata_modules/mojang-blocks.json`),
    get("mojang-items.json", `${samples}/metadata/vanilladata_modules/mojang-items.json`),
  ]);

  const manifest = parseJsonc(manifestT);
  const engineVersion = manifest.header.min_engine_version.join(".");

  // --- minecraft-data: pick the newest Bedrock data set that is <= the snapshot's version
  const mcdBase = `https://raw.githubusercontent.com/${s.minecraftData.repo}/${s.minecraftData.ref}/data`;
  const dataPaths = parseJsonc(await get("mcd_dataPaths.json", `${mcdBase}/dataPaths.json`)).bedrock;
  const versions = Object.keys(dataPaths).filter((v) => /^\d+\.\d+\.\d+$/.test(v) && dataPaths[v].blocks && dataPaths[v].blockCollisionShapes);
  versions.sort(cmpVersion);
  const usable = versions.filter((v) => cmpVersion(v, engineVersion) <= 0);
  const mcdVersion = usable.length ? usable[usable.length - 1] : versions[versions.length - 1];
  const exact = mcdVersion === engineVersion;
  const mcdBlocks = parseJsonc(await get("mcd_blocks.json", `${mcdBase}/${dataPaths[mcdVersion].blocks}/blocks.json`));
  const collision = parseJsonc(await get("mcd_collision.json", `${mcdBase}/${dataPaths[mcdVersion].blockCollisionShapes}/blockCollisionShapes.json`));

  const blocksJson = parseJsonc(blocksT);
  const terrain = parseJsonc(terrainT).texture_data;
  const blockSounds = parseJsonc(soundsT).block_sounds;

  const lang = new Map();
  for (const line of langT.split(/\r?\n/)) {
    const m = line.match(/^([^=#]+)=(.*?)(?:\t+#.*)?$/);
    if (m) lang.set(m[1].trim(), m[2].trim());
  }

  const mojangBlocks = parseJsonc(mBlocksT).data_items;
  const mojangItems = parseJsonc(mItemsT).data_items;

  return {
    engineVersion,
    mcdVersion,
    mcdExact: exact,
    hashes,
    blocksJson,
    terrain,
    blockSounds,
    lang,
    blockNames: mojangBlocks.map((b) => stripNs(b.name)).sort(),
    itemNames: new Set(mojangItems.map((i) => stripNs(i.name))),
    mcd: new Map(mcdBlocks.map((b) => [b.name, b])),
    collisionBlocks: collision.blocks,
    collisionShapes: collision.shapes,
  };
}
