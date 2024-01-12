/**
 * The ledger iframe from the ledger keyring library is embedded in the ledger
 * offscreen iframe that exists in the extension codebase. This class is used
 * to add an identifier to the message that will be returned in the response
 * from the postMessage call to the ledger keyring iframe. Using this method
 * allows for proper routing of the response to the correct callback. There is
 * an id incrementer that is used to generate a unique messageId for each
 * registered callback. a Callback is registered when the ledger-iframe
 * receives a message requesting data from the leddger device.
 */
export class CallbackProcessor {
  currentMessageId = 0;

  messageCallbacks = new Map<number, (response?: any) => void>();

  registerCallback(callback: (response?: any) => void) {
    this.currentMessageId += 1;
    this.messageCallbacks.set(this.currentMessageId, callback);

    return this.currentMessageId;
  }

  processCallback(data: { messageId: number }) {
    if (this.messageCallbacks.has(data.messageId)) {
      const callback = this.messageCallbacks.get(data.messageId);
      // This if block should always be true given that we used the has method
      // to check for the existence. However, typescript does not know that and
      // rather than use a non-null assertion this is a safer way to handle it.
      if (callback) {
        // Delete the message callback as once its processed it should not
        // receive additional data and can be gargabe collected.
        this.messageCallbacks.delete(data.messageId);
        return callback(data);
      }
    }
    return null;
  }
}
