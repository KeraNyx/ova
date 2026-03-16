import BaseItemSheet from "./base-item-sheet.js";

export default class OVAAttackSheet extends BaseItemSheet {

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "attack"],
    actions: {
      selectAbility: OVAAttackSheet._onSelectAbility
    }
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/sheets/ova-attack-sheet.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.config = CONFIG.OVA;
    context.selected = this.item.system.abilities ?? [];

    context.abilities = (this.item.actor?.items ?? [])
      .filter(i => i.type === "ability" && i.system.rootId === "")
      .sort((a, b) => {
        if (a.system.type === b.system.type) return a.name.localeCompare(b.name);
        return (a.system.type ?? "").localeCompare(b.system.type ?? "");
      });

    return context;
  }

  /** -------------------------------------------- */
  /** Event Listeners                              */
  /** -------------------------------------------- */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll(".selectable .ability-description")
      .forEach(el => el.addEventListener("click", this._selectAbility.bind(this)));
  }

  /** -------------------------------------------- */
  /** Select Ability                               */
  /** -------------------------------------------- */
  _selectAbility(event) {
    event.preventDefault();

    const dataset = event.currentTarget.closest(".item")?.dataset;
    if (!dataset) return;

    const selectionId = dataset.itemId;
    const ability = this.item.actor?.items.get(selectionId);
    if (ability?.system?.passive) return;

    let selected = foundry.utils.deepClone(this.item.system.abilities ?? []);

    if (selected.includes(selectionId)) {
      selected = selected.filter(id => id !== selectionId);
    } else {
      selected.push(selectionId);
    }

    this.item.actor?.updateEmbeddedDocuments("Item", [{
      _id: this.item.id,
      "system.abilities": selected
    }]);
  }

  static async _onSelectAbility(event, target) {
    this._selectAbility(event);
  }
}