import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { ethErrors } from 'eth-rpc-errors';
import log from 'loglevel';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import createId from '../../../shared/modules/random-id';

/**
 * Represents, and contains data about, an 'eth_getEncryptionPublicKey' type request. These are created when
 * an eth_getEncryptionPublicKey call is requested.
 *
 * @typedef {Object} EncryptionPublicKey
 * @property {number} id An id to track and identify the message object
 * @property {Object} msgParams The parameters to pass to the encryptionPublicKey method once the request is
 * approved.
 * @property {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
 * @property {string} msgParams.data A hex string conversion of the raw buffer data of the request
 * @property {number} time The epoch time at which the this message was created
 * @property {string} status Indicates whether the request is 'unapproved', 'approved', 'received' or 'rejected'
 * @property {string} type The json-prc method for which a request has been made. A 'Message' will
 * always have a 'eth_getEncryptionPublicKey' type.
 *
 */

export default class EncryptionPublicKeyManager extends EventEmitter {
  /**
   * Controller in charge of managing - storing, adding, removing, updating - EncryptionPublicKey.
   *
   * @typedef {Object} EncryptionPublicKeyManager
   * @property {Object} memStore The observable store where EncryptionPublicKey are saved with persistance.
   * @property {Object} memStore.unapprovedEncryptionPublicKeyMsgs A collection of all EncryptionPublicKeys in the 'unapproved' state
   * @property {number} memStore.unapprovedEncryptionPublicKeyMsgCount The count of all EncryptionPublicKeys in this.memStore.unapprobedMsgs
   * @property {Array} messages Holds all messages that have been created by this EncryptionPublicKeyManager
   *
   */
  constructor() {
    super();
    this.memStore = new ObservableStore({
      unapprovedEncryptionPublicKeyMsgs: {},
      unapprovedEncryptionPublicKeyMsgCount: 0,
    });
    this.messages = [];
  }

  /**
   * A getter for the number of 'unapproved' EncryptionPublicKeys in this.messages
   *
   * @returns {number} The number of 'unapproved' EncryptionPublicKeys in this.messages
   *
   */
  get unapprovedEncryptionPublicKeyMsgCount() {
    return Object.keys(this.getUnapprovedMsgs()).length;
  }

  /**
   * A getter for the 'unapproved' EncryptionPublicKeys in this.messages
   *
   * @returns {Object} An index of EncryptionPublicKey ids to EncryptionPublicKeys, for all 'unapproved' EncryptionPublicKeys in
   * this.messages
   *
   */
  getUnapprovedMsgs() {
    return this.messages
      .filter((msg) => msg.status === 'unapproved')
      .reduce((result, msg) => {
        result[msg.id] = msg;
        return result;
      }, {});
  }

  /**
   * Creates a new EncryptionPublicKey with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new EncryptionPublicKey to this.messages, and to save the unapproved EncryptionPublicKeys from that list to
   * this.memStore.
   *
   * @param {Object} address - The param for the eth_getEncryptionPublicKey call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {Promise<Buffer>} The raw public key contents
   *
   */
  addUnapprovedMessageAsync(address, req) {
    return new Promise((resolve, reject) => {
      if (!address) {
        reject(new Error('MetaMask Message: address field is required.'));
        return;
      }
      const msgId = this.addUnapprovedMessage(address, req);
      this.once(`${msgId}:finished`, (data) => {
        switch (data.status) {
          case 'received':
            resolve(data.rawData);
            return;
          case 'rejected':
            reject(
              ethErrors.provider.userRejectedRequest(
                'MetaMask EncryptionPublicKey: User denied message EncryptionPublicKey.',
              ),
            );
            return;
          default:
            reject(
              new Error(
                `MetaMask EncryptionPublicKey: Unknown problem: ${JSON.stringify(
                  address,
                )}`,
              ),
            );
        }
      });
    });
  }

  /**
   * Creates a new EncryptionPublicKey with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new EncryptionPublicKey to this.messages, and to save the unapproved EncryptionPublicKeys from that list to
   * this.memStore.
   *
   * @param {Object} address - The param for the eth_getEncryptionPublicKey call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {number} The id of the newly created EncryptionPublicKey.
   *
   */
  addUnapprovedMessage(address, req) {
    log.debug(`EncryptionPublicKeyManager addUnapprovedMessage: address`);
    // create txData obj with parameters and meta data
    const time = new Date().getTime();
    const msgId = createId();
    const msgData = {
      id: msgId,
      msgParams: address,
      time,
      status: 'unapproved',
      type: MESSAGE_TYPE.ETH_GET_ENCRYPTION_PUBLIC_KEY,
    };

    if (req) {
      msgData.origin = req.origin;
    }

    this.addMsg(msgData);

    // signal update
    this.emit('update');
    return msgId;
  }

  /**
   * Adds a passed EncryptionPublicKey to this.messages, and calls this._saveMsgList() to save the unapproved EncryptionPublicKeys from that
   * list to this.memStore.
   *
   * @param {Message} msg The EncryptionPublicKey to add to this.messages
   *
   */
  addMsg(msg) {
    this.messages.push(msg);
    this._saveMsgList();
  }

