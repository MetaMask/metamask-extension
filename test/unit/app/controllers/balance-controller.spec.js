import assert from 'assert'
import ObservableStore from 'obs-store'
import PollingBlockTracker from '../../../../app/scripts/controllers/network/eth-block-tracker'

import BalanceController from '../../../../app/scripts/controllers/balance'
import AccountTracker from '../../../../app/scripts/lib/account-tracker'
import TransactionController from '../../../../app/scripts/controllers/transactions'
import { createTestProviderTools } from '../../../stub/provider'

const provider = createTestProviderTools({ scaffold: {} }).provider
provider._confluxWebProvider = 'http://localhost:12537'

const TEST_ADDRESS = '0x1dcd5d886577d5081b0c52e242ef29e70be3e7bc'

const accounts = {
  '0x1dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
    balance: '0x5e942b06dc24c4d50',
    address: TEST_ADDRESS,
  },
}

describe('Balance Controller', function() {
  let balanceController

  it('errors when address, accountTracker, txController, or blockTracker', function() {
    try {
      balanceController = new BalanceController()
    } catch (error) {
      assert.equal(
        error.message,
        'Cannot construct a balance checker without address, accountTracker, txController, and blockTracker.'
      )
    }
  })

  beforeEach(function() {
    balanceController = new BalanceController({
      address: TEST_ADDRESS,
      accountTracker: new AccountTracker({
        network: { getNetworkConfig: () => 2999 },
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

  it('updates balance controller ethBalance from account tracker', async function() {
    await balanceController.updateBalance()
    const balanceControllerState = balanceController.store.getState()
    assert.equal(balanceControllerState.ethBalance, '0x5e942b06dc24c4d50')
  })
})
