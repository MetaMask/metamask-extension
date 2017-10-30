const React = require('react')
const assert = require('assert')
const BalanceComponent = require('../../../ui/app/components/balance-component')
const configureStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default
const { shallow } = require('enzyme')

describe('BalanceComponent', function () {
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
  let balanceComponent

  beforeEach(function () {
    balanceComponent = shallow(<BalanceComponent store={store} />)
  })

  it('shows token balance and convert to fiat value based on conversion rate', function () {
    const formattedBalance = '1.23 ETH'

    const tokenBalance = balanceComponent.dive().instance().getTokenBalance(formattedBalance, false)
    const fiatDisplayNumber = balanceComponent.dive().instance().getFiatDisplayNumber(formattedBalance, 2)

    assert.equal('1.23 ETH', tokenBalance)
    assert.equal(2.46, fiatDisplayNumber)
  })

  it('shows only the token balance when conversion rate is not available', function () {
    const formattedBalance = '1.23 ETH'

    const tokenBalance = balanceComponent.dive().instance().getTokenBalance(formattedBalance, false)
    const fiatDisplayNumber = balanceComponent.dive().instance().getFiatDisplayNumber(formattedBalance, 0)

    assert.equal('1.23 ETH', tokenBalance)
    assert.equal('N/A', fiatDisplayNumber)
  })

})

