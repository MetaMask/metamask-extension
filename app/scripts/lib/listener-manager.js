module.exports = class ListenerManager {

  constructor() {
    this.cleaners = {}
  }

  setup (name) {
    if (!(name in this.cleaners)) {
      this.cleaners[name] = []
    }
  }

  addCleanup (name, cleaner) {
    this.setup(name)
  }

  cleanupOldListeners (name) {
    this.setup(name)
    this.cleaners[name].forEach((cleaner) => {
      cleaner()
    })
    this.cleaners[name] = []
  }

}
