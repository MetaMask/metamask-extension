const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const createId = require('./random-id')
const assert = require('assert')
const sigUtil = require('eth-sig-util')
const log = require('loglevel')

module.exports = class TypedMessageManager extends EventEmitter {
  constructor (opts) {
    super()
    this.memStore = new ObservableStore({
      unapprovedTypedMessages: {},
      unapprovedTypedMessagesCount: 0,
    })
    this.messages = []
  }

  get unapprovedTypedMessagesCount () {
    return Object.keys(this.getUnapprovedMsgs()).length
  }

  getUnapprovedMsgs () {
    return this.messages.filter(msg => msg.status === 'unapproved')
      .reduce((result, msg) => { result[msg.id] = msg; return result }, {})
  }

  addUnapprovedMessage (msgParams) {
    this.validateParams(msgParams)

    log.debug(`TypedMessageManager addUnapprovedMessage: ${JSON.stringify(msgParams)}`)
    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var msgId = createId()
    var msgData = {
      id: msgId,
      msgParams: msgParams,
      time: time,
      status: 'unapproved',
      type: 'eth_signTypedData',
    }
    this.addMsg(msgData)

    // signal update
    this.emit('update')
    return msgId
  }

  validateParams (params) {
    assert.equal(typeof params, 'object', 'Params should ben an object.')
    assert.ok('data' in params, 'Params must include a data field.')
    assert.ok('from' in params, 'Params must include a from field.')
    assert.ok(Array.isArray(params.data), 'Data should be an array.')
    assert.equal(typeof params.from, 'string', 'From field must be a string.')
    assert.doesNotThrow(() => {
      sigUtil.typedSignatureHash(params.data)
    }, 'Expected EIP712 typed data')
  }

  addMsg (msg) {
    this.messages.push(msg)
    this._saveMsgList()
  }

  getMsg (msgId) {
    return this.messages.find(msg => msg.id === msgId)
  }

  approveMessage (msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId)
    return this.prepMsgForSigning(msgParams)
  }

  setMsgStatusApproved (msgId) {
    this._setMsgStatus(msgId, 'approved')
  }

  setMsgStatusSigned (msgId, rawSig) {
    const msg = this.getMsg(msgId)
    msg.rawSig = rawSig
    this._updateMsg(msg)
    this._setMsgStatus(msgId, 'signed')
  }

  prepMsgForSigning (msgParams) {
    delete msgParams.metamaskId
    return Promise.resolve(msgParams)
  }

  rejectMsg (msgId) {
    this._setMsgStatus(msgId, 'rejected')
  }

  //
  // PRIVATE METHODS
  //

  _setMsgStatus (msgId, status) {
    const msg = this.getMsg(msgId)
    if (!msg) throw new Error('TypedMessageManager - Message not found for id: "${msgId}".')
    msg.status = status
    this._updateMsg(msg)
    this.emit(`${msgId}:${status}`, msg)
    if (status === 'rejected' || status === 'signed') {
      this.emit(`${msgId}:finished`, msg)
    }
  }

  _updateMsg (msg) {
    const index = this.messages.findIndex((message) => message.id === msg.id)
    if (index !== -1) {
      this.messages[index] = msg
    }
    this._saveMsgList()
  }

  _saveMsgList () {
    const unapprovedTypedMessages = this.getUnapprovedMsgs()
    const unapprovedTypedMessagesCount = Object.keys(unapprovedTypedMessages).length
    this.memStore.updateState({ unapprovedTypedMessages, unapprovedTypedMessagesCount })
    this.emit('updateBadge')
  }

}
