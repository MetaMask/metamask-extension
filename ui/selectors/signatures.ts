import { createSelector } from 'reselect';
import { SignatureControllerState } from '@metamask/signature-controller';

export type SignaturesRootState = {
  metamask: SignatureControllerState;
};

export const selectPersonalMessages = createSelector(
  (state: SignaturesRootState) => state.metamask?.unapprovedPersonalMsgs,
  (unapprovedPersonalMsgs) => unapprovedPersonalMsgs || {},
);

export const selectTypedMessages = createSelector(
  (state: SignaturesRootState) => state.metamask?.unapprovedTypedMessages,
  (unapprovedTypedMessages) => unapprovedTypedMessages || {},
);

export const selectUnapprovedMessages = createSelector(
  selectPersonalMessages,
  selectTypedMessages,
  (personalMsgs, typedMessages) => ({
    ...personalMsgs,
    ...typedMessages,
  }),
);

export const selectUnapprovedMessage = createSelector(
  selectUnapprovedMessages,
  (_state: SignaturesRootState, messageId: string | undefined) => messageId,
  (unapprovedMessages, messageId) =>
    messageId ? unapprovedMessages[messageId] : undefined,
);
