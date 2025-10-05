import { createSelector } from 'reselect';
import { DefaultRootState } from 'react-redux';
import { SignatureControllerState } from '@metamask/signature-controller';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import {
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
} from './transactions-legacy';

export type SignaturesRootState = {
  metamask: SignatureControllerState;
};

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

export const selectSignatureRequests = createSelector(
  (state: SignaturesRootState) => state.metamask.signatureRequests,
  (signatureRequests) => signatureRequests ?? {},
);

export const selectSignatureRequestById = createSelector(
  selectSignatureRequests,
  (_state: SignaturesRootState, requestId: string | undefined) => requestId,
  (signatureRequests, requestId) => signatureRequests[requestId ?? ''],
);
