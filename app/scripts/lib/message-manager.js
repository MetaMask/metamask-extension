const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const createId = require('./random-id')


module.exports = class MessageManager extends EventEmitter{
  constructor (opts) {
    super()
    this.memStore = new ObservableStore({
      unapprovedMsgs: {},
      unapprovedMsgCount: 0,
    })
    this.messages = []
  }

  get unapprovedMsgCount () {
    return Object.keys(this.getUnapprovedMsgs()).length
  }

  getUnapprovedMsgs () {
    return this.messages.filter(msg => msg.status === 'unapproved')
    .reduce((result, msg) => { result[msg.id] = msg; return result }, {})
  }

  addUnapprovedMessage (msgParams) {
    msgParams.data = normalizeMsgData(msgParams.data)
    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var msgId = createId()
    var msgData = {
      id: msgId,
      msgParams: msgParams,
      time: time,
      status: 'unapproved',
      type: 'eth_sign',
    }
    this.addMsg(msgData)

    // signal update
    this.emit('update')
    return msgId
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
    if (!msg) throw new Error('MessageManager - Message not found for id: "${msgId}".')
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
    const unapprovedMsgs = this.getUnapprovedMsgs()
    const unapprovedMsgCount = Object.keys(unapprovedMsgs).length
    this.memStore.updateState({ unapprovedMsgs, unapprovedMsgCount })
    this.emit('updateBadge')
  }

}

function normalizeMsgData(data) {
  if (data.slice(0, 2) === '0x') {
    // data is already hex
    return data
  } else {
    // data is unicode, convert to hex
    return ethUtil.bufferToHex(new Buffer(data, 'utf8'))
  }
}
