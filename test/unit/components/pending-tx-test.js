const React = require('react')
const assert = require('assert')
const PendingTx = require('../../../ui/app/components/pending-tx/index')
const configureStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default
const { shallow } = require('enzyme')

describe('PendingTx', function () {
  let pendingTxComponent
  const middlewares = [thunk]
  const mockStore = configureStore(middlewares)
  const store = mockStore({
    metamask: {
      accounts: {
        address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b826',
        balance: '0x100000',
        code: '0x',
        nonce: '0x0',
      },
      balanceValue: '0x100000',
      conversionRate: '307',
      currentCurrency: 'usd',
      network: '3',
    },
  })

  beforeEach(function () {
    pendingTxComponent = shallow(<PendingTx store={store} />)
  })

  it('pendingTxComponent', function () {
    assert(pendingTxComponent)
  })

})
