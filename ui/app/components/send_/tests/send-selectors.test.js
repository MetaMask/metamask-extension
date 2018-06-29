import assert from 'assert'
import sinon from 'sinon'
import selectors from '../send.selectors.js'
const {
  accountsWithSendEtherInfoSelector,
  // autoAddToBetaUI,
  getAddressBook,
  getBlockGasLimit,
  getAmountConversionRate,
  getConversionRate,
  getCurrentAccountWithSendEtherInfo,
  getCurrentCurrency,
  getCurrentNetwork,
  getCurrentViewContext,
  getForceGasMin,
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getPrimaryCurrency,
  getRecentBlocks,
  getSelectedAccount,
  getSelectedAddress,
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
  getSendMaxModeState,
  getSendTo,
  getSendToAccounts,
  getTokenBalance,
  getTokenExchangeRate,
  getUnapprovedTxs,
  transactionsSelector,
} = selectors
import mockState from './send-selectors-test-data'

describe('send selectors', () => {
  const tempGlobalEth = Object.assign({}, global.eth)
  beforeEach(() => {
    global.eth = {
      contract: sinon.stub().returns({
        at: address => 'mockAt:' + address,
      }),
    }
  })

  afterEach(() => {
    global.eth = tempGlobalEth
  })

  describe('accountsWithSendEtherInfoSelector()', () => {
    it('should return an array of account objects with name info from identities', () => {
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

  describe('getAddressBook()', () => {
    it('should return the address book', () => {
      assert.deepEqual(
        getAddressBook(mockState),
        [
          {
            address: '0x06195827297c7a80a443b6894d3bdb8824b43896',
            name: 'Address Book Account 1',
          },
        ],
      )
    })
  })

  describe('getAmountConversionRate()', () => {
    it('should return the token conversion rate if a token is selected', () => {
      assert.equal(
        getAmountConversionRate(mockState),
        2401.76400654
      )
    })

    it('should return the eth conversion rate if no token is selected', () => {
      const editedMockState = {
        metamask: Object.assign({}, mockState.metamask, { selectedTokenAddress: null }),
      }
      assert.equal(
        getAmountConversionRate(editedMockState),
        1200.88200327
      )
    })
  })

  describe('getBlockGasLimit', () => {
    it('should return the current block gas limit', () => {
      assert.deepEqual(
        getBlockGasLimit(mockState),
        '0x4c1878'
      )
    })
  })

  describe('getConversionRate()', () => {
    it('should return the eth conversion rate', () => {
      assert.deepEqual(
        getConversionRate(mockState),
        1200.88200327
      )
    })
  })

  describe('getCurrentAccountWithSendEtherInfo()', () => {
    it('should return the currently selected account with identity info', () => {
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

  describe('getCurrentCurrency()', () => {
    it('should return the currently selected currency', () => {
      assert.equal(
        getCurrentCurrency(mockState),
        'USD'
      )
    })
  })

  describe('getCurrentNetwork()', () => {
    it('should return the id of the currently selected network', () => {
      assert.equal(
        getCurrentNetwork(mockState),
        '3'
      )
    })
  })

  describe('getCurrentViewContext()', () => {
    it('should return the context of the current view', () => {
      assert.equal(
        getCurrentViewContext(mockState),
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'
      )
    })
  })

  describe('getForceGasMin()', () => {
    it('should get the send.forceGasMin property', () => {
      assert.equal(
        getForceGasMin(mockState),
        true
      )
    })
  })

  describe('getGasLimit()', () => {
    it('should return the send.gasLimit', () => {
      assert.equal(
        getGasLimit(mockState),
        '0xFFFF'
      )
    })
  })

  describe('getGasPrice()', () => {
    it('should return the send.gasPrice', () => {
      assert.equal(
        getGasPrice(mockState),
        '0xaa'
      )
    })
  })

  describe('getGasTotal()', () => {
    it('should return the send.gasTotal', () => {
      assert.equal(
        getGasTotal(mockState),
        '0xb451dc41b578'
      )
    })
  })

  describe('getPrimaryCurrency()', () => {
    it('should return the symbol of the selected token', () => {
      assert.equal(
        getPrimaryCurrency(mockState),
        'DEF'
      )
    })
  })

  describe('getRecentBlocks()', () => {
    it('should return the recent blocks', () => {
      assert.deepEqual(
        getRecentBlocks(mockState),
        ['mockBlock1', 'mockBlock2', 'mockBlock3']
      )
    })
  })

  describe('getSelectedAccount()', () => {
    it('should return the currently selected account', () => {
      assert.deepEqual(
        getSelectedAccount(mockState),
        {
          code: '0x',
          balance: '0x0',
          nonce: '0x0',
          address: '0xd85a4b6a394794842887b8284293d69163007bbb',
        }
      )
    })
  })

  describe('getSelectedAddress()', () => {
    it('should', () => {
      assert.equal(
        getSelectedAddress(mockState),
        '0xd85a4b6a394794842887b8284293d69163007bbb'
      )
    })
  })

  describe('getSelectedIdentity()', () => {
    it('should return the identity object of the currently selected address', () => {
      assert.deepEqual(
        getSelectedIdentity(mockState),
        {
          address: '0xd85a4b6a394794842887b8284293d69163007bbb',
          name: 'Send Account 4',
        }
      )
    })
  })

  describe('getSelectedToken()', () => {
    it('should return the currently selected token if selected', () => {
      assert.deepEqual(
        getSelectedToken(mockState),
        {
          address: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
          decimals: 4,
          symbol: 'DEF',
        }
      )
    })

    it('should return the send token if none is currently selected, but a send token exists', () => {
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

  describe('getSelectedTokenContract()', () => {
    it('should return the contract at the selected token address', () => {
      assert.equal(
        getSelectedTokenContract(mockState),
        'mockAt:0x8d6b81208414189a58339873ab429b6c47ab92d3'
      )
    })

    it('should return null if no token is selected', () => {
      const modifiedMetamaskState = Object.assign({}, mockState.metamask, { selectedTokenAddress: false })
      assert.equal(
        getSelectedTokenContract(Object.assign({}, mockState, { metamask: modifiedMetamaskState })),
        null
      )
    })
  })

  describe('getSelectedTokenExchangeRate()', () => {
    it('should return the exchange rate for the selected token', () => {
      assert.equal(
        getSelectedTokenExchangeRate(mockState),
        2.0
      )
    })
  })

  describe('getSelectedTokenToFiatRate()', () => {
    it('should return rate for converting the selected token to fiat', () => {
      assert.equal(
        getSelectedTokenToFiatRate(mockState),
        2401.76400654
      )
    })
  })

  describe('getSendAmount()', () => {
    it('should return the send.amount', () => {
      assert.equal(
        getSendAmount(mockState),
        '0x080'
      )
    })
  })

  describe('getSendEditingTransactionId()', () => {
    it('should return the send.editingTransactionId', () => {
      assert.equal(
        getSendEditingTransactionId(mockState),
        97531
      )
    })
  })

  describe('getSendErrors()', () => {
    it('should return the send.errors', () => {
      assert.deepEqual(
        getSendErrors(mockState),
        { someError: null }
      )
    })
  })

  describe('getSendFrom()', () => {
    it('should return the send.from', () => {
      assert.deepEqual(
        getSendFrom(mockState),
        {
          address: '0xabcdefg',
          balance: '0x5f4e3d2c1',
        }
      )
    })
  })

  describe('getSendFromBalance()', () => {
    it('should get the send.from balance if it exists', () => {
      assert.equal(
        getSendFromBalance(mockState),
        '0x5f4e3d2c1'
      )
    })

    it('should get the selected account balance if the send.from does not exist', () => {
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

  describe('getSendFromObject()', () => {
    it('should return send.from if it exists', () => {
      assert.deepEqual(
        getSendFromObject(mockState),
        {
          address: '0xabcdefg',
          balance: '0x5f4e3d2c1',
        }
      )
    })

    it('should return the current account with send ether info if send.from does not exist', () => {
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
          name: 'Send Account 4',
        }
      )
    })
  })

  describe('getSendMaxModeState()', () => {
    it('should return send.maxModeOn', () => {
      assert.equal(
        getSendMaxModeState(mockState),
        false
      )
    })
  })

  describe('getSendTo()', () => {
    it('should return send.to', () => {
      assert.equal(
        getSendTo(mockState),
        '0x987fedabc'
      )
    })
  })

  describe('getSendToAccounts()', () => {
    it('should return an array including all the users accounts and the address book', () => {
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
          },
        ]
      )
    })
  })

  describe('getTokenBalance()', () => {
    it('should', () => {
      assert.equal(
        getTokenBalance(mockState),
        3434
      )
    })
  })

  describe('getTokenExchangeRate()', () => {
    it('should return the passed tokens exchange rates', () => {
      assert.equal(
        getTokenExchangeRate(mockState, 'GHI'),
        31.01
      )
    })
  })

  describe('getUnapprovedTxs()', () => {
    it('should return the unapproved txs', () => {
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

  describe('transactionsSelector()', () => {
    it('should return the selected addresses selected token transactions', () => {
      assert.deepEqual(
        transactionsSelector(mockState),
        [
          {
            id: 'mockTokenTx1',
            txParams: {
              to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
            },
            time: 1700000000000,
          },
          {
            id: 'mockTokenTx3',
            txParams: {
              to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
            },
            time: 1500000000000,
          },
        ]
      )
    })

    it('should return all transactions if no token is selected', () => {
      const modifiedMetamaskState = Object.assign({}, mockState.metamask, { selectedTokenAddress: false })
      const modifiedState = Object.assign({}, mockState, { metamask: modifiedMetamaskState })
      assert.deepEqual(
        transactionsSelector(modifiedState),
        [
          {
            id: 'mockTokenTx1',
            time: 1700000000000,
            txParams: {
              to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
            },
          },
          {
            id: 'unapprovedMessage1',
            time: 1650000000000,
          },
          {
            id: 'mockTokenTx2',
            time: 1600000000000,
            txParams: {
              to: '0xafaketokenaddress',
            },
          },
          {
            id: 'unapprovedMessage2',
            time: 1550000000000,
          },
          {
            id: 'mockTokenTx3',
            time: 1500000000000,
            txParams: {
              to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
            },
          },
          {
            id: 'unapprovedMessage3',
            time: 1450000000000,
          },
          {
            id: 'mockEthTx1',
            time: 1400000000000,
            txParams: {
              to: '0xd85a4b6a394794842887b8284293d69163007bbb',
            },
          },
        ]
      )
    })

    it('should return shapeshift transactions if current network is 1', () => {
      const modifiedMetamaskState = Object.assign({}, mockState.metamask, { selectedTokenAddress: false, network: '1' })
      const modifiedState = Object.assign({}, mockState, { metamask: modifiedMetamaskState })
      assert.deepEqual(
        transactionsSelector(modifiedState),
        [
          {
            id: 'mockTokenTx1',
            time: 1700000000000,
            txParams: {
              to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
            },
          },
          { id: 'shapeShiftTx1', 'time': 1675000000000 },
          {
            id: 'unapprovedMessage1',
            time: 1650000000000,
          },
          {
            id: 'mockTokenTx2',
            time: 1600000000000,
            txParams: {
              to: '0xafaketokenaddress',
            },
          },
          { id: 'shapeShiftTx2', 'time': 1575000000000 },
          {
            id: 'unapprovedMessage2',
            time: 1550000000000,
          },
          {
            id: 'mockTokenTx3',
            time: 1500000000000,
            txParams: {
              to: '0x8d6b81208414189a58339873ab429b6c47ab92d3',
            },
          },
          { id: 'shapeShiftTx3', 'time': 1475000000000 },
          {
            id: 'unapprovedMessage3',
            time: 1450000000000,
          },
          {
            id: 'mockEthTx1',
            time: 1400000000000,
            txParams: {
              to: '0xd85a4b6a394794842887b8284293d69163007bbb',
            },
          },
        ]
      )
    })
  })

})
