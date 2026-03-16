import OVAEffect from "../effects/ova-effect.js";

export default class BaseItemSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova"],
    position: { width: 630, height: 460 },
    window: { resizable: true },
    actions: {
      openRulebook: BaseItemSheet._onOpenRulebook,
      addEffect: BaseItemSheet._onAddEffect,
      deleteEffect: BaseItemSheet._onDeleteEffect,
      deletePerk: BaseItemSheet._onDeletePerk,
      deleteSelf: BaseItemSheet._onDeleteSelf
    },
    dragDrop: [{ dropSelector: ".perks" }, { dropSelector: ".items" }]
  };

  /** -------------------------------------------- */
  /** Tabs                                         */
  /** -------------------------------------------- */
  static PARTS = {
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    body: { template: "" } // subclasses should override
  };

  tabGroups = {
    sheet: "description"
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.perks = this.item.perks ?? [];
    context.isEmbedded = this.item.isEmbedded;
    context.system = this.item.system;
    context.item = this.item;
    context.tabs = this._getTabs();
    return context;
  }

  _getTabs() {
    return {};  // subclasses should override if needed
  }

  /** -------------------------------------------- */
  /** Event Listeners                              */
  /** -------------------------------------------- */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll(".rulebook-link")
      .forEach(el => el.addEventListener("click", this._openRulebook.bind(this)));

    if (this.item.actor) {
      this.element.querySelectorAll(".perk")
        .forEach(el => el.addEventListener("contextmenu",
          this.item.actor.sheet._editItem.bind(this.item.actor.sheet)));
    }
  }

  /** -------------------------------------------- */
  /** Open Rulebook                                */
  /** -------------------------------------------- */
  _openRulebook(event) {
    event.preventDefault();
    if (ui.PDFoundry) {
      const rulebookName = game.settings.get("ova", "rulebookName");
      const page = Number(this.item.system.page);
      ui.PDFoundry.openPDFByName(rulebookName, { page });
    } else {
      ui.notifications.warn(game.i18n.localize("OVA.PDFoundry.NotInstalled"));
    }
  }

  static async _onOpenRulebook(event, target) {
    this._openRulebook(event);
  }

  /** -------------------------------------------- */
  /** Add/Remove Effects                           */
  /** -------------------------------------------- */
  static async _onAddEffect(event, target) {
    event.preventDefault();
    const effects = foundry.utils.deepClone(this.item.system.effects ?? []);
    effects.push(OVAEffect.defaultObject());
    await this.item.update({ "system.effects": effects });
  }

  static async _onDeleteEffect(event, target) {
    event.preventDefault();
    const effectIndex = target.closest(".effect")?.dataset.index;
    if (effectIndex === undefined) return;
    const effects = foundry.utils.deepClone(this.item.system.effects ?? []);
    effects.splice(Number(effectIndex), 1);
    await this.item.update({ "system.effects": effects });
  }

  /** -------------------------------------------- */
  /** Delete Perk / Delete Self                    */
  /** -------------------------------------------- */
  static async _onDeletePerk(event, target) {
    event.preventDefault();
    const itemId = target.closest(".item")?.dataset.itemId;
    if (itemId) this.item.removePerk(itemId);
  }

  static async _onDeleteSelf(event, target) {
    event.preventDefault();
    this.item.actor?.deleteEmbeddedDocuments("Item", [this.item.id]);
  }

  /** -------------------------------------------- */
  /** Handle Item Drops                            */
  /** -------------------------------------------- */
  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (this.item.type === "perk") return false;

    const newItem = await Item.implementation.fromDropData(data);
    const newItemData = newItem.toObject();

    if (newItemData.type === "perk") {
      const newPerks = Array.isArray(newItemData) ? newItemData : [newItemData];
      this.item.addPerks(newPerks);
    }

    return true;
  }

  /** -------------------------------------------- */
  /** Form Submission                              */
  /** -------------------------------------------- */
  async _processFormData(event, form, formData) {
    const formattedData = Object.entries(formData.object).reduce((acc, [key, value]) => {
      const match = key.match(/\[(\d+)\]/);
      if (match) {
        const index = parseInt(match[1]);
        const objectName = key.split(`[${index}]`)[0];
        const keyName = key.split(`[${index}].`)[1];
        acc[objectName] = acc[objectName] || [];
        acc[objectName][index] = acc[objectName][index] || {};
        foundry.utils.setProperty(acc[objectName][index], keyName, value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

    return super._processFormData(event, form, 
      new FormDataExtended(form, { object: formattedData }));
  }
}