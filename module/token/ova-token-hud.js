export default class OVATokenHUD extends foundry.applications.hud.TokenHUD {

  static DEFAULT_OPTIONS = {
    id: "token-hud",
  };

  static PARTS = {
    body: {
      template: "systems/ova/templates/token/token-hud.html"
    }
  };

  _onRender(context, options) {
    super._onRender(context, options);

    this.element
      .querySelector('[data-action="trigger-effects"]')
      ?.addEventListener("click", this._triggerActiveEffects.bind(this));
  }

  _triggerActiveEffects(event) {
    event.preventDefault();

    const targets = canvas.tokens.controlled
      .map(t => t.actor)
      .filter(Boolean);

    for (const actor of targets) {
      actor.triggerOverTimeEffects?.();
    }
  }
}