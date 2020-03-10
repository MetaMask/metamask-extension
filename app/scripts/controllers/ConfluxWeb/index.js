import { Conflux } from 'js-conflux-sdk/dist/js-conflux-sdk.umd.min.js'

class FakeContract {
  constructor (cfx, abi) {
    this.cfx = cfx
    this.abi = abi
  }

  at (address) {
    return this.cfx.Contract({ abi: this.abi, address })
  }
}

export default class Web3 extends Conflux {
  constructor () {
    if (arguments[0] && arguments[0]._confluxWebProvider) {
      super(arguments[0]._confluxWebProvider)
    } else {
      super(...arguments)
    }
  }

  setProvider () {
    if (arguments[0] && arguments[0]._confluxWebProvider) {
      return Conflux.prototype.setProvider.call(
        this,
        arguments[0]._confluxWebProvider.url,
        { ...arguments[0]._confluxWebProvider }
      )
    } else {
      return Conflux.prototype.setProvider.call(this, ...arguments)
    }
  }

  get eth () {
    return {
      contract: (abi) => new FakeContract(this, abi),
    }
  }
}
