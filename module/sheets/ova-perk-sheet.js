import BaseItemSheet from "./base-item-sheet.js";

export default class OVAPerkSheet extends BaseItemSheet {

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "perk"],
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/sheets/ova-perk-sheet.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.config = CONFIG.OVA;
    return context;
  }
}