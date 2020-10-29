import assert from 'assert'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import nock from 'nock'
import { cloneDeep } from 'lodash'

import waitUntilCalled from '../../../lib/wait-until-called'
import {
  GOERLI,
  KOVAN,
  MAINNET,
  RINKEBY,
  ROPSTEN,
} from '../../../../app/scripts/controllers/network/enums'

const IncomingTransactionsController = proxyquire('../../../../app/scripts/controllers/incoming-transactions', {
  '../lib/random-id': { default: () => 54321 },
}).default

const FAKE_NETWORK = 'FAKE_NETWORK'
const MOCK_SELECTED_ADDRESS = '0x0101'

function getEmptyInitState () {
  return {
    incomingTransactions: {},
    incomingTxLastFetchedBlocksByNetwork: {
      [GOERLI]: null,
      [KOVAN]: null,
      [MAINNET]: null,
      [RINKEBY]: null,
      [ROPSTEN]: null,
    },
  }
}

function getNonEmptyInitState () {
  return {
    incomingTransactions: {
      '0x123456': { id: 777 },
    },
    incomingTxLastFetchedBlocksByNetwork: {
      [GOERLI]: 1,
      [KOVAN]: 2,
      [MAINNET]: 3,
      [RINKEBY]: 5,
      [ROPSTEN]: 4,
    },
  }
}

function getNonEmptyInitStateWithFakeNetworkState () {
  return {
    incomingTransactions: {
      '0x123456': { id: 777 },
    },
    incomingTxLastFetchedBlocksByNetwork: {
      [ROPSTEN]: 1,
      [RINKEBY]: 2,
      [KOVAN]: 3,
      [GOERLI]: 5,
      [MAINNET]: 4,
      [FAKE_NETWORK]: 1111,
    },
  }
}

function getMockNetworkController (networkType = FAKE_NETWORK) {
  return {
    getProviderConfig: () => {
      return { type: networkType }
    },
    on: sinon.spy(),
  }
}

function getMockPreferencesController ({ showIncomingTransactions = true } = {}) {
  return {
    getSelectedAddress: sinon.stub().returns(MOCK_SELECTED_ADDRESS),
    store: {
      getState: sinon.stub().returns({
        featureFlags: {
          showIncomingTransactions,
        },
      }),
      subscribe: sinon.spy(),
    },
  }
}

function getMockBlockTracker () {
  return {
    addListener: sinon.stub().callsArgWithAsync(1, '0xa'),
    removeListener: sinon.spy(),
    testProperty: 'fakeBlockTracker',
    getCurrentBlock: () => '0xa',
  }
}

/**
 * A transaction object in the format returned by the Etherscan API.
 *
 * Note that this is not an exhaustive type definiton; only the properties we use are defined
 *
 * @typedef {Object} EtherscanTransaction
 * @property {string} blockNumber - The number of the block this transaction was found in, in decimal
 * @property {string} from - The hex-prefixed address of the sender
 * @property {string} gas - The gas limit, in decimal WEI
 * @property {string} gasPrice - The gas price, in decimal WEI
 * @property {string} hash - The hex-prefixed transaction hash
 * @property {string} isError - Whether the transaction was confirmed or failed (0 for confirmed, 1 for failed)
 * @property {string} nonce - The transaction nonce, in decimal
 * @property {string} timeStamp - The timestamp for the transaction, in seconds
 * @property {string} to - The hex-prefixed address of the recipient
 * @property {string} value - The amount of ETH sent in this transaction, in decimal WEI
 */

/**
 * Returns a transaction object matching the expected format returned
 * by the Etherscan API
 *
 * @param {string} [toAddress] - The hex-prefixed address of the recipient
 * @param {number} [blockNumber] - The block number for the transaction
 *  @returns {EtherscanTransaction}
 */
const getFakeEtherscanTransaction = (toAddress = MOCK_SELECTED_ADDRESS, blockNumber = 10) => {
  return {
    blockNumber: blockNumber.toString(),
    from: '0xfake',
    gas: '0',
    gasPrice: '0',
    hash: '0xfake',
    isError: '0',
    nonce: '100',
    timeStamp: '16000000000000',
    to: toAddress,
    value: '0',
  }
}

