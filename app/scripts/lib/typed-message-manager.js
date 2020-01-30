const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const createId = require('./random-id')
const assert = require('assert')
const { errors: rpcErrors } = require('eth-json-rpc-errors')
const sigUtil = require('eth-sig-util')
const log = require('loglevel')
const jsonschema = require('jsonschema')

/**
 * Represents, and contains data about, an 'eth_signTypedData' type signature request. These are created when a
 * signature for an eth_signTypedData call is requested.
 *
 * @typedef {Object} TypedMessage
 * @property {number} id An id to track and identify the message object
 * @property {Object} msgParams The parameters to pass to the eth_signTypedData method once the signature request is
 * approved.
 * @property {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
 * @property {Object} msgParams.from The address that is making the signature request.
 * @property {string} msgParams.data A hex string conversion of the raw buffer data of the signature request
 * @property {number} time The epoch time at which the this message was created
 * @property {string} status Indicates whether the signature request is 'unapproved', 'approved', 'signed', 'rejected', or 'errored'
 * @property {string} type The json-prc signing method for which a signature request has been made. A 'Message' will
 * always have a 'eth_signTypedData' type.
 *
 */

module.exports = class TypedMessageManager extends EventEmitter {
  /**
   * Controller in charge of managing - storing, adding, removing, updating - TypedMessage.
   */
  constructor ({ networkController }) {
    super()
    this.networkController = networkController
    this.memStore = new ObservableStore({
      unapprovedTypedMessages: {},
      unapprovedTypedMessagesCount: 0,
    })
    this.messages = []
  }

  /**
   * A getter for the number of 'unapproved' TypedMessages in this.messages
   *
   * @returns {number} The number of 'unapproved' TypedMessages in this.messages
   *
   */
  get unapprovedTypedMessagesCount () {
    return Object.keys(this.getUnapprovedMsgs()).length
  }

  /**
   * A getter for the 'unapproved' TypedMessages in this.messages
   *
   * @returns {Object} An index of TypedMessage ids to TypedMessages, for all 'unapproved' TypedMessages in
   * this.messages
   *
   */
  getUnapprovedMsgs () {
    return this.messages.filter(msg => msg.status === 'unapproved')
      .reduce((result, msg) => { result[msg.id] = msg; return result }, {})
  }

  /**
   * Creates a new TypedMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new TypedMessage to this.messages, and to save the unapproved TypedMessages from that list to
   * this.memStore. Before any of this is done, msgParams are validated
   *
   * @param {Object} msgParams The params for the eth_sign call to be made after the message is approved.
   * @param {Object} req (optional) The original request object possibly containing the origin
   * @returns {promise} When the message has been signed or rejected
   *
   */
  addUnapprovedMessageAsync (msgParams, req, version) {
    return new Promise((resolve, reject) => {
      const msgId = this.addUnapprovedMessage(msgParams, req, version)
      this.once(`${msgId}:finished`, (data) => {
        switch (data.status) {
          case 'signed':
            return resolve(data.rawSig)
          case 'rejected':
            return reject(rpcErrors.eth.userRejectedRequest('MetaMask Message Signature: User denied message signature.'))
          case 'errored':
            return reject(new Error(`MetaMask Message Signature: ${data.error}`))
          default:
            return reject(new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(msgParams)}`))
        }
      })
    })
  }

  /**
   * Creates a new TypedMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new TypedMessage to this.messages, and to save the unapproved TypedMessages from that list to
   * this.memStore. Before any of this is done, msgParams are validated
   *
   * @param {Object} msgParams The params for the eth_sign call to be made after the message is approved.
   * @param {Object} req (optional) The original request object possibly containing the origin
   * @returns {number} The id of the newly created TypedMessage.
   *
   */
  addUnapprovedMessage (msgParams, req, version) {
    msgParams.version = version
    this.validateParams(msgParams)
    // add origin from request
    if (req) msgParams.origin = req.origin

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

  /**
   * Helper method for this.addUnapprovedMessage. Validates that the passed params have the required properties.
   *
   * @param {Object} params The params to validate
   *
   */
  validateParams (params) {
    switch (params.version) {
      case 'V1':
        assert.equal(typeof params, 'object', 'Params should ben an object.')
        assert.ok('data' in params, 'Params must include a data field.')
        assert.ok('from' in params, 'Params must include a from field.')
        assert.ok(Array.isArray(params.data), 'Data should be an array.')
        assert.equal(typeof params.from, 'string', 'From field must be a string.')
        assert.doesNotThrow(() => {
          sigUtil.typedSignatureHash(params.data)
        }, 'Expected EIP712 typed data')
        break
      case 'V3':
      case 'V4':
        let data
        assert.equal(typeof params, 'object', 'Params should be an object.')
        assert.ok('data' in params, 'Params must include a data field.')
        assert.ok('from' in params, 'Params must include a from field.')
        assert.equal(typeof params.from, 'string', 'From field must be a string.')
        assert.equal(typeof params.data, 'string', 'Data must be passed as a valid JSON string.')
        assert.doesNotThrow(() => { data = JSON.parse(params.data) }, 'Data must be passed as a valid JSON string.')
        const validation = jsonschema.validate(data, sigUtil.TYPED_MESSAGE_SCHEMA)
        assert.ok(data.primaryType in data.types, `Primary type of "${data.primaryType}" has no type definition.`)
        assert.equal(validation.errors.length, 0, 'Data must conform to EIP-712 schema. See https://git.io/fNtcx.')
        const chainId = data.domain.chainId
        const activeChainId = parseInt(this.networkController.getNetworkState())
        chainId && assert.equal(chainId, activeChainId, `Provided chainId (${chainId}) must match the active chainId (${activeChainId})`)
        break
    }
  }

  /**
   * Adds a passed TypedMessage to this.messages, and calls this._saveMsgList() to save the unapproved TypedMessages from that
   * list to this.memStore.
   *
   * @param {Message} msg The TypedMessage to add to this.messages
   *
   */
  addMsg (msg) {
    this.messages.push(msg)
    this._saveMsgList()
  }

  /**
   * Returns a specified TypedMessage.
   *
   * @param {number} msgId The id of the TypedMessage to get
   * @returns {TypedMessage|undefined} The TypedMessage with the id that matches the passed msgId, or undefined
   * if no TypedMessage has that id.
   *
   */
  getMsg (msgId) {
    return this.messages.find(msg => msg.id === msgId)
  }

  /**
   * Approves a TypedMessage. Sets the message status via a call to this.setMsgStatusApproved, and returns a promise
   * with any the message params modified for proper signing.
   *
   * @param {Object} msgParams The msgParams to be used when eth_sign is called, plus data added by MetaMask.
   * @param {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
   * @returns {Promise<object>} Promises the msgParams object with metamaskId removed.
   *
   */
  approveMessage (msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId)
    return this.prepMsgForSigning(msgParams)
  }

  /**
   * Sets a TypedMessage status to 'approved' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the TypedMessage to approve.
   *
   */
  setMsgStatusApproved (msgId) {
    this._setMsgStatus(msgId, 'approved')
  }

  /**
   * Sets a TypedMessage status to 'signed' via a call to this._setMsgStatus and updates that TypedMessage in
   * this.messages by adding the raw signature data of the signature request to the TypedMessage
   *
   * @param {number} msgId The id of the TypedMessage to sign.
   * @param {buffer} rawSig The raw data of the signature request
   *
   */
  setMsgStatusSigned (msgId, rawSig) {
    const msg = this.getMsg(msgId)
    msg.rawSig = rawSig
    this._updateMsg(msg)
    this._setMsgStatus(msgId, 'signed')
  }

  /**
   * Removes the metamaskId property from passed msgParams and returns a promise which resolves the updated msgParams
   *
   * @param {Object} msgParams The msgParams to modify
   * @returns {Promise<object>} Promises the msgParams with the metamaskId property removed
   *
   */
  prepMsgForSigning (msgParams) {
    delete msgParams.metamaskId
    delete msgParams.version
    return Promise.resolve(msgParams)
  }

  /**
   * Sets a TypedMessage status to 'rejected' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the TypedMessage to reject.
   *
   */
  rejectMsg (msgId) {
    this._setMsgStatus(msgId, 'rejected')
  }

  /**
   * Sets a TypedMessage status to 'errored' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the TypedMessage to error
   *
   */
  errorMessage (msgId, error) {
    const msg = this.getMsg(msgId)
    msg.error = error
    this._updateMsg(msg)
    this._setMsgStatus(msgId, 'errored')
  }

  //
  // PRIVATE METHODS
  //

  /**
   * Updates the status of a TypedMessage in this.messages via a call to this._updateMsg
   *
   * @private
   * @param {number} msgId The id of the TypedMessage to update.
   * @param {string} status The new status of the TypedMessage.
   * @throws A 'TypedMessageManager - TypedMessage not found for id: "${msgId}".' if there is no TypedMessage
   * in this.messages with an id equal to the passed msgId
   * @fires An event with a name equal to `${msgId}:${status}`. The TypedMessage is also fired.
   * @fires If status is 'rejected' or 'signed', an event with a name equal to `${msgId}:finished` is fired along
   * with the TypedMessage
   *
   */
  _setMsgStatus (msgId, status) {
    const msg = this.getMsg(msgId)
    if (!msg) throw new Error('TypedMessageManager - Message not found for id: "${msgId}".')
    msg.status = status
    this._updateMsg(msg)
    this.emit(`${msgId}:${status}`, msg)
    if (status === 'rejected' || status === 'signed' || status === 'errored') {
      this.emit(`${msgId}:finished`, msg)
    }
  }

  /**
   * Sets a TypedMessage in this.messages to the passed TypedMessage if the ids are equal. Then saves the
   * unapprovedTypedMsgs index to storage via this._saveMsgList
   *
   * @private
   * @param {msg} TypedMessage A TypedMessage that will replace an existing TypedMessage (with the same
   * id) in this.messages
   *
   */
  _updateMsg (msg) {
    const index = this.messages.findIndex((message) => message.id === msg.id)
    if (index !== -1) {
      this.messages[index] = msg
    }
    this._saveMsgList()
  }

  /**
   * Saves the unapproved TypedMessages, and their count, to this.memStore
   *
   * @private
   * @fires 'updateBadge'
   *
   */
  _saveMsgList () {
    const unapprovedTypedMessages = this.getUnapprovedMsgs()
    const unapprovedTypedMessagesCount = Object.keys(unapprovedTypedMessages).length
    this.memStore.updateState({ unapprovedTypedMessages, unapprovedTypedMessagesCount })
    this.emit('updateBadge')
  }

}
