const assert = require('assert')
const selectors = require('../../../../ui/app/selectors/selectors')
const mockState = require('../../../data/mock-state.json')
const Eth = require('ethjs')

const { createTestProviderTools } = require('../../../stub/provider')
const provider = createTestProviderTools({ scaffold: {}}).provider

describe('Selectors', function () {

  describe('#getSelectedAddress', function () {
    let state
    beforeEach(function () {
      state = {
        metamask: {
          accounts: {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
              'balance': '0x0',
              'address': '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            },
          },
          cachedBalances: {},
        },
      }
    })

    it('returns first account if selectedAddress is undefined', function () {
      assert.equal(selectors.getSelectedAddress(state), '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    })

    it('returns selectedAddress', function () {
      assert.equal(selectors.getSelectedAddress(mockState), '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    })

  })

  it('returns selected identity', function () {
    const identity = selectors.getSelectedIdentity(mockState)
    assert.equal(identity.address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    assert.equal(identity.name, 'Test Account')
  })

  it('returns selected account', function () {
    const account = selectors.getSelectedAccount(mockState)
    assert.equal(account.balance, '0x0')
    assert.equal(account.address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
  })

  it('returns selected token from first token list', function () {
    const token = selectors.getSelectedToken(mockState)
    assert.equal(token.address, '0x108cf70c7d384c552f42c07c41c0e1e46d77ea0d')
    assert.equal(token.symbol, 'TEST')
    assert.equal(token.decimals, '0')
  })

  describe('#getSelectedTokenExchangeRate', function () {
    it('returns token exchange rate for first token', function () {
      const tokenRate = selectors.getSelectedTokenExchangeRate(mockState)
      assert.equal(tokenRate, '0.00039345803819379796')
    })
  })


  describe('#getTokenExchangeRate', function () {
    let missingTokenRate

    beforeEach(function () {
      missingTokenRate = {
        metamask: {
          'contractExchangeRates': {},
        },
      }
    })

    it('returns 0 token exchange rate for a token not in state', function () {
      const tokenRate = selectors.getTokenExchangeRate(missingTokenRate, '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5')
      assert.equal(tokenRate, 0)
    })

    it('returns token exchange rate for specified token in state', function () {
      const tokenRate = selectors.getTokenExchangeRate(mockState, '0xd8f6a2ffb0fc5952d16c9768b71cfd35b6399aa5')
      assert.equal(tokenRate, 0.00008189274407698049)
    })

  })

  it('returns conversionRate from state', function () {
    assert.equal(selectors.conversionRateSelector(mockState), 556.12)
  })

  it('returns address book from state', function () {
    const addressBook = selectors.getAddressBook(mockState)
    assert.equal(addressBook[0].address, '0xc42edfcc21ed14dda456aa0756c153f7985d8813')
    assert.equal(addressBook[0].name, '')
  })

  it('returns accounts with balance, address, and name from identity and accounts in state', function () {
    const accountsWithSendEther = selectors.accountsWithSendEtherInfoSelector(mockState)
    assert.equal(accountsWithSendEther.length, 2)
    assert.equal(accountsWithSendEther[0].balance, '0x0')
    assert.equal(accountsWithSendEther[0].address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    assert.equal(accountsWithSendEther[0].name, 'Test Account')
  })

  it('returns selected account with balance, address, and name from accountsWithSendEtherInfoSelector', function () {
    const currentAccountwithSendEther = selectors.getCurrentAccountWithSendEtherInfo(mockState)
    assert.equal(currentAccountwithSendEther.balance, '0x0')
    assert.equal(currentAccountwithSendEther.address, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
    assert.equal(currentAccountwithSendEther.name, 'Test Account')
  })

  describe('#transactionSelector', function () {
    it('returns transactions from state', function () {
      selectors.transactionsSelector(mockState)
    })
  })

  it('#getGasIsLoading', () => {
    const gasIsLoading = selectors.getGasIsLoading(mockState)
    assert.equal(gasIsLoading, false)
  })

  describe('Send From', () => {
    it('#getSendFrom', () => {
      const sendFrom = selectors.getSendFrom(mockState)
      assert.equal(sendFrom, '0xc42edfcc21ed14dda456aa0756c153f7985d8813')
    })

    it('#getForceGasMin', () => {
      const forceGasMin = selectors.getForceGasMin(mockState)
      assert.equal(forceGasMin, null)
    })

    it('#getSendAmount', () => {
      const sendAmount = selectors.getSendAmount(mockState)
      assert.equal(sendAmount, '1bc16d674ec80000')
    })

    it('#getSendMaxModeState', () => {
      const sendMaxModeState = selectors.getSendMaxModeState(mockState)
      assert.equal(sendMaxModeState, false)
    })
  })

  it('#getCurrentCurrency', () => {
    const currentCurrency = selectors.getCurrentCurrency(mockState)
    assert.equal(currentCurrency, 'usd')
  })

  it('#getSelectedTokenToFiatRate', () => {
    const selectedTokenToFiatRate = selectors.getSelectedTokenToFiatRate(mockState)
    assert.equal(selectedTokenToFiatRate, '0.21880988420033492152')
  })

  it('#getSelectedTokenContract', () => {
    global.eth = new Eth(provider)
    const selectedTokenContract = selectors.getSelectedTokenContract(mockState)
    assert(selectedTokenContract.abi)
  })

  it('#getCurrentViewContext', () => {
    const currentViewContext = selectors.getCurrentViewContext(mockState)
    assert.equal(currentViewContext, '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc')
  })

  it('#getTotalUnapprovedCount', () => {
    const totalUnapprovedCount = selectors.getTotalUnapprovedCount(mockState)
    assert.equal(totalUnapprovedCount, 1)
  })
})
