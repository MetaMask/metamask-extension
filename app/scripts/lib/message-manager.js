const EventEmitter = require('events')

module.exports = class MessageManager extends EventEmitter{
  constructor (opts) {
    super()
    this.messages = []
  }

  getMsgList () {
    return this.messages
  }

  unconfirmedMsgs () {
    let messages = this.getMsgList()
    return messages.filter(msg => msg.status === 'unconfirmed')
    .reduce((result, msg) => { result[msg.id] = msg; return result }, {})
  }

  _saveMsgList (msgList) {
    this.messages = msgList
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

  confirmMsg (msgId) {
    this._setMsgStatus(msgId, 'confirmed')
  }

  rejectMsg (msgId) {
    this._setMsgStatus(msgId, 'rejected')
  }

  _setMsgStatus (msgId, status) {
    let msg = this.getMsg(msgId)
    if (msg) msg.status = status
    this.updateMsg(msg)
  }

  updateMsg (msg) {
    let messages = this.getMsgList()
    let index = messages.findIndex((message) => message.id === msg.id)
    if (index !== -1) {
      this.emit('update', msg.id)
      messages[index] = msg
    }
    this._saveMsgList(messages)
  }
}
