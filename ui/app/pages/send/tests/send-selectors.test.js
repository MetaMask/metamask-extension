import assert from 'assert'
import sinon from 'sinon'
import {
  accountsWithSendEtherInfoSelector,
  getCurrentAccountWithSendEtherInfo,
} from '../../../selectors/selectors'
import {
  getBlockGasLimit,
  getAmountConversionRate,
  getConversionRate,
  getCurrentCurrency,
  getCurrentNetwork,
  getNativeCurrency,
  getForceGasMin,
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getPrimaryCurrency,
  getRecentBlocks,
  getSelectedIdentity,
  getSelectedToken,
  getSelectedTokenContract,
  getSelectedTokenExchangeRate,
  getSelectedTokenToFiatRate,
  getSendAmount,
  getSendEditingTransactionId,
  getSendErrors,
  getSendFrom,
  getSendFromBalance,
  getSendFromObject,
  getSendHexDataFeatureFlagState,
  getSendMaxModeState,
  getSendTo,
  getSendToAccounts,
  getTokenBalance,
  getTokenExchangeRate,
  getUnapprovedTxs,
} from '../send.selectors.js'
import mockState from './send-selectors-test-data'

describe('send selectors', function () {
  const tempGlobalEth = Object.assign({}, global.eth)
  beforeEach(function () {
    global.eth = {
      contract: sinon.stub().returns({
        at: (address) => 'mockAt:' + address,
      }),
    }
  })

  afterEach(function () {
    global.eth = tempGlobalEth
  })

  describe('accountsWithSendEtherInfoSelector()', function () {
    it('should return an array of account objects with name info from identities', function () {
      assert.deepEqual(
        accountsWithSendEtherInfoSelector(mockState),
        [
          {
            code: '0x',
            balance: '0x47c9d71831c76efe',
            nonce: '0x1b',
            address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
            name: 'Send Account 1',
          },
          {
            code: '0x',
            balance: '0x37452b1315889f80',
            nonce: '0xa',
            address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
            name: 'Send Account 2',
          },
          {
            code: '0x',
            balance: '0x30c9d71831c76efe',
            nonce: '0x1c',
            address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
            name: 'Send Account 3',
          },
          {
            code: '0x',
            balance: '0x0',
            nonce: '0x0',
            address: '0xd85a4b6a394794842887b8284293d69163007bbb',
            name: 'Send Account 4',
          },
        ]
      )
    })
  })

  // describe('autoAddToBetaUI()', () => {
  //   it('should', () => {
  //     assert.deepEqual(
  //       autoAddToBetaUI(mockState),

  //     )
  //   })
  // })

  describe('getAmountConversionRate()', function () {
    it('should return the token conversion rate if a token is selected', function () {
      assert.equal(
        getAmountConversionRate(mockState),
        2401.76400654
      )
    })

    it('should return the eth conversion rate if no token is selected', function () {
      const editedMockState = {
        metamask: Object.assign({}, mockState.metamask, { selectedTokenAddress: null }),
      }
      assert.equal(
        getAmountConversionRate(editedMockState),
        1200.88200327
      )
    })
  })

  describe('getBlockGasLimit', function () {
    it('should return the current block gas limit', function () {
      assert.deepEqual(
        getBlockGasLimit(mockState),
        '0x4c1878'
      )
    })
  })

  describe('getConversionRate()', function () {
    it('should return the eth conversion rate', function () {
      assert.deepEqual(
        getConversionRate(mockState),
        1200.88200327
      )
    })
  })

  describe('getCurrentAccountWithSendEtherInfo()', function () {
    it('should return the currently selected account with identity info', function () {
      assert.deepEqual(
        getCurrentAccountWithSendEtherInfo(mockState),
        {
          code: '0x',
          balance: '0x0',
          nonce: '0x0',
          address: '0xd85a4b6a394794842887b8284293d69163007bbb',
          name: 'Send Account 4',
        }
      )
    })
  })

  describe('getCurrentCurrency()', function () {
    it('should return the currently selected currency', function () {
      assert.equal(
        getCurrentCurrency(mockState),
        'USD'
      )
    })
  })

  describe('getNativeCurrency()', function () {
    it('should return the ticker symbol of the selected network', function () {
      assert.equal(
        getNativeCurrency(mockState),
        'ETH'
      )
    })
  })

  describe('getCurrentNetwork()', function () {
    it('should return the id of the currently selected network', function () {
      assert.equal(
        getCurrentNetwork(mockState),
        '3'
      )
    })
  })

  describe('getForceGasMin()', function () {
    it('should get the send.forceGasMin property', function () {
      assert.equal(
        getForceGasMin(mockState),
        true
      )
    })
  })

  describe('getGasLimit()', function () {
    it('should return the send.gasLimit', function () {
      assert.equal(
        getGasLimit(mockState),
        '0xFFFF'
      )
    })
  })

  describe('getGasPrice()', function () {
    it('should return the send.gasPrice', function () {
      assert.equal(
        getGasPrice(mockState),
        '0xaa'
      )
    })
  })

  describe('getGasTotal()', function () {
    it('should return the send.gasTotal', function () {
      assert.equal(
        getGasTotal(mockState),
        'a9ff56'
      )
    })
  })

  describe('getPrimaryCurrency()', function () {
    it('should return the symbol of the selected token', function () {
      assert.equal(
        getPrimaryCurrency(mockState),
        'DEF'
      )
    })
  })

  describe('getRecentBlocks()', function () {
    it('should return the recent blocks', function () {
      assert.deepEqual(
        getRecentBlocks(mockState),
        ['mockBlock1', 'mockBlock2', 'mockBlock3']
      )
    })
  })

  describe('getSelectedIdentity()', function () {
    it('should return the identity object of the currently selected address', function () {
      assert.deepEqual(
        getSelectedIdentity(mockState),
        {
          address: '0xd85a4b6a394794842887b8284293d69163007bbb',
          name: 'Send Account 4',
        }
      )
    })
  })

  describe('getSelectedToken()', function () {
    it('should return the currently selected token if selected', function () {
      assert.deepEqual(
        getSelectedToken(mockState),
        {
          address: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          decimals: 4,
          symbol: 'DEF',
        }
      )
    })

    it('should return the send token if none is currently selected, but a send token exists', function () {
      const mockSendToken = {
        address: '0x123456708414189a58339873ab429b6c47ab92d3',
        decimals: 4,
        symbol: 'JKL',
      }
      const editedMockState = {
        metamask: Object.assign({}, mockState.metamask, {
          selectedTokenAddress: null,
          send: {
            token: mockSendToken,
          },
        }),
      }
      assert.deepEqual(
        getSelectedToken(editedMockState),
        Object.assign({}, mockSendToken)
      )
    })
  })

  describe('getSelectedTokenContract()', function () {
    it('should return the contract at the selected token address', function () {
      assert.equal(
        getSelectedTokenContract(mockState),
        'mockAt:0x8d6b81208414189a58339873ab429b6c47ab92d3'
      )
    })

    it('should return null if no token is selected', function () {
      const modifiedMetamaskState = Object.assign({}, mockState.metamask, { selectedTokenAddress: false })
      assert.equal(
        getSelectedTokenContract(Object.assign({}, mockState, { metamask: modifiedMetamaskState })),
        null
      )
    })
  })

  describe('getSelectedTokenExchangeRate()', function () {
    it('should return the exchange rate for the selected token', function () {
      assert.equal(
        getSelectedTokenExchangeRate(mockState),
        2.0
      )
    })
  })

  describe('getSelectedTokenToFiatRate()', function () {
    it('should return rate for converting the selected token to fiat', function () {
      assert.equal(
        getSelectedTokenToFiatRate(mockState),
        2401.76400654
      )
    })
  })

  describe('getSendAmount()', function () {
    it('should return the send.amount', function () {
      assert.equal(
        getSendAmount(mockState),
        '0x080'
      )
    })
  })

  describe('getSendEditingTransactionId()', function () {
    it('should return the send.editingTransactionId', function () {
      assert.equal(
        getSendEditingTransactionId(mockState),
        97531
      )
    })
  })

  describe('getSendErrors()', function () {
    it('should return the send.errors', function () {
      assert.deepEqual(
        getSendErrors(mockState),
        { someError: null }
      )
    })
  })

  describe('getSendHexDataFeatureFlagState()', function () {
    it('should return the sendHexData feature flag state', function () {
      assert.deepEqual(
        getSendHexDataFeatureFlagState(mockState),
        true
      )
    })
  })

  describe('getSendFrom()', function () {
    it('should return the send.from', function () {
      assert.deepEqual(
        getSendFrom(mockState),
        '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
      )
    })
  })

  describe('getSendFromBalance()', function () {
    it('should get the send.from balance if it exists', function () {
      assert.equal(
        getSendFromBalance(mockState),
        '0x37452b1315889f80'
      )
    })

    it('should get the selected account balance if the send.from does not exist', function () {
      const editedMockState = {
        metamask: Object.assign({}, mockState.metamask, {
          send: {
            from: null,
          },
        }),
      }
      assert.equal(
        getSendFromBalance(editedMockState),
        '0x0'
      )
    })
  })

  describe('getSendFromObject()', function () {
    it('should return send.from if it exists', function () {
      assert.deepEqual(
        getSendFromObject(mockState),
        {
          address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
          balance: '0x37452b1315889f80',
          code: '0x',
          nonce: '0xa',
        }
      )
    })

    it('should return the current account if send.from does not exist', function () {
      const editedMockState = {
        metamask: Object.assign({}, mockState.metamask, {
          send: {
            from: null,
          },
        }),
      }
      assert.deepEqual(
        getSendFromObject(editedMockState),
        {
          code: '0x',
          balance: '0x0',
          nonce: '0x0',
          address: '0xd85a4b6a394794842887b8284293d69163007bbb',
        }
      )
    })
  })

  describe('getSendMaxModeState()', function () {
    it('should return send.maxModeOn', function () {
      assert.equal(
        getSendMaxModeState(mockState),
        false
      )
    })
  })

  describe('getSendTo()', function () {
    it('should return send.to', function () {
      assert.equal(
        getSendTo(mockState),
        '0x987fedabc'
      )
    })
  })

  describe('getSendToAccounts()', function () {
    it('should return an array including all the users accounts and the address book', function () {
      assert.deepEqual(
        getSendToAccounts(mockState),
        [
          {
            code: '0x',
            balance: '0x47c9d71831c76efe',
            nonce: '0x1b',
            address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
            name: 'Send Account 1',
          },
          {
            code: '0x',
            balance: '0x37452b1315889f80',
            nonce: '0xa',
            address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
            name: 'Send Account 2',
          },
          {
            code: '0x',
            balance: '0x30c9d71831c76efe',
            nonce: '0x1c',
            address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
            name: 'Send Account 3',
          },
          {
            code: '0x',
            balance: '0x0',
            nonce: '0x0',
            address: '0xd85a4b6a394794842887b8284293d69163007bbb',
            name: 'Send Account 4',
          },
          {
            address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
            name: 'Address Book Account 1',
            chainId: '3',
          },
        ]
      )
    })
  })

  describe('getTokenBalance()', function () {
    it('should', function () {
      assert.equal(
        getTokenBalance(mockState),
        3434
      )
    })
  })

  describe('getTokenExchangeRate()', function () {
    it('should return the passed tokens exchange rates', function () {
      assert.equal(
        getTokenExchangeRate(mockState, 'GHI'),
        31.01
      )
    })
  })

  describe('getUnapprovedTxs()', function () {
    it('should return the unapproved txs', function () {
      assert.deepEqual(
        getUnapprovedTxs(mockState),
        {
          4768706228115573: {
            id: 4768706228115573,
            time: 1487363153561,
            status: 'unapproved',
            gasMultiplier: 1,
            metamaskNetworkId: '3',
            txParams: {
              from: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
              to: '0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761',
              value: '0xde0b6b3a7640000',
              metamaskId: 4768706228115573,
              metamaskNetworkId: '3',
              gas: '0x5209',
            },
            gasLimitSpecified: false,
            estimatedGas: '0x5209',
            txFee: '17e0186e60800',
            txValue: 'de0b6b3a7640000',
            maxCost: 'de234b52e4a0800',
            gasPrice: '4a817c800',
          },
        }
      )
    })
  })
})
