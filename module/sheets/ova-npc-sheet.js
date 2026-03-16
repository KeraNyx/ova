import OVACharacterSheet from "./ova-character-sheet.js";

export default class OVANPCSheet extends OVACharacterSheet {

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "npc"],
    position: { width: 720, height: 500 },
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/sheets/ova-npc-sheet.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // NPCs treat weaknesses as abilities
    if (Array.isArray(context.weaknesses)) {
      context.abilities.push(...context.weaknesses);
    }

    return context;
  }
}