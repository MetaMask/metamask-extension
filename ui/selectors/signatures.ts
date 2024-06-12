import { createSelector } from 'reselect';
import {
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
} from './transactions';
import { createDeepEqualSelector } from './util';
import { DefaultRootState } from 'react-redux';
import { AbstractMessage, AbstractMessageParams } from '@metamask/message-manager';

export const selectUnapprovedMessages = createSelector<
  any,
  any,
  any,
  any,
  Record<string, AbstractMessage & {msgParams: AbstractMessageParams}>
>(
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
  (messages, personalMsgs, typedMessages) => ({
    ...messages,
    ...personalMsgs,
    ...typedMessages,
  }),
);

const internalSelectUnapprovedMessage = createSelector(
  selectUnapprovedMessages,
  (_state: DefaultRootState, messageId: string) => messageId,
  (messages, messageId) => messages[messageId],
);

export const selectUnapprovedMessage = createDeepEqualSelector(
  internalSelectUnapprovedMessage,
  (message) => message,
);
