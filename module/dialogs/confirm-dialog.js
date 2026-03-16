export default class ConfirmDialog {
  /**
   * Shows a simple confirmation dialog.
   * @param {Object} options
   * @param {string} options.title - Dialog title
   * @param {string} options.description - Dialog description
   * @returns {Promise<void>} Resolves on yes, rejects on no
   */
  static show({ title, description }) {
    return new Promise((resolve, reject) => {
      foundry.applications.api.DialogV2.confirm({
        window: { title },
        content: `<p>${description}</p>`,
        yes: {
          icon: "fas fa-check",
          label: game.i18n.localize("OVA.Prompt.Yes"),
          callback: () => resolve()
        },
        no: {
          icon: "fas fa-times",
          label: game.i18n.localize("OVA.Prompt.No"),
          callback: () => reject()
        },
        rejectClose: false
      }).then(result => {
        if (!result) reject();
      });
    });
  }
}