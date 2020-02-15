const ObservableStore = require('obs-store')
const extend = require('xtend')

class PromptController {
  constructor () {
    const initState = extend({
      prompts: {},
    })
    this.store = new ObservableStore(initState)
    this.promptPromises = {}
  }

  addPrompt (title, { message, html }) {
    const currentPrompts = this.store.getState().prompts
    const newPromptId = this._getNewPromptId(currentPrompts)
    this.store.updateState({
      prompts: {
        ...currentPrompts,
        [newPromptId]: {
          title,
          message,
          html,
          id: newPromptId,
        },
      },
    })

    return new Promise((resolve, reject) => {
      this.promptPromises[newPromptId] = { resolve, reject }
    })
  }

  resolvePrompt (id, result) {
    this.promptPromises[id].resolve(result)
  }

  rejectPrompt (id) {
    this.promptPromises[id].reject()
  }

  _getNewPromptId (currentPrompts) {
    const currentPromptIds = Object.keys(currentPrompts)
    const newPromptId = currentPromptIds.length
      ? currentPromptIds.sort()[currentPromptIds.length - 1] + 1
      : 0
    return newPromptId
  }

}

module.exports = PromptController
