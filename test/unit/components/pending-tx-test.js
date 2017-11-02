const assert = require('assert')
const h = require('react-hyperscript')
const PendingTx = require('../../../ui/app/components/pending-tx')
const ethUtil = require('ethereumjs-util')

const { createMockStore } = require('redux-test-utils')
const shallowWithStore = require('../../lib/shallow-with-store')

const identities = { abc: {}, def: {} }
const mockState = {
  metamask: {
    accounts: { abc: {} },
    identities,
    conversionRate: 10,
    selectedAddress: 'abc',
  }
}

describe('PendingTx', function () {
  const gasPrice = '0x4A817C800' // 20 Gwei
  const txData = {
    'id': 5021615666270214,
    'time': 1494458763011,
    'status': 'unapproved',
    'metamaskNetworkId': '1494442339676',
    'txParams': {
      'from': '0xfdea65c8e26263f6d9a1b5de9555d2931a33b826',
      'to': '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      'value': '0xde0b6b3a7640000',
      gasPrice,
      'gas': '0x7b0c',
    },
    'gasLimitSpecified': false,
    'estimatedGas': '0x5208',
  }
  const newGasPrice = '0x77359400'

  const computedBalances = {}
  computedBalances[Object.keys(identities)[0]] = {
    ethBalance: '0x00000000000000056bc75e2d63100000',
  }
  const props = {
    txData,
    computedBalances,
    sendTransaction: (txMeta, event) => {
      // Assert changes:
      const result = ethUtil.addHexPrefix(txMeta.txParams.gasPrice)
      assert.notEqual(result, gasPrice, 'gas price should change')
      assert.equal(result, newGasPrice, 'gas price assigned.')
    },
  }

  let pendingTxComponent
  let store
  let component
  beforeEach(function () {
    store = createMockStore(mockState)
    component = shallowWithStore(h(PendingTx, props), store)
    pendingTxComponent = component
  })

  it('should render correctly', function (done) {
    assert.equal(pendingTxComponent.props().identities, identities)
    done()
  })
})

