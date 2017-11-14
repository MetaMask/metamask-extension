const assert = require('assert')
const h = require('react-hyperscript')
const { createMockStore } = require('redux-test-utils')
const shallowWithStore = require('../../lib/shallow-with-store')
const BalanceComponent = require('../../../ui/app/components/balance-component')
const mockState = {
  metamask: {
    accounts: { abc: {} },
    network: 1,
    selectedAddress: 'abc',
  }
}

describe('BalanceComponent', function () {
  let balanceComponent
  let store
  let component
  beforeEach(function () {
    store = createMockStore(mockState)
    component = shallowWithStore(h(BalanceComponent), store)
    balanceComponent = component.dive()
  })

  it('shows token balance and convert to fiat value based on conversion rate', function () {
    const formattedBalance = '1.23 ETH'

    const tokenBalance = balanceComponent.instance().getTokenBalance(formattedBalance, false)
    const fiatDisplayNumber = balanceComponent.instance().getFiatDisplayNumber(formattedBalance, 2)

    assert.equal('1.23 ETH', tokenBalance)
    assert.equal(2.46, fiatDisplayNumber)
  })

  it('shows only the token balance when conversion rate is not available', function () {
    const formattedBalance = '1.23 ETH'

    const tokenBalance = balanceComponent.instance().getTokenBalance(formattedBalance, false)
    const fiatDisplayNumber = balanceComponent.instance().getFiatDisplayNumber(formattedBalance, 0)

    assert.equal('1.23 ETH', tokenBalance)
    assert.equal('N/A', fiatDisplayNumber)
  })

})

