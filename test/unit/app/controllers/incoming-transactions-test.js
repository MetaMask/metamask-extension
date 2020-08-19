import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

import { ROPSTEN, RINKEBY, KOVAN, GOERLI, MAINNET } from '../../../../app/scripts/controllers/network/enums'

const IncomingTransactionsController = proxyquire('../../../../app/scripts/controllers/incoming-transactions', {
  '../lib/random-id': { default: () => 54321 },
}).default

describe('IncomingTransactionsController', function () {
  const EMPTY_INIT_STATE = {
    incomingTransactions: {},
    incomingTxLastFetchedBlocksByNetwork: {
      [ROPSTEN]: null,
      [RINKEBY]: null,
      [KOVAN]: null,
      [GOERLI]: null,
      [MAINNET]: null,
    },
  }

  const NON_EMPTY_INIT_STATE = {
    incomingTransactions: {
      '0x123456': { id: 777 },
    },
    incomingTxLastFetchedBlocksByNetwork: {
      [ROPSTEN]: 1,
      [RINKEBY]: 2,
      [KOVAN]: 3,
      [GOERLI]: 5,
      [MAINNET]: 4,
    },
  }

  const NON_EMPTY_INIT_STATE_WITH_FAKE_NETWORK_STATE = {
    incomingTransactions: {
      '0x123456': { id: 777 },
    },
    incomingTxLastFetchedBlocksByNetwork: {
      [ROPSTEN]: 1,
      [RINKEBY]: 2,
      [KOVAN]: 3,
      [GOERLI]: 5,
      [MAINNET]: 4,
      FAKE_NETWORK: 1111,
    },
  }

  const MOCK_BLOCKTRACKER = {
    addListener: sinon.spy(),
    removeListener: sinon.spy(),
    testProperty: 'fakeBlockTracker',
    getCurrentBlock: () => '0xa',
  }

  const MOCK_NETWORK_CONTROLLER = {
    getProviderConfig: () => ({ type: 'FAKE_NETWORK' }),
    on: sinon.spy(),
  }

  const MOCK_PREFERENCES_CONTROLLER = {
    getSelectedAddress: sinon.stub().returns('0x0101'),
    store: {
      getState: sinon.stub().returns({
        featureFlags: {
          showIncomingTransactions: true,
        },
      }),
      subscribe: sinon.spy(),
    },
  }

  describe('constructor', function () {
    it('should set up correct store, listeners and properties in the constructor', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: {},
      })
      sinon.spy(incomingTransactionsController, '_update')

      assert.deepEqual(incomingTransactionsController.blockTracker, MOCK_BLOCKTRACKER)
      assert.deepEqual(incomingTransactionsController.networkController, MOCK_NETWORK_CONTROLLER)
      assert.equal(incomingTransactionsController.preferencesController, MOCK_PREFERENCES_CONTROLLER)
      assert.equal(incomingTransactionsController.getCurrentNetwork(), 'FAKE_NETWORK')

      assert.deepEqual(incomingTransactionsController.store.getState(), EMPTY_INIT_STATE)

      assert(incomingTransactionsController.networkController.on.calledOnce)
      assert.equal(incomingTransactionsController.networkController.on.getCall(0).args[0], 'networkDidChange')
      const networkControllerListenerCallback = incomingTransactionsController.networkController.on.getCall(0).args[1]
      assert.equal(incomingTransactionsController._update.callCount, 0)
      networkControllerListenerCallback('testNetworkType')
      assert.equal(incomingTransactionsController._update.callCount, 1)
      assert.deepEqual(incomingTransactionsController._update.getCall(0).args[0], {
        address: '0x0101',
        networkType: 'testNetworkType',
      })

      incomingTransactionsController._update.resetHistory()
    })

    it('should set the store to a provided initial state', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      assert.deepEqual(incomingTransactionsController.store.getState(), NON_EMPTY_INIT_STATE)
    })
  })

  describe('#start', function () {
    it('should set up a listener for the latest block', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: {},
      })
      sinon.spy(incomingTransactionsController, '_update')

      incomingTransactionsController.start()

      assert(incomingTransactionsController.blockTracker.addListener.calledOnce)
      assert.equal(incomingTransactionsController.blockTracker.addListener.getCall(0).args[0], 'latest')
      const blockTrackerListenerCallback = incomingTransactionsController.blockTracker.addListener.getCall(0).args[1]
      assert.equal(incomingTransactionsController._update.callCount, 0)
      blockTrackerListenerCallback('0xabc')
      assert.equal(incomingTransactionsController._update.callCount, 1)
      assert.deepEqual(incomingTransactionsController._update.getCall(0).args[0], {
        address: '0x0101',
        newBlockNumberDec: 2748,
      })
    })
  })

  describe('_getDataForUpdate', function () {
    it('should call fetchAll with the correct params when passed a new block number and the current network has no stored block', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })
      incomingTransactionsController._fetchAll = sinon.stub().returns({})

      await incomingTransactionsController._getDataForUpdate({ address: 'fakeAddress', newBlockNumberDec: 999 })

      assert(incomingTransactionsController._fetchAll.calledOnce)

      assert.deepEqual(incomingTransactionsController._fetchAll.getCall(0).args, [
        'fakeAddress', 999, 'FAKE_NETWORK',
      ])
    })

    it('should call fetchAll with the correct params when passed a new block number but the current network has a stored block', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE_WITH_FAKE_NETWORK_STATE,
      })
      incomingTransactionsController._fetchAll = sinon.stub().returns({})

      await incomingTransactionsController._getDataForUpdate({ address: 'fakeAddress', newBlockNumberDec: 999 })

      assert(incomingTransactionsController._fetchAll.calledOnce)

      assert.deepEqual(incomingTransactionsController._fetchAll.getCall(0).args, [
        'fakeAddress', 1111, 'FAKE_NETWORK',
      ])
    })

    it('should call fetchAll with the correct params when passed a new network type but no block info exists', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE_WITH_FAKE_NETWORK_STATE,
      })
      incomingTransactionsController._fetchAll = sinon.stub().returns({})

      await incomingTransactionsController._getDataForUpdate({
        address: 'fakeAddress',
        networkType: 'NEW_FAKE_NETWORK',
      })

      assert(incomingTransactionsController._fetchAll.calledOnce)

      assert.deepEqual(incomingTransactionsController._fetchAll.getCall(0).args, [
        'fakeAddress', 10, 'NEW_FAKE_NETWORK',
      ])
    })

    it('should return the expected data', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE_WITH_FAKE_NETWORK_STATE,
      })
      incomingTransactionsController._fetchAll = sinon.stub().returns({
        latestIncomingTxBlockNumber: 444,
        txs: [{ id: 555 }],
      })

      const result = await incomingTransactionsController._getDataForUpdate({
        address: 'fakeAddress',
        networkType: 'FAKE_NETWORK',
      })

      assert.deepEqual(result, {
        latestIncomingTxBlockNumber: 444,
        newTxs: [{ id: 555 }],
        currentIncomingTxs: {
          '0x123456': { id: 777 },
        },
        currentBlocksByNetwork: {
          [ROPSTEN]: 1,
          [RINKEBY]: 2,
          [KOVAN]: 3,
          [GOERLI]: 5,
          [MAINNET]: 4,
          FAKE_NETWORK: 1111,
        },
        fetchedBlockNumber: 1111,
        network: 'FAKE_NETWORK',
      })
    })
  })

  describe('_updateStateWithNewTxData', function () {
    const MOCK_INPUT_WITHOUT_LASTEST = {
      newTxs: [{ id: 555, hash: '0xfff' }],
      currentIncomingTxs: {
        '0x123456': { id: 777, hash: '0x123456' },
      },
      currentBlocksByNetwork: {
        [ROPSTEN]: 1,
        [RINKEBY]: 2,
        [KOVAN]: 3,
        [GOERLI]: 5,
        [MAINNET]: 4,
        FAKE_NETWORK: 1111,
      },
      fetchedBlockNumber: 1111,
      network: 'FAKE_NETWORK',
    }

    const MOCK_INPUT_WITH_LASTEST = {
      ...MOCK_INPUT_WITHOUT_LASTEST,
      latestIncomingTxBlockNumber: 444,
    }

    it('should update state with correct blockhash and transactions when passed a truthy latestIncomingTxBlockNumber', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })
      sinon.spy(incomingTransactionsController.store, 'updateState')

      await incomingTransactionsController._updateStateWithNewTxData(MOCK_INPUT_WITH_LASTEST)

      assert(incomingTransactionsController.store.updateState.calledOnce)

      assert.deepEqual(incomingTransactionsController.store.updateState.getCall(0).args[0], {
        incomingTxLastFetchedBlocksByNetwork: {
          ...MOCK_INPUT_WITH_LASTEST.currentBlocksByNetwork,
          'FAKE_NETWORK': 445,
        },
        incomingTransactions: {
          '0x123456': { id: 777, hash: '0x123456' },
          '0xfff': { id: 555, hash: '0xfff' },
        },
      })
    })

    it('should update state with correct blockhash and transactions when passed a falsy latestIncomingTxBlockNumber', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })
      sinon.spy(incomingTransactionsController.store, 'updateState')

      await incomingTransactionsController._updateStateWithNewTxData(MOCK_INPUT_WITHOUT_LASTEST)

      assert(incomingTransactionsController.store.updateState.calledOnce)

      assert.deepEqual(incomingTransactionsController.store.updateState.getCall(0).args[0], {
        incomingTxLastFetchedBlocksByNetwork: {
          ...MOCK_INPUT_WITH_LASTEST.currentBlocksByNetwork,
          'FAKE_NETWORK': 1112,
        },
        incomingTransactions: {
          '0x123456': { id: 777, hash: '0x123456' },
          '0xfff': { id: 555, hash: '0xfff' },
        },
      })
    })
  })

  describe('_fetchTxs', function () {
    const mockFetch = sinon.stub().returns(Promise.resolve({
      json: () => Promise.resolve({ someKey: 'someValue' }),
    }))
    let tempFetch
    beforeEach(function () {
      tempFetch = window.fetch
      window.fetch = mockFetch
    })

    afterEach(function () {
      window.fetch = tempFetch
      mockFetch.resetHistory()
    })

    it('should call fetch with the expected url when passed an address, block number and supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      await incomingTransactionsController._fetchTxs('0xfakeaddress', '789', ROPSTEN)

      assert(mockFetch.calledOnce)
      assert.equal(mockFetch.getCall(0).args[0], `https://api-${ROPSTEN}.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1&startBlock=789`)
    })

    it('should call fetch with the expected url when passed an address, block number and MAINNET', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      await incomingTransactionsController._fetchTxs('0xfakeaddress', '789', MAINNET)

      assert(mockFetch.calledOnce)
      assert.equal(mockFetch.getCall(0).args[0], `https://api.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1&startBlock=789`)
    })

    it('should call fetch with the expected url when passed an address and supported network, but a falsy block number', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      await incomingTransactionsController._fetchTxs('0xfakeaddress', null, ROPSTEN)

      assert(mockFetch.calledOnce)
      assert.equal(mockFetch.getCall(0).args[0], `https://api-${ROPSTEN}.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1`)
    })

    it('should not fetch and return an empty object when passed an unsported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      const result = await incomingTransactionsController._fetchTxs('0xfakeaddress', null, 'UNSUPPORTED_NETWORK')

      assert(mockFetch.notCalled)
      assert.deepEqual(result, {})
    })

    it('should return the results from the fetch call, plus the address and currentNetworkID, when passed an address, block number and supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      const result = await incomingTransactionsController._fetchTxs('0xfakeaddress', '789', ROPSTEN)

      assert(mockFetch.calledOnce)
      assert.deepEqual(result, {
        someKey: 'someValue',
        address: '0xfakeaddress',
        currentNetworkID: '3',
      })
    })
  })

  describe('_processTxFetchResponse', function () {
    it('should return a null block number and empty tx array if status is 0', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      const result = incomingTransactionsController._processTxFetchResponse({
        status: '0',
        result: [{ id: 1 }],
        address: '0xfakeaddress',
      })

      assert.deepEqual(result, {
        latestIncomingTxBlockNumber: null,
        txs: [],
      })
    })

    it('should return a null block number and empty tx array if the passed result array is empty', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      const result = incomingTransactionsController._processTxFetchResponse({
        status: '1',
        result: [],
        address: '0xfakeaddress',
      })

      assert.deepEqual(result, {
        latestIncomingTxBlockNumber: null,
        txs: [],
      })
    })

    it('should return the expected block number and tx list when passed data from a successful fetch', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      incomingTransactionsController._normalizeTxFromEtherscan = (tx, currentNetworkID) => ({
        ...tx,
        currentNetworkID,
        normalized: true,
      })

      const result = incomingTransactionsController._processTxFetchResponse({
        status: '1',
        address: '0xfakeaddress',
        currentNetworkID: 'FAKE_NETWORK',
        result: [
          {
            hash: '0xabc123',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5000,
            time: 10,
          },
          {
            hash: '0xabc123',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5000,
            time: 10,
          },
          {
            hash: '0xabc1234',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5000,
            time: 9,
          },
          {
            hash: '0xabc12345',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5001,
            time: 11,
          },
          {
            hash: '0xabc123456',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5001,
            time: 12,
          },
          {
            hash: '0xabc1234567',
            txParams: {
              to: '0xanotherFakeaddress',
            },
            blockNumber: 5002,
            time: 13,
          },
        ],
      })

      assert.deepEqual(result, {
        latestIncomingTxBlockNumber: 5001,
        txs: [
          {
            hash: '0xabc1234',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5000,
            time: 9,
            normalized: true,
            currentNetworkID: 'FAKE_NETWORK',
          },
          {
            hash: '0xabc123',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5000,
            time: 10,
            normalized: true,
            currentNetworkID: 'FAKE_NETWORK',
          },
          {
            hash: '0xabc12345',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5001,
            time: 11,
            normalized: true,
            currentNetworkID: 'FAKE_NETWORK',
          },
          {
            hash: '0xabc123456',
            txParams: {
              to: '0xfakeaddress',
            },
            blockNumber: 5001,
            time: 12,
            normalized: true,
            currentNetworkID: 'FAKE_NETWORK',
          },
        ],
      })
    })
  })

  describe('_normalizeTxFromEtherscan', function () {
    it('should return the expected data when the tx is in error', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      const result = incomingTransactionsController._normalizeTxFromEtherscan({
        timeStamp: '4444',
        isError: '1',
        blockNumber: 333,
        from: '0xa',
        gas: '11',
        gasPrice: '12',
        nonce: '13',
        to: '0xe',
        value: '15',
        hash: '0xg',
      }, 'FAKE_NETWORK')

      assert.deepEqual(result, {
        blockNumber: 333,
        id: 54321,
        metamaskNetworkId: 'FAKE_NETWORK',
        status: 'failed',
        time: 4444000,
        txParams: {
          from: '0xa',
          gas: '0xb',
          gasPrice: '0xc',
          nonce: '0xd',
          to: '0xe',
          value: '0xf',
        },
        hash: '0xg',
        transactionCategory: 'incoming',
      })
    })

    it('should return the expected data when the tx is not in error', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: MOCK_BLOCKTRACKER,
        networkController: MOCK_NETWORK_CONTROLLER,
        preferencesController: MOCK_PREFERENCES_CONTROLLER,
        initState: NON_EMPTY_INIT_STATE,
      })

      const result = incomingTransactionsController._normalizeTxFromEtherscan({
        timeStamp: '4444',
        isError: '0',
        blockNumber: 333,
        from: '0xa',
        gas: '11',
        gasPrice: '12',
        nonce: '13',
        to: '0xe',
        value: '15',
        hash: '0xg',
      }, 'FAKE_NETWORK')

      assert.deepEqual(result, {
        blockNumber: 333,
        id: 54321,
        metamaskNetworkId: 'FAKE_NETWORK',
        status: 'confirmed',
        time: 4444000,
        txParams: {
          from: '0xa',
          gas: '0xb',
          gasPrice: '0xc',
          nonce: '0xd',
          to: '0xe',
          value: '0xf',
        },
        hash: '0xg',
        transactionCategory: 'incoming',
      })
    })
  })
})
