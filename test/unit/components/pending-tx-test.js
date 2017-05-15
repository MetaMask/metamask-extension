const assert = require('assert')
const additions = require('react-testutils-additions')
const h = require('react-hyperscript')
const PendingTx = require('../../../ui/app/components/pending-tx')
const createReactFactory = require('create-react-factory').createReactFactory
const React = require('react')
const shallow = require('react-test-renderer/shallow')
const Factory = createReactFactory(PendingTx)
const ReactTestUtils = require('react-addons-test-utils')

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

    const renderer = ReactTestUtils.createRenderer();
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
    const component = additions.renderIntoDocument(pendingTxComponent);
    renderer.render(pendingTxComponent)
    const result = renderer.getRenderOutput()
    const form = result.props.children
    const children = form.props.children[form.props.children.length - 1]
    assert.equal(result.type, 'div', 'should create a div')

    try{

      const input = additions.find(component, '.cell.row input[type="number"]')[1]
      ReactTestUtils.Simulate.change(input, {
        target: {
          value: 2,
          checkValidity() { return true },
        }
      })

      let form = additions.find(component, 'form')[0]
      form.checkValidity = () => true
      form.getFormEl = () => { return { checkValidity() { return true } } }
      ReactTestUtils.Simulate.submit(form, { preventDefault() {}, target: { checkValidity() {return true} } })

    } catch (e) {
      console.log("WHAAAA")
      console.error(e)
    }

    const noop = () => {}

    setTimeout(() => {

      // Get the gas price input
      // Set it to the newGasPrice value
      // Wait for the value to change
      // Get the submit button
      // Click the submit button
      // Get the output of the submit event.
      // Assert that the value was updated.

    }, 200)

  })

})

