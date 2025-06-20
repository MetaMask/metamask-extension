import { createSelector } from 'reselect';
import { DefaultRootState } from 'react-redux';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import {
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
} from './transactions';

export const selectUnapprovedMessages = createSelector(
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
  (personalMsgs, typedMessages) => ({
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
