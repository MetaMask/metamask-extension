import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { oldestPendingConfirmationSelector } from '../../../selectors';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import { SignatureRequestType } from '../types/confirm';

/**
 * Returns the signature request for the current confirmation.
 * Uses URL params or falls back to the oldest pending confirmation.
 *
 * @returns The signature request or undefined.
 */
export function useSignatureRequest(): SignatureRequestType | undefined {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);

  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;

  const signatureMessage = useSelector((state) =>
    selectUnapprovedMessage(state, confirmationId),
  );

  return signatureMessage as SignatureRequestType | undefined;
}
