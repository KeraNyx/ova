import OVADie from "../dice/ova-die.js";

const sizeMods = {
  disadvantage: -5,
  normal: 0,
  advantage: 5,
};

export default class RollPrompt extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    
  resolve = null;

  constructor(title, type, actor, attack, enduranceCost, roll = 2) {
    super({ window: { title } });

    this.actor = actor;
    this.type = type;
    this.roll = roll;
    this.enduranseSelection = "base";
    this.sizeSelection = "normal";
    this.attack = attack;
    this._baseEnduranceCost = enduranceCost;
  }

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "roll-prompt"],
    position: { width: 400 },
    window: { resizable: false },
    actions: {
      roll: RollPrompt._onRoll,
      rollDouble: RollPrompt._onRollDouble,
      rollZero: RollPrompt._onRollZero,
      rollDrama: RollPrompt._onRollDrama,
      rollMiracle: RollPrompt._onRollMiracle,
      selectSize: RollPrompt._onSelectSize,
      selectEndurancePool: RollPrompt._onSelectEndurancePool
    }
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/dialogs/roll-dialog.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.type = this.type;
    context.sizeSelection = this.sizeSelection;
    context.enduranseSelection = this.enduranseSelection;
    context.enduranceCost = this.type === "drama" && this._baseEnduranceCost > 0
      ? `${this._baseEnduranceCost}/${this._baseEnduranceCost * 6}`
      : this._baseEnduranceCost;
    return context;
  }

  /** -------------------------------------------- */
  /** Event Listeners                              */
  /** -------------------------------------------- */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelector("#endurance-cost")
      ?.addEventListener("input", this._changeEnduranceCost.bind(this));

    this.element.querySelectorAll(".size[data-selection]")
      .forEach(el => el.addEventListener("click", this._selectSize.bind(this)));

    this.element.querySelectorAll(".enduranse-pool[data-selection]")
      .forEach(el => el.addEventListener("click", this._selectEnduransePool.bind(this)));
  }

  /** -------------------------------------------- */
  /** Input Handlers                               */
  /** -------------------------------------------- */
  _changeEnduranceCost(e) {
    e.preventDefault();
    this._baseEnduranceCost = parseInt(e.currentTarget.value);
  }

  _selectSize(e) {
    e.preventDefault();
    this.sizeSelection = e.currentTarget.dataset.selection;
    this.render();
  }

  _selectEnduransePool(e) {
    e.preventDefault();
    this.enduranseSelection = e.currentTarget.dataset.selection;
    this.render();
  }

  /** -------------------------------------------- */
  /** Close Handler                                */
  /** -------------------------------------------- */
  async close(options = {}) {
    this.resolve?.(false);
    return super.close(options);
  }

  /** -------------------------------------------- */
  /** Roll Logic                                   */
  /** -------------------------------------------- */
  async _roll(multiplier) {
    let mod = parseInt(this.element.querySelector("#roll-modifier")?.value) || 0;
    let rollValue = this.roll + mod + sizeMods[this.sizeSelection];
    let negativeDice = false;

    if (rollValue <= 0) {
      negativeDice = true;
      rollValue = 2 - rollValue;
    }

    rollValue = negativeDice && multiplier !== 0
      ? Math.ceil(rollValue / multiplier)
      : rollValue * multiplier;

    const dice = await this._makeRoll(rollValue, negativeDice);

    this.resolve?.({ dice, roll: rollValue });

    let effectiveCost = this._baseEnduranceCost;
    if (this.type === "drama") effectiveCost *= multiplier;

    this.actor?.changeEndurance?.(
      -effectiveCost,
      this.enduranseSelection === "reserve"
    );

    await this.close();
  }

  async _makeRoll(roll, negative = false) {
    const formula = negative ? `${roll}d6kl` : `${roll}d6khs`;
    const dice = new Roll(formula);
    await dice.evaluate();
    return dice;
  }

  /** -------------------------------------------- */
  /** Static Action Handlers                       */
  /** -------------------------------------------- */
  static async _onRoll(event, target) {
    await this._roll(1);
  }

  static async _onRollDouble(event, target) {
    await this._roll(2);
  }

  static async _onRollZero(event, target) {
    await this._roll(0);
  }

  static async _onRollDrama(event, target) {
    await this._roll(1);
  }

  static async _onRollMiracle(event, target) {
    await this._roll(6);
  }

  static async _onSelectSize(event, target) {
    this.sizeSelection = target.dataset.selection;
    this.render();
  }

  static async _onSelectEndurancePool(event, target) {
    this.enduranseSelection = target.dataset.selection;
    this.render();
  }

  /** -------------------------------------------- */
  /** Show Promise                                 */
  /** -------------------------------------------- */
  async show() {
    this.render(true);
    return new Promise(resolve => this.resolve = resolve);
  }
}