import RollPrompt from "../dialogs/roll-prompt.js";
import AddActiveEffectPrompt from "../dialogs/add-active-effect-dialogue.js";

export default class OVACharacterSheet extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {

  constructor(...args) {
    super(...args);
    this.selectedAbilities = [];
  }

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "character"],
    position: { width: 720, height: 600 },
    window: { resizable: true },
    actions: {
      editItem: OVACharacterSheet._onEditItem,
      selectAbility: OVACharacterSheet._onSelectAbility,
      toggleAbility: OVACharacterSheet._onToggleAbility,
      makeManualRoll: OVACharacterSheet._onMakeManualRoll,
      makeAttackRoll: OVACharacterSheet._onMakeAttackRoll,
      makeDefenseRoll: OVACharacterSheet._onMakeDefenseRoll,
      addActiveEffect: OVACharacterSheet._onAddActiveEffect,
      removeEffect: OVACharacterSheet._onRemoveEffect
    }
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/sheets/ova-character-sheet.html"
    }
  };

  tabGroups = {
    combat: "attacks"
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;

    context.actor = actor;
    context.system = actor.system ?? {};
    context.config = CONFIG.OVA;
    context.selectedAbilities = this.selectedAbilities;

    context.abilities = [];
    context.weaknesses = [];
    context.attacks = [];
    context.spells = [];

    let abilityLevels = 0;
    let weaknessLevels = 0;

    for (const item of actor.items) {
      const system = item.system ?? {};

      if (item.type === "attack") {
        context.attacks.push(item);
        continue;
      }

      if (item.type === "spell") {
        context.spells.push(item);
        continue;
      }

      if (system.rootId !== "") continue;

      if (system.type === "ability") {
        abilityLevels += system.level?.value ?? 0;
        context.abilities.push(item);
      }

      if (system.type === "weakness") {
        weaknessLevels += system.level?.value ?? 0;
        context.weaknesses.push(item);
      }
    }

    context.abilityLevels = abilityLevels;
    context.weaknessLevels = weaknessLevels;
    context.totalLevels = abilityLevels - weaknessLevels;

    context.abilities.sort((a, b) => a.name.localeCompare(b.name));
    context.weaknesses.sort((a, b) => a.name.localeCompare(b.name));

    return context;
  }

  /** -------------------------------------------- */
  /** Event Listeners                              */
  /** -------------------------------------------- */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll(".item-edit")
      .forEach(el => el.addEventListener("click", ev => this._editItem(ev)));

    this.element.querySelectorAll(".ability-name")
      .forEach(el => el.addEventListener("click", ev => this._selectAbility(ev)));

    this.element.querySelectorAll(".ability-active")
      .forEach(el => el.addEventListener("click", ev => this._toggleAbility(ev)));

    this.element.querySelectorAll(".roll-dice")
      .forEach(el => el.addEventListener("click", ev => this._makeManualRoll(ev)));

    this.element.querySelectorAll(".attack-block")
      .forEach(el => el.addEventListener("click", ev => this._makeAttackRoll(ev)));

    this.element.querySelectorAll(".defense-value")
      .forEach(el => el.addEventListener("click", ev => this._makeDefenseRoll(ev)));

    this.element.querySelectorAll(".add-active-effect")
      .forEach(el => el.addEventListener("click", ev => this._addActiveEffect(ev)));

    this.element.querySelectorAll(".effect-delete")
      .forEach(el => el.addEventListener("click", ev => this._removeEffect(ev)));
  }

  /** -------------------------------------------- */
  /** Item Helpers                                 */
  /** -------------------------------------------- */
  _getItemId(event) {
    return event.currentTarget.closest(".item")?.dataset?.itemId;
  }

  _editItem(event) {
    event.preventDefault();
    const item = this.actor.items.get(this._getItemId(event));
    item?.sheet.render(true);
  }

  async _toggleAbility(event) {
    event.preventDefault();
    const item = this.actor.items.get(this._getItemId(event));
    if (!item) return;

    const active = !item.system?.active;
    const updates = [{ _id: item.id, "system.active": active }];

    const children = this.actor.items.filter(i => i.system?.rootId === item.id);
    for (const c of children) updates.push({ _id: c.id, "system.active": active });

    await this.actor.updateEmbeddedDocuments("Item", updates);
  }

  async _selectAbility(event) {
    event.preventDefault();
    const id = this._getItemId(event);

    if (this.selectedAbilities.includes(id)) {
      this.selectedAbilities = this.selectedAbilities.filter(a => a !== id);
    } else {
      this.selectedAbilities.push(id);
    }

    this.render(false);
  }

  _getSelectedAbilities() {
    return this.actor.items.filter(i => this.selectedAbilities.includes(i.id));
  }

  /** -------------------------------------------- */
  /** Rolls                                        */
  /** -------------------------------------------- */
  async _makeManualRoll(event) {
    event.preventDefault();

    const abilities = this._getSelectedAbilities();
    let roll = this.actor.system?.globalMod ?? 0;
    let enduranceCost = 0;

    for (const a of abilities) {
      const sign = a.system?.type === "weakness" ? -1 : 1;
      roll += sign * (a.system?.level?.value ?? 0);
      enduranceCost += a.system?.enduranceCost ?? 0;
    }

    await this._makeRoll({
      roll,
      enduranceCost,
      abilities,
      callback: () => abilities.forEach(a => a.use?.())
    });
  }

  async _makeAttackRoll(event) {
    event.preventDefault();
    const item = this.actor.items.get(this._getItemId(event));
    if (!item) return;
    // Delegate to item or roll prompt as needed
    item.sheet?.render(true);
  }

  async _makeDefenseRoll(event) {
    event.preventDefault();
    const defense = event.currentTarget.dataset?.defense;
    if (!defense) return;

    const value = this.actor.system?.defenses?.[defense] ?? 0;
    await this._makeRoll({ roll: value, enduranceCost: 0 });
  }

  async _makeRoll({ roll, enduranceCost = 0, callback }) {
    const result = await new RollPrompt("", "manual", this.actor, null, enduranceCost, roll).show();
    if (!result) return;

    callback?.();
    this.selectedAbilities = [];
    this.render();
  }

  /** -------------------------------------------- */
  /** Effects                                      */
  /** -------------------------------------------- */
  _removeEffect(event) {
    event.preventDefault();
    const id = this._getItemId(event);
    if (id) this.actor.deleteEmbeddedDocuments("ActiveEffect", [id]);
  }

  _addActiveEffect() {
    new AddActiveEffectPrompt(this.actor).render(true);
  }

  /** -------------------------------------------- */
  /** Static Action Handlers                       */
  /** -------------------------------------------- */
  static async _onEditItem(event, target) { this._editItem(event); }
  static async _onSelectAbility(event, target) { await this._selectAbility(event); }
  static async _onToggleAbility(event, target) { await this._toggleAbility(event); }
  static async _onMakeManualRoll(event, target) { await this._makeManualRoll(event); }
  static async _onMakeAttackRoll(event, target) { await this._makeAttackRoll(event); }
  static async _onMakeDefenseRoll(event, target) { await this._makeDefenseRoll(event); }
  static async _onAddActiveEffect(event, target) { this._addActiveEffect(); }
  static async _onRemoveEffect(event, target) { this._removeEffect(event); }
}