const EventEmitter = require('events')
const extend = require('xtend')
const ethUtil = require('ethereumjs-util')
const Transaction = require('ethereumjs-tx')
const BN = ethUtil.BN
const TxProviderUtil = require('./lib/tx-utils')
const createId = require('./lib/random-id')
const normalize = require('./lib/sig-util').normalize

module.exports = class TransactionManager extends EventEmitter {
  constructor (opts) {
    super()
    this.txList = opts.txList || []
    this._setTxList = opts.setTxList
    this.txHistoryLimit = opts.txHistoryLimit
    this.getSelectedAccount = opts.getSelectedAccount
    this.provider = opts.provider
    this.blockTracker = opts.blockTracker
    this.txProviderUtils = new TxProviderUtil(this.provider)
    this.blockTracker.on('block', this.checkForTxInBlock.bind(this))
    this.getGasMultiplier = opts.getGasMultiplier
    this.getNetwork = opts.getNetwork
  }

  getState () {
    var selectedAccount = this.getSelectedAccount()
    return {
      unconfTxs: this.getUnapprovedTxList(),
      transactions: this.getFilteredTxList({metamaskNetworkId: this.getNetwork(), from: selectedAccount}),
    }
  }

//   Returns the tx list
  getTxList () {
    return this.txList
  }

  // Adds a tx to the txlist
  addTx (txMeta, onTxDoneCb = warn) {
    var txList = this.getTxList()
    var txHistoryLimit = this.txHistoryLimit

    // checks if the length of th tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    if (txList.length > txHistoryLimit - 1) {
      var index = txList.findIndex((metaTx) => metaTx.status === 'confirmed' || metaTx.status === 'rejected')
      txList.splice(index, 1)
    }
    txList.push(txMeta)

    this._saveTxList(txList)
    // keep the onTxDoneCb around in a listener
    // for after approval/denial (requires user interaction)
    // This onTxDoneCb fires completion to the Dapp's write operation.
    this.once(`${txMeta.id}:signed`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:rejected`)
      onTxDoneCb(null, true)
    })
    this.once(`${txMeta.id}:rejected`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:signed`)
      onTxDoneCb(null, false)
    })

    this.emit('updateBadge')
    this.emit(`${txMeta.id}:unapproved`, txMeta)
  }

  // gets tx by Id and returns it
  getTx (txId, cb) {
    var txList = this.getTxList()
    var txMeta = txList.find(txData => txData.id === txId)
    return cb ? cb(txMeta) : txMeta
  }

  //
  updateTx (txMeta) {
    var txId = txMeta.id
    var txList = this.getTxList()
    var index = txList.findIndex(txData => txData.id === txId)
    txList[index] = txMeta
    this._saveTxList(txList)
  }

  get unapprovedTxCount () {
    return Object.keys(this.getUnapprovedTxList()).length
  }

  get pendingTxCount () {
    return this.getTxsByMetaData('status', 'signed').length
  }

  addUnapprovedTransaction (txParams, onTxDoneCb, cb) {
    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var txId = createId()
    txParams.metamaskId = txId
    txParams.metamaskNetworkId = this.getNetwork()
    var txData = {
      id: txId,
      txParams: txParams,
      time: time,
      status: 'unapproved',
      gasMultiplier: this.getGasMultiplier() || 1,
      metamaskNetworkId: this.getNetwork(),
    }
    this.txProviderUtils.analyzeGasUsage(txData, this.txDidComplete.bind(this, txData, onTxDoneCb, cb))
    // calculate metadata for tx
  }

  txDidComplete (txMeta, onTxDoneCb, cb, err) {
    if (err) return cb(err)
    var {maxCost, txFee} = this.getMaxTxCostAndFee(txMeta)
    txMeta.maxCost = maxCost
    txMeta.txFee = txFee
    this.addTx(txMeta, onTxDoneCb)
    cb(null, txMeta)
  }

  getMaxTxCostAndFee (txMeta) {
    var txParams = txMeta.txParams

    var gasMultiplier = txMeta.gasMultiplier
    var gasCost = new BN(ethUtil.stripHexPrefix(txParams.gas || txMeta.estimatedGas), 16)
    var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice || '0x4a817c800'), 16)
    gasPrice = gasPrice.mul(new BN(gasMultiplier * 100), 10).div(new BN(100, 10))
    var txFee = gasCost.mul(gasPrice)
    var txValue = new BN(ethUtil.stripHexPrefix(txParams.value || '0x0'), 16)
    var maxCost = txValue.add(txFee)
    return {maxCost, txFee}
  }

  getUnapprovedTxList () {
    var txList = this.getTxList()
    return txList.filter((txMeta) => txMeta.status === 'unapproved')
    .reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  approveTransaction (txId, cb = warn) {
    this.setTxStatusSigned(txId)
    this.once(`${txId}:signingComplete`, cb)
  }

  cancelTransaction (txId, cb = warn) {
    this.setTxStatusRejected(txId)
    cb()
  }

  // formats txParams so the keyringController can sign it
  formatTxForSigining (txParams) {
    var address = txParams.from
    var metaTx = this.getTx(txParams.metamaskId)
    var gasMultiplier = metaTx.gasMultiplier
    var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice), 16)
    gasPrice = gasPrice.mul(new BN(gasMultiplier * 100, 10)).div(new BN(100, 10))
    txParams.gasPrice = ethUtil.intToHex(gasPrice.toNumber())

    // normalize values
    txParams.to = normalize(txParams.to)
    txParams.from = normalize(txParams.from)
    txParams.value = normalize(txParams.value)
    txParams.data = normalize(txParams.data)
    txParams.gasLimit = normalize(txParams.gasLimit || txParams.gas)
    txParams.nonce = normalize(txParams.nonce)
    const ethTx = new Transaction(txParams)
    var txId = txParams.metamaskId
    return Promise.resolve({ethTx, address, txId})
  }

  // receives a signed tx object and updates the tx hash
  // and pass it to the cb to be sent off
  resolveSignedTransaction ({tx, txId, cb = warn}) {
    // Add the tx hash to the persisted meta-tx object
    var txHash = ethUtil.bufferToHex(tx.hash())
    var metaTx = this.getTx(txId)
    metaTx.hash = txHash
    this.updateTx(metaTx)
    var rawTx = ethUtil.bufferToHex(tx.serialize())
    return Promise.resolve(rawTx)

  }

  /*
  Takes an object of fields to search for eg:
  var thingsToLookFor = {
    to: '0x0..',
    from: '0x0..',
    status: 'signed',
  }
  and returns a list of tx with all
  options matching

  this is for things like filtering a the tx list
  for only tx's from 1 account
  or for filltering for all txs from one account
  and that have been 'confirmed'
  */
  getFilteredTxList (opts) {
    var filteredTxList
    Object.keys(opts).forEach((key) => {
      filteredTxList = this.getTxsByMetaData(key, opts[key], filteredTxList)
    })
    return filteredTxList
  }

  getTxsByMetaData (key, value, txList = this.getTxList()) {
    return txList.filter((txMeta) => {
      if (key in txMeta.txParams) {
        return txMeta.txParams[key] === value
      } else {
        return txMeta[key] === value
      }
    })
  }

  // STATUS METHODS
  // get::set status

  // should return the status of the tx.
  getTxStatus (txId) {
    const txMeta = this.getTx(txId)
    return txMeta.status
  }


  // should update the status of the tx to 'signed'.
  setTxStatusSigned (txId) {
    this._setTxStatus(txId, 'signed')
    this.emit('updateBadge')
  }

  // should update the status of the tx to 'rejected'.
  setTxStatusRejected (txId) {
    this._setTxStatus(txId, 'rejected')
    this.emit('updateBadge')
  }

  setTxStatusConfirmed (txId) {
    this._setTxStatus(txId, 'confirmed')
    this.emit('update')
  }

  // merges txParams obj onto txData.txParams
  // use extend to ensure that all fields are filled
  updateTxParams (txId, txParams) {
    var txMeta = this.getTx(txId)
    txMeta.txParams = extend(txMeta.txParams, txParams)
    this.updateTx(txMeta)
  }

  //  checks if a signed tx is in a block and
  // if included sets the tx status as 'confirmed'
  checkForTxInBlock () {
    var signedTxList = this.getFilteredTxList({status: 'signed'})
    if (!signedTxList.length) return
    signedTxList.forEach((tx) => {
      var txHash = tx.hash
      var txId = tx.id
      if (!txHash) {
        tx.err = {
          errCode: 'No hash was provided',
          message: 'Tx could possibly have not been submitted or an error accrued during signing',
        }
        return this.updateTx(tx)
      }
      this.txProviderUtils.query.getTransactionByHash(txHash, (err, txMeta) => {
        if (err) {
          tx.err = {
            errorCode: err,
            message: 'Tx could possibly have not been submitted to the block chain',
          }
          this.updateTx(tx)
          return console.error(err)
        }
        if (txMeta.blockNumber) {
          this.setTxStatusConfirmed(txId)
        }
      })
    })
  }

  // PRIVATE METHODS

  //  Should find the tx in the tx list and
  //  update it.
  //  should set the status in txData
  //    - `'unapproved'` the user has not responded
  //    - `'rejected'` the user has responded no!
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'confirmed'` the tx has been included in a block.
  _setTxStatus (txId, status) {
    var txMeta = this.getTx(txId)
    txMeta.status = status
    this.emit(`${txMeta.id}:${status}`, txId)
    this.updateTx(txMeta)
  }

  // Saves the new/updated txList.
  // Function is intended only for internal use
  _saveTxList (txList) {
    this.txList = txList
    this._setTxList(txList)
  }
}


const warn = () => console.warn('warn was used no cb provided')
