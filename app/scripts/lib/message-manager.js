module.exports = new MessageManager()

function MessageManager (opts) {
  this.messages = []
}

MessageManager.prototype.getMsgList = function () {
  return this.messages
}

MessageManager.prototype.unconfirmedMsgs = function () {
  var messages = this.getMsgList()
  return messages.filter(msg => msg.status === 'unconfirmed')
  .reduce((result, msg) => { result[msg.id] = msg; return result }, {})
}

MessageManager.prototype._saveMsgList = function (msgList) {
  this.messages = msgList
}

MessageManager.prototype.addMsg = function (msg) {
  var messages = this.getMsgList()
  messages.push(msg)
  this._saveMsgList(messages)
}

MessageManager.prototype.getMsg = function (msgId) {
  var messages = this.getMsgList()
  var matching = messages.filter(msg => msg.id === msgId)
  return matching.length > 0 ? matching[0] : null
}

MessageManager.prototype.confirmMsg = function (msgId) {
  this._setMsgStatus(msgId, 'confirmed')
}

MessageManager.prototype.rejectMsg = function (msgId) {
  this._setMsgStatus(msgId, 'rejected')
}

MessageManager.prototype._setMsgStatus = function (msgId, status) {
  var msg = this.getMsg(msgId)
  if (msg) msg.status = status
  this.updateMsg(msg)
}

MessageManager.prototype.updateMsg = function (msg) {
  var messages = this.getMsgList()
  var found, index
  messages.forEach((otherMsg, i) => {
    if (otherMsg.id === msg.id) {
      found = true
      index = i
    }
  })
  if (found) {
    messages[index] = msg
  }
  this._saveMsgList(messages)
}

