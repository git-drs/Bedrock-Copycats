// main.js - entry point. Wires the systems together; all logic lives in core/ and systems/.
import { world, ItemStack } from "@minecraft/server";
import { WRENCH_ID } from "./config.js";
import { onBlockInteract } from "./core/compat.js";
import { isCopycat, isVariant, getMaterialItem, getShapeId, MATERIAL_STATE } from "./core/registry.js";
import { handleTexturing } from "./systems/texturing.js";
import { handleWrench } from "./systems/wrench.js";
import { runVersionCheck } from "./systems/versionCheck.js";
import { initLadderSystem } from "./systems/ladder.js";
import "./systems/trapdoor.js";
import "./systems/fence_gate.js";
import "./systems/door.js";
import "./systems/layer.js";
import "./systems/lantern.js";
import "./systems/pressurePlate.js";
import "./systems/button.js";
import "./systems/connections.js";

export * from "./api.js";

initLadderSystem();

const INTERACTIVE_SHAPES = new Set([
  "cc:copycat_door",
  "cc:copycat_trapdoor",
  "cc:copycat_fence_gate",
  "cc:copycat_button",
]);

onBlockInteract((ctx) => {
  if (!ctx.block?.typeId || !ctx.player?.id) return;
  if (!isCopycat(ctx.block.typeId)) return;

  const isWrench = ctx.item?.typeId === WRENCH_ID;
  const isEmptyHand = !ctx.item?.typeId;

  if (isWrench) {
    handleWrench(ctx);
  } else if (isEmptyHand) {
    const shapeId = getShapeId(ctx.block.typeId);
    if (ctx.player.isSneaking) {
      handleWrench(ctx);
    } else if (isVariant(ctx.block.typeId) && !INTERACTIVE_SHAPES.has(shapeId)) {
      handleWrench(ctx);
    }
  } else {
    handleTexturing(ctx);
  }
});

// Refund applied material block when broken in Survival
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, dimension, player } = event;
  const typeId = brokenBlockPermutation.type.id;
  const shape = getShapeId(typeId);

  // If broken block is a stacked copycat_layer, drop the extra layers
  if (shape === "cc:copycat_layer") {
    const height = brokenBlockPermutation.getState("cc:height") || 1;
    if (height > 1) {
      try {
        if (!player?.getGameMode || player.getGameMode() !== "creative") {
          dimension.spawnItem(new ItemStack("cc:copycat_layer", height - 1), {
            x: block.location.x + 0.5,
            y: block.location.y + 0.5,
            z: block.location.z + 0.5,
          });
        }
      } catch {}
    }
  }

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
