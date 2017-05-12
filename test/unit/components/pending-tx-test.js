var assert = require('assert')
const h = require('react-hyperscript')
var PendingTx = require('../../../ui/app/components/pending-tx')
const createReactFactory = require('create-react-factory').createReactFactory
const React = require('react')
console.dir(createReactFactory)
const shallow = require('enzyme').shallow
const Factory = createReactFactory(PendingTx)
const ReactTestUtils = require('react-addons-test-utils')
const renderer = ReactTestUtils.createRenderer();

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

    const pendingTxComponent = h(PendingTx, props)
    renderer.render(pendingTxComponent)
    console.dir(pendingTxComponent)

    const noop = () => {}

    setTimeout(() => {
      console.log('timeout finished')

      // Get the gas price input
      // Set it to the newGasPrice value
      // Wait for the value to change
      // Get the submit button
      // Click the submit button
      // Get the output of the submit event.

      setTimeout(() => {
        console.log('hitting submit')
        pendingTxComponent.onSubmit({ preventDefault: noop })
      }, 20)
    }, 200)

    console.log('calling render')
  })

})

