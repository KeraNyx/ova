import BaseItemSheet from "./base-item-sheet.js";

export default class OVAAbilitySheet extends BaseItemSheet {

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "ability"],
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/sheets/ova-ability-sheet.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.config = CONFIG.OVA;
    context.abilities = this.item.system.abilities ?? [];
    return context;
  }

  /** -------------------------------------------- */
  /** Event Listeners                              */
  /** -------------------------------------------- */
  _onRender(context, options) {
    super._onRender(context, options);

    if (this.item.isEmbedded && this.item.actor?.sheet) {
      const sheet = this.item.actor.sheet;

      this.element.querySelectorAll(".item-view")
        .forEach(el => el.addEventListener("click", sheet._startEditingItem.bind(sheet)));

      this.element.querySelectorAll(".item-edit")
        .forEach(el => {
          el.addEventListener("blur", sheet._endEditingItem.bind(sheet));
          el.addEventListener("click", sheet._editItem.bind(sheet));
        });

      this.element.querySelectorAll(".item-value")
        .forEach(el => {
          el.addEventListener("input", sheet._onItemValueChange.bind(sheet));
          el.addEventListener("keypress", sheet._itemValueValidator.bind(sheet));
        });

      this.element.querySelectorAll(".ability-name")
        .forEach(el => el.addEventListener("contextmenu", sheet._editItem.bind(sheet)));
    }
  }

  /** -------------------------------------------- */
  /** Drop Handling                                */
  /** -------------------------------------------- */
  async _onDrop(event) {
    await super._onDrop(event);

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const item = this.item;
    if (item.type !== "ability") return false;
    if (!item.system.isRoot) return false;

    const newItem = await Item.implementation.fromDropData(data);
    const newItemData = newItem.toObject();

    if (newItemData.type === "ability") {
      newItemData.system.rootId = item.id;
      newItemData.system.active = item.system.active;
      await item.actor.createEmbeddedDocuments("Item", [newItemData]);
    }

    return true;
  }
}