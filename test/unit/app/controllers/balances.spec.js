const assert = require('assert')
const sinon = require('sinon')
const EventEmitter = require('events').EventEmitter
const ObservableStore = require('obs-store')


const BalanceController = require('../../../../app/scripts/controllers/balance')
const PendingBalanceCalculator = require('../../../../app/scripts/lib/pending-balance-calculator')
const AccountTracker = require('../../../../app/scripts/lib/account-tracker')
const TransactionController = require('../../../../app/scripts/controllers/transactions')
const { createTestProviderTools, getTestAccounts } = require('../../../stub/provider')

const noop = () => true
const currentNetworkId = 42

const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'

describe('', function () {
  let balanceController

  it('errors when address, accountTracker, txController, or blockTracker', function () {
    try {
      balanceController = new BalanceController()
    } catch (error) {
      assert.equal(error.message, 'Cannot construct a balance checker without address, accountTracker, txController, and blockTracker.')
    }
  })


  const provider = createTestProviderTools({ scaffold: {}}).provider

  const accounts = {
    '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
      'balance': '0x5e942b06dc24c4d50',
      address: TEST_ADDRESS,
    },
    '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
      'balance': '0x8a9b16c0cfcc2000',
      address: TEST_ADDRESS_ALT,
    },
  }

  beforeEach(function () {
    balanceController = new BalanceController({
      address: TEST_ADDRESS,
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

    balanceController.accountTracker.store.updateState({ accounts })
  })

  it('updates balance controller ethBalance from account tracker', async function () {
    await balanceController.updateBalance()
    const balanceControllerState = balanceController.store.getState()
    assert.equal(balanceControllerState.ethBalance, '0x5e942b06dc24c4d50')
  })

  xit('', async function () {
    sinon.stub(balanceController, 'txController')
    // console.log(balanceController.txController._events)
    const event = Object.keys(balanceController.txController._events)[0]
    console.log(event)
    balanceController.txController.emit('tx:status-update', 1, 'failed')
    // balanceController.updateBalance()
    // console.log(await balanceController.balanceCalc.getBalance())
    // console.log(balanceController.store.getState())
  })
})
