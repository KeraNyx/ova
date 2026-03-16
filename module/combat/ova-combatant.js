export default class OVACombatant extends Combatant {
  /** @override */
  get initiativeRoll() {
    const rollData = this.actor?.getRollData?.() ?? {};
    const speed = rollData.speed ?? 0;

    let rollValue = 2 + speed;
    let negativeDice = false;

    if (rollValue <= 0) {
      negativeDice = true;
      rollValue = 2 - rollValue;
    }

    const formula = negativeDice ? `${rollValue}d6kl` : `${rollValue}d6khs`;
    return new Roll(formula);
  }

  /** @override */
  async rollInitiative({ chatMessage = true, createCombatants = false } = {}) {
    const roll = this.initiativeRoll;
    await roll.evaluate();
    return super.rollInitiative({ formula: roll.total, chatMessage, createCombatants });
  }
}