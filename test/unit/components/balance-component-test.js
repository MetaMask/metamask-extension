var assert = require('assert')
var BalanceComponent = require('../../../ui/app/components/balance-component')

describe('BalanceComponent', function () {
  let balanceComponent

  beforeEach(function () {
    balanceComponent = new BalanceComponent()
  })

  it('shows token balance and convert to fiat value based on conversion rate', function () {
    const formattedBalance = '1.23 ETH'

    const tokenBalance = balanceComponent.getTokenBalance(formattedBalance, false)
    const fiatDisplayNumber = balanceComponent.getFiatDisplayNumber(formattedBalance, 2)

    assert.equal('1.23 ETH', tokenBalance)
    assert.equal(2.46, fiatDisplayNumber)
  })

  it('shows only the token balance when conversion rate is not available', function () {
    const formattedBalance = '1.23 ETH'

    const tokenBalance = balanceComponent.getTokenBalance(formattedBalance, false)
    const fiatDisplayNumber = balanceComponent.getFiatDisplayNumber(formattedBalance, 0)

    assert.equal('1.23 ETH', tokenBalance)
    assert.equal('N/A', fiatDisplayNumber)
  })

})

