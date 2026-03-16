import OVAEffect from "../effects/ova-effect.js";

export default class AddActiveEffectPrompt extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

  constructor(actor) {
    super({});
    this.actor = actor;
    this.effect = OVAEffect.defaultObject();
  }

  /** -------------------------------------------- */
  /** Default Options                              */
  /** -------------------------------------------- */
  static DEFAULT_OPTIONS = {
    classes: ["ova", "dialog"],
    position: { width: 500, height: "auto" },
    window: {
      title: "OVA.AddActiveEffect",
      resizable: true
    },
    actions: {
      submitEffect: AddActiveEffectPrompt._onSubmitEffect
    }
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/dialogs/add-active-effect-dialog.html"
    }
  };

  /** -------------------------------------------- */
  /** Context Data                                 */
  /** -------------------------------------------- */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.config = CONFIG.OVA;
    context.effect = this.effect;
    return context;
  }

  /** -------------------------------------------- */
  /** Event Listeners                              */
  /** -------------------------------------------- */
  _onRender(context, options) {
    super._onRender(context, options);

    this.element.querySelectorAll(".effect-key-select").forEach(el => {
      el.addEventListener("change", ev => {
        const valueContainer = this.element.querySelector(".effect-key-value");
        if (ev.currentTarget.value.includes("?")) {
          valueContainer?.classList.remove("hidden");
        } else {
          valueContainer?.classList.add("hidden");
        }
      });
    });
  }

  /** -------------------------------------------- */
  /** Form Submission                              */
  /** -------------------------------------------- */
  async _onSubmit(event, form, formData) {
    event.preventDefault();
    const data = formData.object;

    const effectData = {
      active: true,
      source: {
        name: data["name"],
        data: {},
        level: 0,
      },
      overTime: {
        when: "each-round",
      }
    };

    for (const key in data) {
      foundry.utils.setProperty(effectData, key, data[key]);
    }

    const activeEffect = OVAEffect.createActiveEffect(effectData, this.actor.system);
    await this.actor.addAttackEffects([activeEffect]);
    await this.close();
  }

  static async _onSubmitEffect(event, target) {
    const form = this.element.querySelector("form");
    if (!form) return;
    const formData = new FormDataExtended(form);
    await this._onSubmit(event, form, formData);
  }
}