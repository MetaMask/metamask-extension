const assert = require('assert')
const TypedMessageManager = require('../../../app/scripts/lib/typed-message-manager')

describe('', function () {

  let typedMessageManager, msgParams, msgParams2, typedMsgs, messages, msgId, numberMsgId

  const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813'

  beforeEach('', function () {
    typedMessageManager = new TypedMessageManager()

    msgParams = {
      from: address,
      data: [
      {
        type: 'string',
        name: 'unit test',
        value: 'hello there',
      },
      {
        type: 'uint32',
        name: 'A number, but not really a number',
        value: '$$$',
      },
    ]}

    msgParams2 = {
      data: [{
        type: 'int',
        name: 'unit test2',
        value: 'hello there2',
      }],
    }

    typedMessageManager.addUnapprovedMessage(msgParams)
    typedMsgs = typedMessageManager.getUnapprovedMsgs()
    messages = typedMessageManager.messages
    msgId = Object.keys(typedMsgs)[0]
    messages[0].msgParams.metamaskId = parseInt(msgId)
    numberMsgId = parseInt(msgId)
  })

  it('has params address', function () {
    assert.equal(typedMsgs[msgId].msgParams.from, address)
  })

  it('adds to unapproved messages and sets status to unapproved', function () {
    assert.equal(typedMsgs[msgId].status, 'unapproved')
  })

  it('validates params', function () {
    assert.doesNotThrow(() => {
      typedMessageManager.validateParams(msgParams)
    }, 'Does not throw with valid parameters')
  })

  it('adds message params to typedMessageManager messages array', function () {
    typedMessageManager.addMsg(msgParams2)
    assert.equal(messages[messages.length - 1], msgParams2)
  })

  it('gets unapproved by id', function () {
    const getMsg = typedMessageManager.getMsg(numberMsgId)
    assert.equal(getMsg.id, numberMsgId)
  })

  it('approves messages', async function () {
    const messageMetaMaskId = messages[0].msgParams
    const approveMsg = typedMessageManager.approveMessage(messageMetaMaskId)
    assert.equal(await approveMsg, msgParams)
    assert.equal(messages[0].status, 'approved')
  })

  it('sets msg status to signed and adds a raw sig to message details', function () {
    typedMessageManager.setMsgStatusSigned(numberMsgId, 'raw sig')
    assert.equal(messages[0].status, 'signed')
    assert.equal(messages[0].rawSig, 'raw sig')
  })

  it('rejects message', function () {
    typedMessageManager.rejectMsg(numberMsgId)
    assert.equal(messages[0].status, 'rejected')
  })
})
