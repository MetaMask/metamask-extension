import { createSelector } from 'reselect';
import { DefaultRootState } from 'react-redux';
import {
  SignatureRequestStatus,
  type SignatureControllerState,
  type SignatureRequest,
} from '@metamask/signature-controller';
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

/**
 * Returns the unapproved {@link SignatureRequest} for a given ID, or
 * `undefined` if the request does not exist or is not in the unapproved state.
 *
 * The input selector casts `DefaultRootState` to `SignatureState` so callers
 * inside `useSelector` need no type cast at the call site.
 */
export const selectUnapprovedSignatureRequestById = createSelector(
  (state: DefaultRootState, id: string | undefined) =>
    selectSignatureRequestById(state as SignatureState, id),
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

/** @deprecated Use {@link selectSignatureRequestById} or {@link selectUnapprovedSignatureRequestById} instead. */
export const selectUnapprovedMessage = createSelector(
  selectUnapprovedMessages,
  (_state: DefaultRootState, messageId: string) => messageId,
  (messages, messageId) => messages[messageId],
);
