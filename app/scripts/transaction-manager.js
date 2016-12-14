const EventEmitter = require('events')
const extend = require('xtend')
const TxProviderUtil = require('./lib/provider-utils')

module.exports = class TransactionManager extends EventEmitter {
  constructor (opts) {
    super()
    this.txList = opts.TxListFromStore || []
    this._persistTxList = opts.setTxList
    this._unconfTxCbs = {}
    this.txLimit = opts.txLimit
    this.provider = opts.provider
  }

//   Returns the tx list
  getTxList () {
    return this.txList
  }

  // Saves the new/updated txList.
  // Function is intended only for internal use
  _saveTxList (txList) {
    this.txList = txList
    this._persistTxList(txList)
  }

  // Adds a tx to the txlist
  addTx (txData, onTxDoneCb) {
    var txList = this.getTxList()
    var txLimit = this.txLimit
    if (txList.length > txLimit - 1) {
      txList.shift()
    }
    txList.push(txData)
    this._saveTxList(txList)
    this.addOnTxDoneCb(txData.id, onTxDoneCb)
    this.emit('unapproved', txData)
    this.emit('update')
  }

  // gets tx by Id and returns it
  getTx (txId, cb) {
    var txList = this.getTxList()
    var tx = txList.find((tx) => tx.id === txId)
    return cb ? cb(tx) : tx
  }

  //
  updateTx (txData) {
    var txId = txData.id
    var txList = this.getTxList()

    var updatedTxList = txList.map((tx) => {
      if (tx.id === txId) {
        tx = txData
      }
      return tx
    })
    this._saveTxList(updatedTxList)
  }

  get unConftxCount () {
    return Object.keys(this.getUnapprovedTxList()).length
  }

  get pendingTxCount () {
    return this.getTxsByMetaData('status', 'signed').length
  }

  getUnapprovedTxList () {
    var txList = this.getTxList()
    return txList.filter((tx) => {
      return tx.status === 'unapproved'
    }).reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
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
  getFilterdTxList (opts) {
    var filteredTxList
    Object.keys(opts).forEach((key) => {
      filteredTxList = this.getTxsByMetaData(key, opts[key], filteredTxList)
    })
    return filteredTxList
  }

  getTxsByMetaData (key, value, txList = this.getTxList()) {
    return txList.filter((tx) => {
      if (key in tx.txParams) {
        return tx.txParams[key] === value
      } else {
        return tx[key] === value
      }
    })
  }

// keeps around the txCbs for later
  addOnTxDoneCb (txId, cb) {
    this._unconfTxCbs[txId] = cb || noop
  }

  execOnTxDoneCb (txId, conf) {
    var approvalCb = this._unconfTxCbs[txId]

    approvalCb(null, conf)
    // clean up
    delete this._unconfTxCbs[txId]
  }

  //   should return the tx

  //   Should find the tx in the tx list and
  //   update it.
  //   should set the status in txData
  //     // - `'unapproved'` the user has not responded
  //     // - `'rejected'` the user has responded no!
  //     // - `'signed'` the tx is signed
  //     // - `'submitted'` the tx is sent to a server
  //     // - `'confirmed'` the tx has been included in a block.
  setTxStatus (txId, status) {
    var txData = this.getTx(txId)
    txData.status = status
    this.emit(status, txId)
    this.updateTx(txData, status)
  }


  //   should return the status of the tx.
  getTxStatus (txId, cb) {
    const txData = this.getTx(txId)
    return cb ? cb(txData.staus) : txData.status
  }


  //   should update the status of the tx to 'signed'.
  setTxStatusSigned (txId) {
    this.setTxStatus(txId, 'signed')
    this.emit('update')
  }

  //     should update the status of the tx to 'rejected'.
  setTxStatusRejected (txId) {
    this.setTxStatus(txId, 'rejected')
    this.emit('update')
  }

  setTxStatusConfirmed (txId) {
    this.setTxStatus(txId, 'confirmed')
  }

  // merges txParams obj onto txData.txParams
  // use extend to ensure that all fields are filled
  updateTxParams (txId, txParams) {
    var txData = this.getTx(txId)
    txData.txParams = extend(txData, txParams)
    this.updateTx(txData)
  }

  //  sets provider for provider utils and event listener
  setProvider (provider) {
    this.provider = provider
    this.txProviderUtils = new TxProviderUtil(provider)
    this.provider.on('block', this.checkForTxInBlock.bind(this))
  }

  //  checks if a signed tx is in a block and
  // if included sets the tx status as 'confirmed'
  checkForTxInBlock () {
    var signedTxList = this.getFilterdTxList({status: 'signed'})
    if (!signedTxList.length) return
    var self = this
    signedTxList.forEach((tx) => {
      var txHash = tx.hash
      var txId = tx.id
      if (!txHash) return
      // var d
      this.txProviderUtils.query.getTransactionByHash(txHash, (err, txData) => {
        if (err) {
          tx

          return console.error(err)
        }
        if (txData.blockNumber !== null) {
          self.setTxStatusConfirmed(txId)
        }
      })
    })
  }
}

function noop () {}
