const assert = require('assert')
const EventEmitter = require('events').EventEmitter
const ObservableStore = require('obs-store')

const ComputedBalances = require('../../../../app/scripts/controllers/computed-balances')
const PendingBalanceCalculator = require('../../../../app/scripts/lib/pending-balance-calculator')
const AccountTracker = require('../../../../app/scripts/lib/account-tracker')
const TransactionController = require('../../../../app/scripts/controllers/transactions')
const { createTestProviderTools } = require('../../../stub/provider')

const currentNetworkId = 42

describe('Computed Balances Controller', function () {

  let computedBalances

  const provider = createTestProviderTools({ scaffold: {}}).provider

  const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'

  beforeEach(function () {
    computedBalances = new ComputedBalances({
      accountTracker: new AccountTracker({
        blockTracker: new EventEmitter(),
      }),
      txController: new TransactionController({
        provider,
        networkStore: new ObservableStore(currentNetworkId),
        blockTracker: new EventEmitter(),
      }),
      blockTracker: new EventEmitter(),
      balanceCalc: new PendingBalanceCalculator({}),
    })
  })

  it('#trackAddressIfNotAlready', function () {
    computedBalances.trackAddressIfNotAlready(TEST_ADDRESS)
    assert.equal(Object.keys(computedBalances.balances)[0], TEST_ADDRESS)
  })
})
