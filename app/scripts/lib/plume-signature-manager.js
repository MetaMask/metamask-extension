import EventEmitter from 'events';
import { ObservableStore } from '@metamask/obs-store';
import { ethErrors } from 'eth-rpc-errors';
import log from 'loglevel';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { EVENT } from '../../../shared/constants/metametrics';
import { METAMASK_CONTROLLER_EVENTS } from '../metamask-controller';
import createId from '../../../shared/modules/random-id';

export default class PlumeSignatureManager extends EventEmitter {
  /**
   * Controller in charge of managing - storing, adding, removing, updating - PlumeSignatureManager.
   *
   * @param {object} opts - Controller options
   * @param {Function} opts.metricEvent - A function for emitting a metric event.
   */
  constructor(opts) {
    super();
    this.memStore = new ObservableStore({
      unapprovedPlumeMsgs: {},
      unapprovedPlumeMsgCount: 0,
    });

    this.resetState = () => {
      this.memStore.updateState({
        unapprovedPlumeMsgs: {},
        unapprovedPlumeMsgCount: 0,
      });
    };

    this.messages = [];
    this.metricsEvent = opts.metricsEvent;
  }

  /**
   * A getter for the number of 'unapproved' PlumeMessages in this.messages
   *
   * @returns {number} The number of 'unapproved' PlumeMessages in this.messages
   */
  get unapprovedPlumeMsgCount() {
    return Object.keys(this.getUnapprovedMsgs()).length;
  }

