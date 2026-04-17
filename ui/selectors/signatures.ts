import { createSelector } from 'reselect';
import { DefaultRootState } from 'react-redux';
import {
  SignatureRequestStatus,
  type SignatureControllerState,
  type SignatureRequest,
} from '@metamask/signature-controller';
import { createDeepEqualSelector } from '../../shared/lib/selectors/selector-creators';
import {
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
} from './transactions';
import { EMPTY_OBJECT } from './shared';

export type SignatureState = {
  metamask: SignatureControllerState;
};

export const selectSignatureRequests = (
  state: SignatureState,
): Record<string, SignatureRequest> =>
  state.metamask?.signatureRequests ??
  (EMPTY_OBJECT as Record<string, SignatureRequest>);

export const selectSignatureRequestById = createSelector(
  selectSignatureRequests,
  (_state: SignatureState, id: string | undefined) => id,
  (signatureRequests, id) => (id ? signatureRequests[id] : undefined),
);

export const selectUnapprovedSignatureRequestById = createSelector(
  selectSignatureRequestById,
  (request) =>
    request?.status === SignatureRequestStatus.Unapproved ? request : undefined,
);

/** @deprecated Use {@link selectSignatureRequests} instead. */
const selectUnapprovedMessages = createSelector(
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

/** @deprecated Use {@link selectSignatureRequestById} or {@link selectUnapprovedSignatureRequestById} instead. */
export const selectUnapprovedMessage = createDeepEqualSelector(
  internalSelectUnapprovedMessage,
  (message) => message,
);
