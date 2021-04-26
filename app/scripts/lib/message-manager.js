import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { bufferToHex } from 'ethereumjs-util';
import { ethErrors } from 'eth-rpc-errors';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import createId from '../../../shared/modules/random-id';

/**
 * Represents, and contains data about, an 'eth_sign' type signature request. These are created when a signature for
 * an eth_sign call is requested.
 *
 * @see {@link https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign}
 *
 * @typedef {Object} Message
 * @property {number} id An id to track and identify the message object
 * @property {Object} msgParams The parameters to pass to the eth_sign method once the signature request is approved.
 * @property {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
 * @property {string} msgParams.data A hex string conversion of the raw buffer data of the signature request
 * @property {number} time The epoch time at which the this message was created
 * @property {string} status Indicates whether the signature request is 'unapproved', 'approved', 'signed' or 'rejected'
 * @property {string} type The json-prc signing method for which a signature request has been made. A 'Message' with
 * always have a 'eth_sign' type.
 *
 */

export default class MessageManager extends EventEmitter {
  /**
   * Controller in charge of managing - storing, adding, removing, updating - Messages.
   *
   * @typedef {Object} MessageManager
   * @property {Object} memStore The observable store where Messages are saved.
   * @property {Object} memStore.unapprovedMsgs A collection of all Messages in the 'unapproved' state
   * @property {number} memStore.unapprovedMsgCount The count of all Messages in this.memStore.unapprovedMsgs
   * @property {Array} messages Holds all messages that have been created by this MessageManager
   *
   */
  constructor() {
    super();
    this.memStore = new ObservableStore({
      unapprovedMsgs: {},
      unapprovedMsgCount: 0,
    });
    this.messages = [];
  }

  /**
   * A getter for the number of 'unapproved' Messages in this.messages
   *
   * @returns {number} The number of 'unapproved' Messages in this.messages
   *
   */
  get unapprovedMsgCount() {
    return Object.keys(this.getUnapprovedMsgs()).length;
  }

  /**
   * A getter for the 'unapproved' Messages in this.messages
   *
   * @returns {Object} An index of Message ids to Messages, for all 'unapproved' Messages in this.messages
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
   * Creates a new Message with an 'unapproved' status using the passed msgParams. this.addMsg is called to add the
   * new Message to this.messages, and to save the unapproved Messages from that list to this.memStore.
   *
   * @param {Object} msgParams - The params for the eth_sign call to be made after the message is approved.
   * @param {Object} [req] - The original request object possibly containing the origin
   * @returns {promise} after signature has been
   *
   */
  addUnapprovedMessageAsync(msgParams, req) {
    return new Promise((resolve, reject) => {
      const msgId = this.addUnapprovedMessage(msgParams, req);
      // await finished
      this.once(`${msgId}:finished`, (data) => {
        switch (data.status) {
          case 'signed':
            return resolve(data.rawSig);
          case 'rejected':
            return reject(
              ethErrors.provider.userRejectedRequest(
                'MetaMask Message Signature: User denied message signature.',
              ),
            );
          default:
            return reject(
              new Error(
                `MetaMask Message Signature: Unknown problem: ${JSON.stringify(
                  msgParams,
                )}`,
              ),
            );
        }
      });
    });
  }

  /**
   * Creates a new Message with an 'unapproved' status using the passed msgParams. this.addMsg is called to add the
   * new Message to this.messages, and to save the unapproved Messages from that list to this.memStore.
   *
   * @param {Object} msgParams - The params for the eth_sign call to be made after the message is approved.
   * @param {Object} [req] - The original request object where the origin may be specified
   * @returns {number} The id of the newly created message.
   *
   */
  addUnapprovedMessage(msgParams, req) {
    // add origin from request
    if (req) {
      msgParams.origin = req.origin;
    }
    msgParams.data = normalizeMsgData(msgParams.data);
    // create txData obj with parameters and meta data
    const time = new Date().getTime();
    const msgId = createId();
    const msgData = {
      id: msgId,
      msgParams,
      time,
      status: 'unapproved',
      type: MESSAGE_TYPE.ETH_SIGN,
    };
    this.addMsg(msgData);

    // signal update
    this.emit('update');
    return msgId;
  }

  /**
   * Adds a passed Message to this.messages, and calls this._saveMsgList() to save the unapproved Messages from that
   * list to this.memStore.
   *
   * @param {Message} msg - The Message to add to this.messages
   *
   */
  addMsg(msg) {
    this.messages.push(msg);
    this._saveMsgList();
  }

