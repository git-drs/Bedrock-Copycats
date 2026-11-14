// main.js - entry point. Wires the systems together; all logic lives in core/ and systems/.
import { world, ItemStack } from "@minecraft/server";
import { WRENCH_ID } from "./config.js";
import { onBlockInteract } from "./core/compat.js";
import { isCopycat, isVariant, getMaterialItem, MATERIAL_STATE } from "./core/registry.js";
import { handleTexturing } from "./systems/texturing.js";
import { handleWrench } from "./systems/wrench.js";
import { runVersionCheck } from "./systems/versionCheck.js";
import { initLadderSystem } from "./systems/ladder.js";
import "./systems/trapdoor.js";
import "./systems/connections.js";

export * from "./api.js";

initLadderSystem();

onBlockInteract((ctx) => {
  if (!ctx.item?.typeId || !ctx.block?.typeId || !ctx.player?.id) return;
  if (!isCopycat(ctx.block.typeId)) return;
  if (ctx.item.typeId === WRENCH_ID) handleWrench(ctx);
  else handleTexturing(ctx);
});

// Refund applied material block when broken in Survival
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, dimension, player } = event;
  const typeId = brokenBlockPermutation.type.id;

  if (isVariant(typeId)) {
    try {
      if (player?.getGameMode && player.getGameMode() === "creative") return;
    } catch (_) {}

    const stateValue = brokenBlockPermutation.getState(MATERIAL_STATE);
    const materialItem = getMaterialItem(typeId, stateValue);
    if (materialItem) {
      try {
        dimension.spawnItem(new ItemStack(materialItem, 1), {
          x: block.location.x + 0.5,
          y: block.location.y + 0.5,
          z: block.location.z + 0.5,
        });
      } catch (e) {
        console.warn(`[copycat] failed to refund broken block material: ${e}`);
      }
    }
  }
});

runVersionCheck();
