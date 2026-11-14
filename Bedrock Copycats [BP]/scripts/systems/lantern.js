// systems/lantern.js - standing vs hanging placement handler for copycat lantern
import { onStartup } from "../core/compat.js";

const LanternComponent = {
  beforeOnPlayerPlace(event) {
    try {
      const isHanging = event.face.toLowerCase() === "down";
      event.permutationToPlace = event.permutationToPlace.withState("cc:hanging", isHanging);
    } catch (e) {
      console.warn(`[copycat] lantern placement failed: ${e}`);
    }
  }
};

onStartup((e) => {
  e.blockComponentRegistry.registerCustomComponent("cc:lantern", LanternComponent);
});