  /**
   * A getter for the 'unapproved' PlumeMessages in this.messages
   *
   * @returns {object} An index of PlumeMessage ids to PlumeMessages, for all 'unapproved' PlumeMessages in
   * this.messages
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
   * Creates a new PlumeMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new PlumeMessage to this.messages, and to save the unapproved PlumeMessages from that list to
   * this.memStore.
   *
   * @param {object} address - The param for the eth_getPlumeSignature call to be made after the message is approved.
   * @param {object} [req] - The original request object possibly containing the origin
   * @returns {Promise<Buffer>} The genereated plume signature
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
                'MetaMask PlumeSignature: User denied message PlumeSignature.',
              ),
            );
            return;
          case 'errored':
            reject(new Error('Plume signature error'));
            return;
          default:
            reject(
              new Error(
                `MetaMask PlumeSignature: Unknown problem: ${JSON.stringify(
                  address,
                )}`,
              ),
            );
        }
      });
    });
  }

  /**
   * Creates a new PlumeMessage with an 'unapproved' status using the passed msgParams. this.addMsg is called to add
   * the new PlumeMessage to this.messages, and to save the unapproved PlumeMessages from that list to
   * this.memStore.
   *
   * @param {object} address - The param for the eth_getPlumeSignature call to be made after the message is approved.
   * @param {object} [req] - The original request object possibly containing the origin
   * @returns {number} The id of the newly created PlumeMessage.
   */
  addUnapprovedMessage(address, req) {
    log.debug(`PlumeSignatureManager addUnapprovedMessage: ${address}`);
    // create txData obj with parameters and meta data
    const time = new Date().getTime();
    const msgId = createId();
    const msgData = {
      id: msgId,
      msgParams: address,
      time,
      status: 'unapproved',
      type: MESSAGE_TYPE.ETH_GET_PLUME_SIGNATURE,
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
   * Adds a passed PlumeMessage to this.messages, and calls this._saveMsgList() to save the unapproved PlumeMessages from that
   * list to this.memStore.
   *
   * @param {Message} msg - The PlumeMessage to add to this.messages
   */
  addMsg(msg) {
    this.messages.push(msg);
    this._saveMsgList();
  }

  /**
   * Returns a specified PlumeMessage.
   *
   * @param {number} msgId - The id of the PlumeMessage to get
   * @returns {PlumeMessage|undefined} The PlumeMessage with the id that matches the passed msgId, or undefined
   * if no PlumeMessage has that id.
   */
  getMsg(msgId) {
    return this.messages.find((msg) => msg.id === msgId);
  }

  /**
   * Approves a PlumeMessage. Sets the message status via a call to this.setMsgStatusApproved, and returns a promise
   * with the message params modified for proper signing.
   *
   * @param {object} msgParams - The msgParams to be used when eth_getPlumeSignature is called, plus data added by MetaMask.
   * @param {object} msgParams.metamaskId - Added to msgParams for tracking and identification within MetaMask.
   * @returns {Promise<object>} Promises the msgParams object with metamaskId removed.
   */
  approveMessage(msgParams) {
    this.setMsgStatusApproved(msgParams.metamaskId);
    return this.prepMsgForPlumeSignature(msgParams);
  }

  /**
   * Sets a PlumeMessage status to 'approved' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the PlumeMessage to approve.
   */
  setMsgStatusApproved(msgId) {
    this._setMsgStatus(msgId, 'approved');
  }

  /**
   * Sets a PlumeMessage status to 'received' via a call to this._setMsgStatus and updates that PlumeMessage in
   * this.messages by adding the raw data of the PlumeMessage request to the PlumeMessage
   *
   * @param {number} msgId - The id of the PlumeMessage.
   * @param {buffer} rawData - The raw data of the message request
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
   * @param {object} msgParams - The msgParams to modify
   * @returns {Promise<object>} Promises the msgParams with the metamaskId property removed
   */
  prepMsgForPlumeSignature(msgParams) {
    delete msgParams.metamaskId;
    return Promise.resolve(msgParams);
  }

  /**
   * Sets a PlumeMessage status to 'rejected' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the PlumeMessage to reject.
   * @param reason
   */
  rejectMsg(msgId, reason = undefined) {
    if (reason) {
      this.metricsEvent({
        event: reason,
        category: EVENT.CATEGORIES.MESSAGES,
        properties: {
          action: 'Plume Message Request',
        },
      });
    }
    this._setMsgStatus(msgId, 'rejected');
  }

  /**
   * Sets a TypedMessage status to 'errored' via a call to this._setMsgStatus.
   *
   * @param {number} msgId - The id of the TypedMessage to error
   * @param error
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
   * Updates the status of a PlumeMessage in this.messages via a call to this._updateMsg
   *
   * @private
   * @param {number} msgId - The id of the PlumeMessage to update.
   * @param {string} status - The new status of the PlumeMessage.
   * @throws A 'PlumeMessageManager - PlumeMessage not found for id: "${msgId}".' if there is no PlumeMessage
   * in this.messages with an id equal to the passed msgId
   * @fires An event with a name equal to `${msgId}:${status}`. The PlumeMessage is also fired.
   * @fires If status is 'rejected' or 'received', an event with a name equal to `${msgId}:finished` is fired along
   * with the PlumeMessage
   */
  _setMsgStatus(msgId, status) {
    const msg = this.getMsg(msgId);
    if (!msg) {
      throw new Error(
        `PlumeMessageManager - Message not found for id: "${msgId}".`,
      );
    }
    msg.status = status;
    this._updateMsg(msg);
    this.emit(`${msgId}:${status}`, msg);
    if (
      status === 'rejected' ||
      status === 'received' ||
      status === 'errored'
    ) {
      this.emit(`${msgId}:finished`, msg);
    }
  }

  /**
   * Sets a PlumeMessage in this.messages to the passed PlumeMessage if the ids are equal. Then saves the
   * unapprovedMsgs index to storage via this._saveMsgList
   *
   * @private
   * @param {PlumeMessage} msg - A PlumeMessage that will replace an existing PlumeMessage (with the same
   * id) in this.messages
   */
  _updateMsg(msg) {
    const index = this.messages.findIndex((message) => message.id === msg.id);
    if (index !== -1) {
      this.messages[index] = msg;
    }
    this._saveMsgList();
  }

  /**
   * Saves the unapproved PlumeMessages, and their count, to this.memStore
   *
   * @private
   * @fires 'updateBadge'
   */
  _saveMsgList() {
    const unapprovedPlumeMsgs = this.getUnapprovedMsgs();
    const unapprovedPlumeMsgCount = Object.keys(unapprovedPlumeMsgs).length;
    this.memStore.updateState({
      unapprovedPlumeMsgs,
      unapprovedPlumeMsgCount,
    });
    this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
  }
}
