const harden = require('@agoric/harden')

export function createCore (opts = {}) {
  const controllers = { ...opts.controllers }
  const { Compartment } = opts

  const core = harden({
    getControllers: async () => harden(controllers),
    addRootController,
  })

  async function addRootController(name, code) {
    controllers[name] = new Compartment(code, core);
  }

  return core
}

