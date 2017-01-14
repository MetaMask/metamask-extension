const EventEmitter = require('events')
const async = require('async')
const extend = require('xtend')
const Semaphore = require('semaphore')
const ethUtil = require('ethereumjs-util')
const BN = require('ethereumjs-util').BN
const TxProviderUtil = require('./lib/tx-utils')
const createId = require('./lib/random-id')

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
    this.signEthTx = opts.signTransaction
    this.nonceLock = Semaphore(1)
  }

  getState () {
    var selectedAccount = this.getSelectedAccount()
    return {
      transactions: this.getTxList(),
      unconfTxs: this.getUnapprovedTxList(),
      selectedAccountTxList: this.getFilteredTxList({metamaskNetworkId: this.getNetwork(), from: selectedAccount}),
    }
  }

//   Returns the tx list
  getTxList () {
    return this.txList
  }

  // Adds a tx to the txlist
  addTx (txMeta) {
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
    this.once(`${txMeta.id}:signed`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:rejected`)
    })
    this.once(`${txMeta.id}:rejected`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:signed`)
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
    this.emit('update')
  }

  get unapprovedTxCount () {
    return Object.keys(this.getUnapprovedTxList()).length
  }

  get pendingTxCount () {
    return this.getTxsByMetaData('status', 'signed').length
  }

  addUnapprovedTransaction (txParams, done) {
    let txMeta
    async.waterfall([
      // validate
      (cb) => this.txProviderUtils.validateTxParams(txParams, cb),
      // prepare txMeta
      (cb) => {
        // create txMeta obj with parameters and meta data
        let time = (new Date()).getTime()
        let txId = createId()
        txParams.metamaskId = txId
        txParams.metamaskNetworkId = this.getNetwork()
        txMeta = {
          id: txId,
          time: time,
          status: 'unapproved',
          gasMultiplier: this.getGasMultiplier() || 1,
          metamaskNetworkId: this.getNetwork(),
          txParams: txParams,
        }
        // calculate metadata for tx
        this.txProviderUtils.analyzeGasUsage(txMeta, cb)
      },
      // save txMeta
      (cb) => {
        this.addTx(txMeta)
        this.setMaxTxCostAndFee(txMeta)
        cb(null, txMeta)
      },
    ], done)
  }

  setMaxTxCostAndFee (txMeta) {
    var txParams = txMeta.txParams
    var gasMultiplier = txMeta.gasMultiplier
    var gasCost = new BN(ethUtil.stripHexPrefix(txParams.gas || txMeta.estimatedGas), 16)
    var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice || '0x4a817c800'), 16)
    gasPrice = gasPrice.mul(new BN(gasMultiplier * 100), 10).div(new BN(100, 10))
    var txFee = gasCost.mul(gasPrice)
    var txValue = new BN(ethUtil.stripHexPrefix(txParams.value || '0x0'), 16)
    var maxCost = txValue.add(txFee)
    txMeta.txFee = txFee
    txMeta.txValue = txValue
    txMeta.maxCost = maxCost
    this.updateTx(txMeta)
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
    const self = this
    // approve
    self.setTxStatusApproved(txId)
    // only allow one tx at a time for atomic nonce usage
    self.nonceLock.take(() => {
      // begin signature process
      async.waterfall([
        (cb) => self.fillInTxParams(txId, cb),
        (cb) => self.signTransaction(txId, cb),
        (rawTx, cb) => self.publishTransaction(txId, rawTx, cb),
      ], (err) => {
        self.nonceLock.leave()
        if (err) {
          this.setTxStatusFailed(txId)
          return cb(err)
        }
        cb()
      })
    })
  }

  cancelTransaction (txId, cb = warn) {
    this.setTxStatusRejected(txId)
    cb()
  }

  fillInTxParams (txId, cb) {
    let txMeta = this.getTx(txId)
    this.txProviderUtils.fillInTxParams(txMeta.txParams, (err) => {
      if (err) return cb(err)
      this.updateTx(txMeta)
      cb()
    })
  }

  signTransaction (txId, cb) {
    let txMeta = this.getTx(txId)
    let txParams = txMeta.txParams
    let fromAddress = txParams.from
    let ethTx = this.txProviderUtils.buildEthTxFromParams(txParams, txMeta.gasMultiplier)
    this.signEthTx(ethTx, fromAddress).then(() => {
      this.updateTxAsSigned(txMeta.id, ethTx)
      cb(null, ethUtil.bufferToHex(ethTx.serialize()))
    }).catch((err) => {
      cb(err)
    })
  }

  publishTransaction (txId, rawTx, cb) {
    this.txProviderUtils.publishTransaction(rawTx, (err) => {
      if (err) return cb(err)
      this.setTxStatusSubmitted(txId)
      cb()
    })
  }

  // receives a signed tx object and updates the tx hash
  updateTxAsSigned (txId, ethTx) {
    // Add the tx hash to the persisted meta-tx object
    let txHash = ethUtil.bufferToHex(ethTx.hash())
    let txMeta = this.getTx(txId)
    txMeta.hash = txHash
    this.updateTx(txMeta)
    this.setTxStatusSigned(txMeta.id)
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

  // should update the status of the tx to 'rejected'.
  setTxStatusRejected (txId) {
    this._setTxStatus(txId, 'rejected')
  }

  // should update the status of the tx to 'approved'.
  setTxStatusApproved (txId) {
    this._setTxStatus(txId, 'approved')
  }

  // should update the status of the tx to 'signed'.
  setTxStatusSigned (txId) {
    this._setTxStatus(txId, 'signed')
  }

  // should update the status of the tx to 'submitted'.
  setTxStatusSubmitted (txId) {
    this._setTxStatus(txId, 'submitted')
  }

  // should update the status of the tx to 'confirmed'.
  setTxStatusConfirmed (txId) {
    this._setTxStatus(txId, 'confirmed')
  }

  setTxStatusFailed (txId) {
    this._setTxStatus(txId, 'failed')
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
    signedTxList.forEach((txMeta) => {
      var txHash = txMeta.hash
      var txId = txMeta.id
      if (!txHash) {
        txMeta.err = {
          errCode: 'No hash was provided',
          message: 'We had an error while submitting this transaction, please try again.',
        }
        this.updateTx(txMeta)
        return this.setTxStatusFailed(txId)
      }
      this.txProviderUtils.query.getTransactionByHash(txHash, (err, txParams) => {
        if (err || !txParams) {
          if (!txParams) return
          txMeta.err = {
            isWarning: true,
            errorCode: err,
            message: 'There was a problem loading this transaction.',
          }
          this.updateTx(txMeta)
          return console.error(err)
        }
        if (txParams.blockNumber) {
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
  //    - `'approved'` the user has approved the tx
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'confirmed'` the tx has been included in a block.
  _setTxStatus (txId, status) {
    var txMeta = this.getTx(txId)
    txMeta.status = status
    this.emit(`${txMeta.id}:${status}`, txId)
    this.emit('updateBadge')
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
