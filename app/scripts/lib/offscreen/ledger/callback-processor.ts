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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const callback = this.messageCallbacks.get(data.messageId)!;
      callback(data);
    }
  }
}
