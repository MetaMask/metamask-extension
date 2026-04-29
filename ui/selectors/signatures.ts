import { createSelector } from 'reselect';
import {
  SignatureRequestStatus,
  type SignatureControllerState,
  type SignatureRequest,
} from '@metamask/signature-controller';
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
