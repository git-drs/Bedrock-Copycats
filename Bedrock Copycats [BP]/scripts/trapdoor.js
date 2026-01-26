import { world } from "@minecraft/server";

/** @type {import("@minecraft/server").BlockCustomComponent} */
const BlockToggleableComponent = {
    onPlayerInteract({ block, dimension }) {
        // Get the current state of the trapdoor
        const currentValue = block.permutation.getState("cc:open");
        const toggledValue = !currentValue;

        // Toggle the state
        block.setPermutation(block.permutation.withState("cc:open", toggledValue));
        
        // Play the appropriate sound
        const toggleSound = toggledValue ? "open.wooden_trapdoor" : "close.wooden_trapdoor";
        dimension.playSound(toggleSound, block.center());
    },
};

// Register the custom component using world.beforeEvents.worldInitialize
world.beforeEvents.worldInitialize.subscribe((initEvent) => {
    initEvent.blockComponentRegistry.registerCustomComponent("cc:toggleable", BlockToggleableComponent);
    console.log("Successfully registered cc:toggleable component");
});