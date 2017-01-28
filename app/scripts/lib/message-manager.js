const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const createId = require('./random-id')


module.exports = class MessageManager extends EventEmitter{
  constructor (opts) {
    super()
    this.memStore = new ObservableStore({ messages: [] })
  }

  getState() {
    return {
      unapprovedMsgs: this.unapprovedMsgs(),
      messages: this.getMsgList(),
    }
  }

  getMsgList () {
    return this.memStore.getState().messages
  }

  get unapprovedMsgCount () {
    return Object.keys(this.unapprovedMsgs()).length
  }

  unapprovedMsgs () {
    let messages = this.getMsgList()
    return messages.filter(msg => msg.status === 'unapproved')
    .reduce((result, msg) => { result[msg.id] = msg; return result }, {})
  }

  _saveMsgList (msgList) {
    this.emit('updateBadge')
    let state = this.memStore.getState()
    state.messages = msgList
    this.memStore.putState(state)
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
    console.log('addUnapprovedMessage:', msgData)

    // keep the cb around for after approval (requires user interaction)
    // This cb fires completion to the Dapp's write operation.

    // signal update
    this.emit('update')
    return msgId
  }

  addMsg (msg) {
    let messages = this.getMsgList()
    messages.push(msg)
    this._saveMsgList(messages)
  }

  getMsg (msgId) {
    let messages = this.getMsgList()
    let matching = messages.filter(msg => msg.id === msgId)
    return matching.length > 0 ? matching[0] : null
  }

  brodcastMessage (rawSig, msgId, status) {
    this.emit(`${msgId}:finished`, {status, rawSig})
  }

  approveMessage (msgParams) {
    this.setMessageApproved(msgParams.metamaskId)
    return this.prepMsgForSigning(msgParams)
  }

  setMessageApproved (msgId) {
    this._setMsgStatus(msgId, 'approved')
  }
  prepMsgForSigning (msgParams) {
    delete msgParams.metamaskId
    return Promise.resolve(msgParams)
  }

  cancelMessage (msgId) {
    // reject tx
    // clean up
    this.brodcastMessage(null, msgId, 'rejected')
    this.rejectMsg(msgId)
  }

  rejectMsg (msgId) {
    this._setMsgStatus(msgId, 'rejected')
  }

  _setMsgStatus (msgId, status) {
    let msg = this.getMsg(msgId)
    if (msg) msg.status = status
    this._updateMsg(msg)
  }

  _updateMsg (msg) {
    let messages = this.getMsgList()
    let index = messages.findIndex((message) => message.id === msg.id)
    if (index !== -1) {
      messages[index] = msg
    }
    this._saveMsgList(messages)
  }
}
