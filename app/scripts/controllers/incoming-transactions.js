const ObservableStore = require('obs-store')
const extend = require('xtend')
const EthQuery = require('eth-query')
const log = require('loglevel')
const BN = require('bn.js')
const createId = require('../lib/random-id')
const { bnToHex } = require('../lib/util')
const {
  MAINNET_CODE,
  ROPSTEN_CODE,
  RINKEYBY_CODE,
  KOVAN_CODE,
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
} = require('./network/enums')
const networkTypeToIdMap = {
  [ROPSTEN]: ROPSTEN_CODE,
  [RINKEBY]: RINKEYBY_CODE,
  [KOVAN]: KOVAN_CODE,
  [MAINNET]: MAINNET_CODE,
}

class IncomingTransactionsController {

  constructor (opts = {}) {
    const {
      blockTracker,
      provider,
      networkController,
      getSelectedAddress,
    } = opts
    this.blockTracker = blockTracker
    this.ethQuery = new EthQuery(provider)
    this.getSelectedAddress = getSelectedAddress
    this.getCurrentNetwork = () => networkController.getProviderConfig().type

    const initState = extend({
      incomingTransactions: {},
      incomingTxlastFetchedBlocksByNetwork: {
        [ROPSTEN]: null,
        [RINKEBY]: null,
        [KOVAN]: null,
        [MAINNET]: null,
      },
    }, opts.initState)
    this.store = new ObservableStore(initState)

    const changeListener = async ({ newBlockNumberHex, networkType }) => {
      try {
        const {
          incomingTransactions: currentIncomingTxs,
          incomingTxlastFetchedBlocksByNetwork: currentBlocksByNetwork,
        } = this.store.getState()

        const address = this.getSelectedAddress()
        const network = networkType || this.getCurrentNetwork()
        const lastFetchBlockByCurrentNetwork = currentBlocksByNetwork[network]
        const blockToFetchFrom = lastFetchBlockByCurrentNetwork || newBlockNumberHex

        const { latestIncomingTxBlockNumber, txs } = await this.fetchAll(address, blockToFetchFrom, network)

        const newLatestBlockHashByNetwork = parseInt(latestIncomingTxBlockNumber, 10) > parseInt(blockToFetchFrom, 10)
          ? latestIncomingTxBlockNumber
          : blockToFetchFrom

        const newIncomingTransactions = {
          ...currentIncomingTxs,
        }
        txs.forEach(tx => { newIncomingTransactions[tx.hash] = tx })

        this.store.updateState({
          incomingTxlastFetchedBlocksByNetwork: {
            ...currentBlocksByNetwork,
            [network]: newLatestBlockHashByNetwork,
          },
          incomingTransactions: newIncomingTransactions,
        })
      } catch (err) {
        log.error(err)
      }
    }

    const blockListener = async (newBlockNumberHex) => {
      changeListener({ newBlockNumberHex: parseInt(newBlockNumberHex, 16) })
    }
    const networkListener = async (newType) => {
      changeListener({ networkType: newType })
    }

    networkController.on('networkDidChange', networkListener)
    this.blockTracker.on('latest', blockListener)
  }

  async fetchAll (address, fromBlock, networkType) {
    let etherscanSubdomain = 'api'
    const currentNetworkID = networkTypeToIdMap[networkType]
    const supportedNetworkTypes = [ROPSTEN, RINKEBY, KOVAN, MAINNET]

    if (supportedNetworkTypes.indexOf(networkType) === -1) {
      return
    }

    if (networkType !== 'mainnet') {
      etherscanSubdomain = `api-${networkType}`
    }
    const apiUrl = `https://${etherscanSubdomain}.etherscan.io`

    if (!apiUrl) {
      return
    }
    let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`

    if (fromBlock) {
      url += `&startBlock=${parseInt(fromBlock, 10)}`
    }
    const response = await fetch(url)
    const parsedResponse = await response.json()

    if (parsedResponse.status !== '0' && parsedResponse.result.length > 0) {
      const remoteTxList = {}
      const remoteTxs = []
      parsedResponse.result.forEach((tx) => {
        if (!remoteTxList[tx.hash]) {
          remoteTxs.push(this.normalizeTxFromEtherscan(tx, currentNetworkID))
          remoteTxList[tx.hash] = 1
        }
      })

      const allTxs = [ ...remoteTxs ]
      allTxs.sort((a, b) => (a.time < b.time ? -1 : 1))

      let latestIncomingTxBlockNumber
      allTxs.forEach((tx) => {
        if (tx.txParams.to && tx.txParams.to.toLowerCase() === address.toLowerCase()) {
          if (
            tx.blockNumber &&
            (!latestIncomingTxBlockNumber ||
              parseInt(latestIncomingTxBlockNumber, 10) < parseInt(tx.blockNumber, 10))
          ) {
            latestIncomingTxBlockNumber = tx.blockNumber
          }
        }
      })
      this.store.updateState({ transactions: allTxs })
      return {
        latestIncomingTxBlockNumber,
        txs: allTxs,
      }
    }
    return {
      latestIncomingTxBlockNumber: '0',
      txs: [],
    }
  }

  normalizeTxFromEtherscan (txMeta, currentNetworkID) {
    const time = parseInt(txMeta.timeStamp, 10) * 1000
    const status = txMeta.isError === '0' ? 'confirmed' : 'failed'
    return {
      blockNumber: txMeta.blockNumber,
      id: createId(),
      metamaskNetworkId: currentNetworkID,
      status,
      time,
      txParams: {
        from: txMeta.from,
        gas: bnToHex(new BN(txMeta.gas)),
        gasPrice: bnToHex(new BN(txMeta.gasPrice)),
        nonce: bnToHex(new BN(txMeta.nonce)),
        to: txMeta.to,
        value: bnToHex(new BN(txMeta.value)),
      },
      hash: txMeta.hash,
      transactionCategory: 'incoming',
    }
  }
}

module.exports = IncomingTransactionsController