describe('IncomingTransactionsController', function () {

  afterEach(function () {
    sinon.restore()
    nock.cleanAll()
  })

  describe('constructor', function () {
    it('should set up correct store, listeners and properties in the constructor', function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: {},
      })
      sinon.spy(incomingTransactionsController, '_update')

      assert.deepEqual(incomingTransactionsController.store.getState(), getEmptyInitState())

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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })

      assert.deepEqual(incomingTransactionsController.store.getState(), getNonEmptyInitState())
    })
  })

  describe('update events', function () {
    it('should set up a listener for the latest block', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: {},
      })

      incomingTransactionsController.start()

      assert(incomingTransactionsController.blockTracker.addListener.calledOnce)
      assert.equal(incomingTransactionsController.blockTracker.addListener.getCall(0).args[0], 'latest')
    })

    it('should update upon latest block when started and on supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(ROPSTEN),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      const startBlock = getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork[ROPSTEN]
      nock('https://api-ropsten.etherscan.io')
        .get(`/api?module=account&action=txlist&address=${MOCK_SELECTED_ADDRESS}&tag=latest&page=1&startBlock=${startBlock}`)
        .reply(
          200,
          JSON.stringify({
            status: '1',
            result: [getFakeEtherscanTransaction()],
          }),
        )
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)

      incomingTransactionsController.start()
      await updateStateCalled

      const actualState = incomingTransactionsController.store.getState()
      const generatedTxId = actualState?.incomingTransactions?.['0xfake']?.id

      const actualStateWithoutGenerated = cloneDeep(actualState)
      delete actualStateWithoutGenerated?.incomingTransactions?.['0xfake']?.id

      assert.ok(typeof generatedTxId === 'number' && generatedTxId > 0, 'Generated transaction ID should be a positive number')
      assert.deepStrictEqual(
        actualStateWithoutGenerated,
        {
          incomingTransactions: {
            ...getNonEmptyInitState().incomingTransactions,
            '0xfake': {
              blockNumber: '10',
              hash: '0xfake',
              metamaskNetworkId: '3',
              status: 'confirmed',
              time: 16000000000000000,
              transactionCategory: 'incoming',
              txParams: {
                from: '0xfake',
                gas: '0x0',
                gasPrice: '0x0',
                nonce: '0x64',
                to: '0x0101',
                value: '0x0',
              },
            },
          },
          incomingTxLastFetchedBlocksByNetwork: {
            ...getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork,
            [ROPSTEN]: 11,
          },
        },
        'State should have been updated after first block was received',
      )
    })

    it('should update last block fetched when started and not on supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)

      incomingTransactionsController.start()

      await updateStateCalled

      const state = incomingTransactionsController.store.getState()
      assert.deepStrictEqual(
        state,
        {
          incomingTransactions: {
            ...getNonEmptyInitState().incomingTransactions,
          },
          incomingTxLastFetchedBlocksByNetwork: {
            ...getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork,
            [FAKE_NETWORK]: 11,
          },
        },
        'Should update last block fetched',
      )
    })

    it('should not update upon latest block when started and incoming transactions disabled', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController({ showIncomingTransactions: false }),
        initState: getNonEmptyInitState(),
      })
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      for (const network of [GOERLI, KOVAN, MAINNET, RINKEBY, ROPSTEN]) {
        nock(`https://api${network === MAINNET ? '' : `-${network.toLowerCase()}`}.etherscan.io`)
          .get(/api.+/u)
          .reply(
            200,
            JSON.stringify({
              status: '1',
              result: [getFakeEtherscanTransaction()],
            }),
          )
      }
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)
      const putStateStub = sinon.stub(incomingTransactionsController.store, 'putState')
      const putStateCalled = waitUntilCalled(putStateStub, incomingTransactionsController.store)

      incomingTransactionsController.start()

      try {
        await Promise.race([
          updateStateCalled,
          putStateCalled,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 1000)
          }),
        ])
        assert.fail('Update state should not have been called')
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown')
      }
    })

    it('should not update upon latest block when not started', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(ROPSTEN),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      for (const network of [GOERLI, KOVAN, MAINNET, RINKEBY, ROPSTEN]) {
        nock(`https://api${network === MAINNET ? '' : `-${network.toLowerCase()}`}.etherscan.io`)
          .get(/api.+/u)
          .reply(
            200,
            JSON.stringify({
              status: '1',
              result: [getFakeEtherscanTransaction()],
            }),
          )
      }
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)
      const putStateStub = sinon.stub(incomingTransactionsController.store, 'putState')
      const putStateCalled = waitUntilCalled(putStateStub, incomingTransactionsController.store)

      try {
        await Promise.race([
          updateStateCalled,
          putStateCalled,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 1000)
          }),
        ])
        assert.fail('Update state should not have been called')
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown')
      }
    })

    it('should not update upon latest block when stopped', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(ROPSTEN),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      for (const network of [GOERLI, KOVAN, MAINNET, RINKEBY, ROPSTEN]) {
        nock(`https://api${network === MAINNET ? '' : `-${network.toLowerCase()}`}.etherscan.io`)
          .get(/api.+/u)
          .reply(
            200,
            JSON.stringify({
              status: '1',
              result: [getFakeEtherscanTransaction()],
            }),
          )
      }
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)
      const putStateStub = sinon.stub(incomingTransactionsController.store, 'putState')
      const putStateCalled = waitUntilCalled(putStateStub, incomingTransactionsController.store)

      incomingTransactionsController.stop()

      try {
        await Promise.race([
          updateStateCalled,
          putStateCalled,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('TIMEOUT')), 1000)
          }),
        ])
        assert.fail('Update state should not have been called')
      } catch (error) {
        assert(error.message === 'TIMEOUT', 'TIMEOUT error should be thrown')
      }
    })

    it('should update when the selected address changes and on supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(ROPSTEN),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      const NEW_MOCK_SELECTED_ADDRESS = `${MOCK_SELECTED_ADDRESS}9`
      const startBlock = getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork[ROPSTEN]
      nock('https://api-ropsten.etherscan.io')
        .get(`/api?module=account&action=txlist&address=${NEW_MOCK_SELECTED_ADDRESS}&tag=latest&page=1&startBlock=${startBlock}`)
        .reply(
          200,
          JSON.stringify({
            status: '1',
            result: [getFakeEtherscanTransaction(NEW_MOCK_SELECTED_ADDRESS)],
          }),
        )
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)

      const subscription = incomingTransactionsController.preferencesController.store.subscribe.getCall(1).args[0]
      // The incoming transactions controller will always skip the first event
      // We need to call subscription twice to test the event handling
      // TODO: stop skipping the first event
      await subscription({ selectedAddress: MOCK_SELECTED_ADDRESS })
      await subscription({ selectedAddress: NEW_MOCK_SELECTED_ADDRESS })
      await updateStateCalled

      const actualState = incomingTransactionsController.store.getState()
      const generatedTxId = actualState?.incomingTransactions?.['0xfake']?.id

      const actualStateWithoutGenerated = cloneDeep(actualState)
      delete actualStateWithoutGenerated?.incomingTransactions?.['0xfake']?.id

      assert.ok(typeof generatedTxId === 'number' && generatedTxId > 0, 'Generated transaction ID should be a positive number')
      assert.deepStrictEqual(
        actualStateWithoutGenerated,
        {
          incomingTransactions: {
            ...getNonEmptyInitState().incomingTransactions,
            '0xfake': {
              blockNumber: '10',
              hash: '0xfake',
              metamaskNetworkId: '3',
              status: 'confirmed',
              time: 16000000000000000,
              transactionCategory: 'incoming',
              txParams: {
                from: '0xfake',
                gas: '0x0',
                gasPrice: '0x0',
                nonce: '0x64',
                to: '0x01019',
                value: '0x0',
              },
            },
          },
          incomingTxLastFetchedBlocksByNetwork: {
            ...getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork,
            [ROPSTEN]: 11,
          },
        },
        'State should have been updated after first block was received',
      )
    })

    it('should update last block fetched when selected address changes and not on supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: { ...getMockBlockTracker() },
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      const NEW_MOCK_SELECTED_ADDRESS = `${MOCK_SELECTED_ADDRESS}9`
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      for (const network of [GOERLI, KOVAN, MAINNET, RINKEBY, ROPSTEN]) {
        nock(`https://api${network === MAINNET ? '' : `-${network.toLowerCase()}`}.etherscan.io`)
          .get(/api.+/u)
          .reply(
            200,
            JSON.stringify({
              status: '1',
              result: [getFakeEtherscanTransaction(NEW_MOCK_SELECTED_ADDRESS)],
            }),
          )
      }
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)

      const subscription = incomingTransactionsController.preferencesController.store.subscribe.getCall(1).args[0]
      // The incoming transactions controller will always skip the first event
      // We need to call subscription twice to test the event handling
      // TODO: stop skipping the first event
      await subscription({ selectedAddress: MOCK_SELECTED_ADDRESS })
      await subscription({ selectedAddress: NEW_MOCK_SELECTED_ADDRESS })

      await updateStateCalled

      const state = incomingTransactionsController.store.getState()
      assert.deepStrictEqual(
        state,
        {
          incomingTransactions: {
            ...getNonEmptyInitState().incomingTransactions,
          },
          incomingTxLastFetchedBlocksByNetwork: {
            ...getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork,
            [FAKE_NETWORK]: 11,
          },
        },
        'Should update last block fetched',
      )
    })

    it('should update when switching to a supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(ROPSTEN),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      const startBlock = getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork[ROPSTEN]
      nock('https://api-ropsten.etherscan.io')
        .get(`/api?module=account&action=txlist&address=${MOCK_SELECTED_ADDRESS}&tag=latest&page=1&startBlock=${startBlock}`)
        .reply(
          200,
          JSON.stringify({
            status: '1',
            result: [getFakeEtherscanTransaction()],
          }),
        )
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)

      const subscription = incomingTransactionsController.networkController.on.getCall(0).args[1]
      incomingTransactionsController.networkController = getMockNetworkController(ROPSTEN)
      await subscription(ROPSTEN)
      await updateStateCalled

      const actualState = incomingTransactionsController.store.getState()
      const generatedTxId = actualState?.incomingTransactions?.['0xfake']?.id

      const actualStateWithoutGenerated = cloneDeep(actualState)
      delete actualStateWithoutGenerated?.incomingTransactions?.['0xfake']?.id

      assert.ok(typeof generatedTxId === 'number' && generatedTxId > 0, 'Generated transaction ID should be a positive number')
      assert.deepStrictEqual(
        actualStateWithoutGenerated,
        {
          incomingTransactions: {
            ...getNonEmptyInitState().incomingTransactions,
            '0xfake': {
              blockNumber: '10',
              hash: '0xfake',
              metamaskNetworkId: '3',
              status: 'confirmed',
              time: 16000000000000000,
              transactionCategory: 'incoming',
              txParams: {
                from: '0xfake',
                gas: '0x0',
                gasPrice: '0x0',
                nonce: '0x64',
                to: '0x0101',
                value: '0x0',
              },
            },
          },
          incomingTxLastFetchedBlocksByNetwork: {
            ...getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork,
            [ROPSTEN]: 11,
          },
        },
        'State should have been updated after first block was received',
      )
    })

    it('should update last block fetched when switching to an unsupported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })
      // reply with a valid request for any supported network, so that this test has every opportunity to fail
      for (const network of [GOERLI, KOVAN, MAINNET, RINKEBY, ROPSTEN]) {
        nock(`https://api${network === MAINNET ? '' : `-${network.toLowerCase()}`}.etherscan.io`)
          .get(/api.+/u)
          .reply(
            200,
            JSON.stringify({
              status: '1',
              result: [getFakeEtherscanTransaction()],
            }),
          )
      }
      const updateStateStub = sinon.stub(incomingTransactionsController.store, 'updateState')
      const updateStateCalled = waitUntilCalled(updateStateStub, incomingTransactionsController.store)

      const subscription = incomingTransactionsController.networkController.on.getCall(0).args[1]
      await subscription('SECOND_FAKE_NETWORK')

      await updateStateCalled

      const state = incomingTransactionsController.store.getState()
      assert.deepStrictEqual(
        state,
        {
          incomingTransactions: {
            ...getNonEmptyInitState().incomingTransactions,
          },
          incomingTxLastFetchedBlocksByNetwork: {
            ...getNonEmptyInitState().incomingTxLastFetchedBlocksByNetwork,
            SECOND_FAKE_NETWORK: 11,
          },
        },
        'Should update last block fetched',
      )
    })
  })

  describe('_getDataForUpdate', function () {
    it('should call fetchAll with the correct params when passed a new block number and the current network has no stored block', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitStateWithFakeNetworkState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitStateWithFakeNetworkState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitStateWithFakeNetworkState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })

      await incomingTransactionsController._fetchTxs('0xfakeaddress', '789', ROPSTEN)

      assert(mockFetch.calledOnce)
      assert.equal(mockFetch.getCall(0).args[0], `https://api-${ROPSTEN}.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1&startBlock=789`)
    })

    it('should call fetch with the expected url when passed an address, block number and MAINNET', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })

      await incomingTransactionsController._fetchTxs('0xfakeaddress', '789', MAINNET)

      assert(mockFetch.calledOnce)
      assert.equal(mockFetch.getCall(0).args[0], `https://api.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1&startBlock=789`)
    })

    it('should call fetch with the expected url when passed an address and supported network, but a falsy block number', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })

      await incomingTransactionsController._fetchTxs('0xfakeaddress', null, ROPSTEN)

      assert(mockFetch.calledOnce)
      assert.equal(mockFetch.getCall(0).args[0], `https://api-${ROPSTEN}.etherscan.io/api?module=account&action=txlist&address=0xfakeaddress&tag=latest&page=1`)
    })

    it('should not fetch and return an empty object when passed an unsported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
      })

      const result = await incomingTransactionsController._fetchTxs('0xfakeaddress', null, 'UNSUPPORTED_NETWORK')

      assert(mockFetch.notCalled)
      assert.deepEqual(result, {})
    })

    it('should return the results from the fetch call, plus the address and currentNetworkID, when passed an address, block number and supported network', async function () {
      const incomingTransactionsController = new IncomingTransactionsController({
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
        blockTracker: getMockBlockTracker(),
        networkController: getMockNetworkController(),
        preferencesController: getMockPreferencesController(),
        initState: getNonEmptyInitState(),
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
