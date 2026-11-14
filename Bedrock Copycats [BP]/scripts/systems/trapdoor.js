// systems/trapdoor.js - the cc:toggleable custom component (open/close) with the material's own trapdoor sounds.
import { TOGGLE_COMPONENT } from "../config.js";
import { onStartup } from "../core/compat.js";
import { getSounds } from "../core/registry.js";
import { playSound } from "../core/sound.js";

const Toggleable = {
  onPlayerInteract({ block, dimension }) {
    const open = !block.permutation.getState("cc:open");
    block.setPermutation(block.permutation.withState("cc:open", open));
    const sounds = getSounds(block.typeId);
    playSound(dimension, block.location, open ? sounds.trapdoorOpen : sounds.trapdoorClose);
  },
};

onStartup((e) => e.blockComponentRegistry.registerCustomComponent(TOGGLE_COMPONENT, Toggleable));