  /**
   * Returns a specified Message.
   *
   * @param {number} msgId - The id of the Message to get
   * @returns {Message|undefined} The Message with the id that matches the passed msgId, or undefined if no Message has that id.
   *
   */
  getMsg(msgId) {
    return this.messages.find((msg) => msg.id === msgId);
  }

  /**
   * Approves a Message. Sets the message status via a call to this.setMsgStatusApproved, and returns a promise with
   * any the message params modified for proper signing.
   *
   * @param {Object} msgParams - The msgParams to be used when eth_sign is called, plus data added by MetaMask.
   * @param {Object} msgParams.metamaskId Added to msgParams for tracking and identification within MetaMask.
   * @returns {Promise<object>} Promises the msgParams object with metamaskId removed.
   *
   */
  approveMessage(msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId);
    return this.prepMsgForSigning(msgParams);
  }

  /**
   * Sets a Message status to 'approved' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the Message to approve.
   *
   */
  setMsgStatusApproved(msgId) {
    this._setMsgStatus(msgId, 'approved');
  }

  /**
   * Sets a Message status to 'signed' via a call to this._setMsgStatus and updates that Message in this.messages by
   * adding the raw signature data of the signature request to the Message
   *
   * @param {number} msgId - The id of the Message to sign.
   * @param {buffer} rawSig - The raw data of the signature request
   *
   */
  setMsgStatusSigned(msgId, rawSig) {
    const msg = this.getMsg(msgId);
    msg.rawSig = rawSig;
    this._updateMsg(msg);
    this._setMsgStatus(msgId, 'signed');
  }

  /**
   * Removes the metamaskId property from passed msgParams and returns a promise which resolves the updated msgParams
   *
   * @param {Object} msgParams - The msgParams to modify
   * @returns {Promise<object>} Promises the msgParams with the metamaskId property removed
   *
   */
  prepMsgForSigning(msgParams) {
    delete msgParams.metamaskId;
    return Promise.resolve(msgParams);
  }

  /**
   * Sets a Message status to 'rejected' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the Message to reject.
   *
   */
  rejectMsg(msgId) {
    this._setMsgStatus(msgId, 'rejected');
  }

  /**
   * Clears all unapproved messages from memory.
   */
  clearUnapproved() {
    this.messages = this.messages.filter((msg) => msg.status !== 'unapproved');
    this._saveMsgList();
  }

  /**
   * Updates the status of a Message in this.messages via a call to this._updateMsg
   *
   * @private
   * @param {number} msgId - The id of the Message to update.
   * @param {string} status - The new status of the Message.
   * @throws A 'MessageManager - Message not found for id: "${msgId}".' if there is no Message in this.messages with an
   * id equal to the passed msgId
   * @fires An event with a name equal to `${msgId}:${status}`. The Message is also fired.
   * @fires If status is 'rejected' or 'signed', an event with a name equal to `${msgId}:finished` is fired along with the message
   *
   */
  _setMsgStatus(msgId, status) {
    const msg = this.getMsg(msgId);
    if (!msg) {
      throw new Error(`MessageManager - Message not found for id: "${msgId}".`);
    }
    msg.status = status;
    this._updateMsg(msg);
    this.emit(`${msgId}:${status}`, msg);
    if (status === 'rejected' || status === 'signed') {
      this.emit(`${msgId}:finished`, msg);
    }
  }

  /**
   * Sets a Message in this.messages to the passed Message if the ids are equal. Then saves the unapprovedMsg list to
   * storage via this._saveMsgList
   *
   * @private
   * @param {msg} Message - A Message that will replace an existing Message (with the same id) in this.messages
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
   * Saves the unapproved messages, and their count, to this.memStore
   *
   * @private
   * @fires 'updateBadge'
   *
   */
  _saveMsgList() {
    const unapprovedMsgs = this.getUnapprovedMsgs();
    const unapprovedMsgCount = Object.keys(unapprovedMsgs).length;
    this.memStore.updateState({ unapprovedMsgs, unapprovedMsgCount });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
  }
}

/**
 * A helper function that converts raw buffer data to a hex, or just returns the data if it is already formatted as a hex.
 *
 * @param {any} data - The buffer data to convert to a hex
 * @returns {string} A hex string conversion of the buffer data
 *
 */
function normalizeMsgData(data) {
  if (data.slice(0, 2) === '0x') {
    // data is already hex
    return data;
  }
  // data is unicode, convert to hex
  return bufferToHex(Buffer.from(data, 'utf8'));
}
