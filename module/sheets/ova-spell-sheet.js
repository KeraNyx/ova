import OVAAttackSheet from "./ova-attack-sheet.js";

export default class OVASpellSheet extends OVAAttackSheet {

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "spell"],
    dragDrop: [{ dropSelector: ".items" }],
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/sheets/ova-spell-sheet.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    if (this.item.isEmbedded) {
      context.spellEffects = this.item.system.spellEffects;
    }

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
    const activeTab = this.tabGroups?.sheet;
    if (activeTab === "abilities") return;

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const item = this.item;
    if (!item.isEmbedded) return;

    const newItem = await Item.implementation.fromDropData(data);
    const newItemData = newItem.toObject();

    if (newItemData.type !== "ability") return;

    const oldAbilities = item.actor.items.filter(i => i.system.rootId === item.id);
    if (oldAbilities.length) {
      await item.actor.deleteEmbeddedDocuments("Item", oldAbilities.map(i => i.id));
    }

    newItemData.system.rootId = item.id;
    await item.actor.createEmbeddedDocuments("Item", [newItemData]);
  }
}