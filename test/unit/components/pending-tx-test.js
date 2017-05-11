var assert = require('assert')
var PendingTx = require('../../../ui/app/components/pending-tx')

describe.only('PendingTx', function () {
  let pendingTxComponent

  const identities = {
    '0xfdea65c8e26263f6d9a1b5de9555d2931a33b826': {
      name: 'Main Account 1',
      balance: '0x00000000000000056bc75e2d63100000',
    },
  }

  const gasPrice = '0x4A817C800' // 20 Gwei
  const txData = {
    'id':5021615666270214,
    'time':1494458763011,
    'status':'unapproved',
    'metamaskNetworkId':'1494442339676',
    'txParams':{
      'from':'0xfdea65c8e26263f6d9a1b5de9555d2931a33b826',
      'to':'0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      'value':'0xde0b6b3a7640000',
      gasPrice,
      'gas':'0x7b0c'},
    'gasLimitSpecified':false,
    'estimatedGas':'0x5208',
  }


  it('should use updated values when edited.', function (done) {

    const newGasPrice = '0x451456'

    const props = {
      identities,
      accounts: identities,
      txData,
      sendTransaction: (txMeta, event) => {
        assert.notEqual(txMeta.txParams.gasPrice, gasPrice, 'gas price should change')
        assert.equal(txMeta.txParams.gasPrice, newGasPrice, 'gas price assigned.')
        done()
      },
    }

    pendingTxComponent = new PendingTx(props)

    const noop = () => {}

    setTimeout(() => {
      console.log('component mounted')

      pendingTxComponent.gasPriceChanged(newGasPrice)

      setTimeout(() => {
        console.log('hitting submit')
        pendingTxComponent.onSubmit({ preventDefault: noop })
      }, 20)
    }, 200)

    console.log('calling render')
    pendingTxComponent.props = props
    pendingTxComponent.checkValidity = () => { return true }
    pendingTxComponent.render()
  })

})
