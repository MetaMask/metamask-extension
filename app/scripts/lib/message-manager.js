const EventEmitter = require('events')
const ObservableStore = require('obs-store')
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
    // create txData obj with parameters and meta data
    var time = (new Date()).getTime()
    var msgId = createId()
    var msgData = {
      id: msgId,
      msgParams: msgParams,
      time: time,
      status: 'unapproved',
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

  prepMsgForSigning (msgParams) {
    delete msgParams.metamaskId
    return Promise.resolve(msgParams)
  }

  rejectMsg (msgId) {
    this.brodcastMessage(null, msgId, 'rejected')
    this._setMsgStatus(msgId, 'rejected')
  }

  brodcastMessage (rawSig, msgId, status) {
    this.emit(`${msgId}:finished`, {status, rawSig})
  }

  //
  // PRIVATE METHODS
  //

  _setMsgStatus (msgId, status) {
    let msg = this.getMsg(msgId)
    if (msg) msg.status = status
    this._updateMsg(msg)
  }

  _updateMsg (msg) {
    let index = this.messages.findIndex((message) => message.id === msg.id)
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
