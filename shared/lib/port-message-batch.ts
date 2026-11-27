// An array on a UI port is always a batch: stream messages are objects, and a
// lone array message is wrapped by `packPortMessages`.

/**
 * @param message - A message received from the port.
 * @returns True when the message is a batch of messages.
 */
export function isPortMessageBatch(message: unknown): message is unknown[] {
  return Array.isArray(message);
}

/**
 * @param message - A message received from the port.
 * @returns The messages it carries, in the order they were written.
 */
export function unpackPortMessage(message: unknown): unknown[] {
  return isPortMessageBatch(message) ? message : [message];
}

/**
 * @param messages - The messages written in one task, in order. Not empty.
 * @returns One message unwrapped (unless it is an array), else the batch.
 */
export function packPortMessages(messages: unknown[]): unknown {
  if (messages.length === 1 && !isPortMessageBatch(messages[0])) {
    return messages[0];
  }
  return messages;
}
