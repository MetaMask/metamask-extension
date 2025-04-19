import { MessageTypes } from '@metamask/eth-sig-util';

/**
 * Recursively sanitizes a message object based on the provided types and primary type.
 *
 * @param message - The message object to sanitize.
 * @param types - The types defined in the typed message.
 * @param primaryType - The primary type of the message.
 * @returns The sanitized message object.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function sanitizeMessageRecursively<T extends MessageTypes>(
  message: Record<string, unknown>,
  types: T,
  primaryType: string | number,
): Record<string, unknown> {
  const sanitizedMessage: Record<string, unknown> = {};
  const typeDefinition = types[primaryType];

  if (!typeDefinition) {
    return message;
  }

  for (const field of typeDefinition) {
    const { name, type } = field;
    if (message[name] !== undefined) {
      if (types[type]) {
        sanitizedMessage[name] = sanitizeMessageRecursively(
          message[name] as Record<string, unknown>,
          types,
          type,
        );
      } else {
        sanitizedMessage[name] = message[name];
      }
    }
  }

  return sanitizedMessage;
}
