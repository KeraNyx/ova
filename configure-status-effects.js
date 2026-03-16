export default function configureStatusEffects() {
  CONFIG.statusEffects = [
    {
      id: "dead",
      name: "EFFECT.StatusDead",
      icon: "icons/svg/skull.svg"
    },
    {
      id: "unconscious",
      name: "EFFECT.StatusUnconscious",
      icon: "icons/svg/unconscious.svg"
    },
    {
      id: "stun",
      name: "EFFECT.StatusStunned",
      icon: "icons/svg/daze.svg"
    },
    {
      id: "paralysis",
      name: "EFFECT.StatusParalysis",
      icon: "icons/svg/paralysis.svg"
    },
    {
      id: "impaired",
      name: "EFFECT.StatusImpaired",
      icon: "icons/svg/down.svg"
    },
    {
      id: "disarmed",
      name: "EFFECT.StatusDisarmed",
      icon: "icons/svg/sword.svg"
    },
    {
      id: "blind",
      name: "EFFECT.StatusBlind",
      icon: "icons/svg/blind.svg"
    },
    {
      id: "fly",
      name: "EFFECT.StatusFlying",
      icon: "icons/svg/wing.svg"
    },
    {
      id: "eye",
      name: "EFFECT.StatusMarked",
      icon: "icons/svg/eye.svg"
    }
  ];
}