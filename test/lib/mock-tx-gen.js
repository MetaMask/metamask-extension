import { BN } from 'ethereumjs-util'

const template = {
  'status': 'submitted',
  'history': [{}],
  'txParams': {
    'from': '0x7d3517b0d011698406d6e0aed8453f0be2697926',
    'gas': '0x30d40',
    'value': '0x0',
    'nonce': '0x3',
  },
}

class TxGenerator {

  constructor () {
    this.txs = []
  }

  generate (tx = {}, opts = {}) {
    const { count, fromNonce } = opts
    let nonce = fromNonce || this.txs.length
    const txs = []
    for (let i = 0; i < count; i++) {
      txs.push(Object.assign({}, template, {
        txParams: {
          nonce: hexify(nonce++),
        },
      }, tx))
    }
    this.txs = this.txs.concat(txs)
    return txs
  }

}

function hexify (number) {
  return '0x' + (new BN(number)).toString(16)
}

export default TxGenerator
