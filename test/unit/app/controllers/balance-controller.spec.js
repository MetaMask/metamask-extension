const assert = require('assert')
const ObservableStore = require('obs-store')
const PollingBlockTracker = require('eth-block-tracker')

const BalanceController = require('../../../../app/scripts/controllers/balance')
const AccountTracker = require('../../../../app/scripts/lib/account-tracker')
const TransactionController = require('../../../../app/scripts/controllers/transactions')
const { createTestProviderTools } = require('../../../stub/provider')
const provider = createTestProviderTools({ scaffold: {}}).provider

const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'

const accounts = {
  '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
    balance: '0x5e942b06dc24c4d50',
    address: TEST_ADDRESS,
  },
}

describe('Balance Controller', () => {

  let balanceController

  it('errors when address, accountTracker, txController, or blockTracker', function () {
    try {
      balanceController = new BalanceController()
    } catch (error) {
      assert.equal(error.message, 'Cannot construct a balance checker without address, accountTracker, txController, and blockTracker.')
    }
  })

  beforeEach(() => {
    balanceController = new BalanceController({
      address: TEST_ADDRESS,
      accountTracker: new AccountTracker({
        provider,
        blockTracker: new PollingBlockTracker({ provider }),
      }),
      txController: new TransactionController({
        provider,
        networkStore: new ObservableStore(),
        blockTracker: new PollingBlockTracker({ provider }),
      }),
      blockTracker: new PollingBlockTracker({ provider }),
    })

    balanceController.accountTracker.store.updateState({ accounts })
  })

  it('updates balance controller ethBalance from account tracker', async function () {
    await balanceController.updateBalance()
    const balanceControllerState = balanceController.store.getState()
    assert.equal(balanceControllerState.ethBalance, '0x5e942b06dc24c4d50')
  })
})