  /**
   * Returns a specified EncryptionPublicKey.
   *
   * @param {number} msgId The id of the EncryptionPublicKey to get
   * @returns {EncryptionPublicKey|undefined} The EncryptionPublicKey with the id that matches the passed msgId, or undefined
   * if no EncryptionPublicKey has that id.
   *
   */
  getMsg(msgId) {
    return this.messages.find((msg) => msg.id === msgId);
  }

  /**
   * Approves a EncryptionPublicKey. Sets the message status via a call to this.setMsgStatusApproved, and returns a promise
   * with any the message params modified for proper providing.
   *
   * @param {Object} msgParams The msgParams to be used when eth_getEncryptionPublicKey is called, plus data added by MetaMask.
   * @param {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
   * @returns {Promise<object>} Promises the msgParams object with metamaskId removed.
   *
   */
  approveMessage(msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId);
    return this.prepMsgForEncryptionPublicKey(msgParams);
  }

  /**
   * Sets a EncryptionPublicKey status to 'approved' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the EncryptionPublicKey to approve.
   *
   */
  setMsgStatusApproved(msgId) {
    this._setMsgStatus(msgId, 'approved');
  }

  /**
   * Sets a EncryptionPublicKey status to 'received' via a call to this._setMsgStatus and updates that EncryptionPublicKey in
   * this.messages by adding the raw data of request to the EncryptionPublicKey
   *
   * @param {number} msgId The id of the EncryptionPublicKey.
   * @param {buffer} rawData The raw data of the message request
   *
   */
  setMsgStatusReceived(msgId, rawData) {
    const msg = this.getMsg(msgId);
    msg.rawData = rawData;
    this._updateMsg(msg);
    this._setMsgStatus(msgId, 'received');
  }

  /**
   * Removes the metamaskId property from passed msgParams and returns a promise which resolves the updated msgParams
   *
   * @param {Object} msgParams The msgParams to modify
   * @returns {Promise<object>} Promises the msgParams with the metamaskId property removed
   *
   */
  prepMsgForEncryptionPublicKey(msgParams) {
    delete msgParams.metamaskId;
    return Promise.resolve(msgParams);
  }

  /**
   * Sets a EncryptionPublicKey status to 'rejected' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the EncryptionPublicKey to reject.
   *
   */
  rejectMsg(msgId) {
    this._setMsgStatus(msgId, 'rejected');
  }

  /**
   * Sets a TypedMessage status to 'errored' via a call to this._setMsgStatus.
   *
   * @param {number} msgId The id of the TypedMessage to error
   *
   */
  errorMessage(msgId, error) {
    const msg = this.getMsg(msgId);
    msg.error = error;
    this._updateMsg(msg);
    this._setMsgStatus(msgId, 'errored');
  }

  /**
   * Clears all unapproved messages from memory.
   */
  clearUnapproved() {
    this.messages = this.messages.filter((msg) => msg.status !== 'unapproved');
    this._saveMsgList();
  }

  /**
   * Updates the status of a EncryptionPublicKey in this.messages via a call to this._updateMsg
   *
   * @private
   * @param {number} msgId The id of the EncryptionPublicKey to update.
   * @param {string} status The new status of the EncryptionPublicKey.
   * @throws A 'EncryptionPublicKeyManager - EncryptionPublicKey not found for id: "${msgId}".' if there is no EncryptionPublicKey
   * in this.messages with an id equal to the passed msgId
   * @fires An event with a name equal to `${msgId}:${status}`. The EncryptionPublicKey is also fired.
   * @fires If status is 'rejected' or 'received', an event with a name equal to `${msgId}:finished` is fired along
   * with the EncryptionPublicKey
   *
   */
  _setMsgStatus(msgId, status) {
    const msg = this.getMsg(msgId);
    if (!msg) {
      throw new Error(
        `EncryptionPublicKeyManager - Message not found for id: "${msgId}".`,
      );
    }
    msg.status = status;
    this._updateMsg(msg);
    this.emit(`${msgId}:${status}`, msg);
    if (status === 'rejected' || status === 'received') {
      this.emit(`${msgId}:finished`, msg);
    }
  }

  /**
   * Sets a EncryptionPublicKey in this.messages to the passed EncryptionPublicKey if the ids are equal. Then saves the
   * unapprovedEncryptionPublicKeyMsgs index to storage via this._saveMsgList
   *
   * @private
   * @param {EncryptionPublicKey} msg - A EncryptionPublicKey that will replace an existing EncryptionPublicKey (with the same
   * id) in this.messages
   *
   */
  _updateMsg(msg) {
    const index = this.messages.findIndex((message) => message.id === msg.id);
    if (index !== -1) {
      this.messages[index] = msg;
    }
    this._saveMsgList();
  }

  /**
   * Saves the unapproved EncryptionPublicKeys, and their count, to this.memStore
   *
   * @private
   * @fires 'updateBadge'
   *
   */
  _saveMsgList() {
    const unapprovedEncryptionPublicKeyMsgs = this.getUnapprovedMsgs();
    const unapprovedEncryptionPublicKeyMsgCount = Object.keys(
      unapprovedEncryptionPublicKeyMsgs,
    ).length;
    this.memStore.updateState({
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedEncryptionPublicKeyMsgCount,
    });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
  }
}
