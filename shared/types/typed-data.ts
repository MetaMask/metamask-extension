import { MessageTypes, TypedMessage } from '@metamask/eth-sig-util';

/**
 * Represents a parsed EIP-712 typed data message with special handling for message.value
 * This is the return type of parseTypedDataMessage function
 *
 * Extends the standard TypedMessage interface but ensures that message.value is treated as a string
 * to preserve precision for large numbers
 */
export type ParsedTypedMessage<
  M extends ReturnType<typeof JSON.parse> = unknown,
  T extends MessageTypes = MessageTypes,
> = TypedMessage<T> & {
  message: M;
};
