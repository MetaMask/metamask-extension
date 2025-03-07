import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Hex, numberToHex } from '@metamask/utils';
import {
  ApprovalsMetaMaskState,
  getUnapprovedTransaction,
  oldestPendingConfirmationSelector,
  selectPendingApproval,
} from '../../../selectors';
import { selectUnapprovedMessage } from '../../../selectors/signatures';
import {
  shouldUseRedesignForSignatures,
  shouldUseRedesignForTransactions,
} from '../../../../shared/lib/confirmation.utils';
import { getTokenBalances } from '../../../ducks/metamask/metamask';

const GAS_FEE_TOKEN_ADDRESS: Hex = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

/**
 * Determine the current confirmation based on the pending approvals and controller state.
 *
 * DO NOT USE within a redesigned confirmation.
 * Instead use ConfirmContext to read the current confirmation.
 *
 * @returns The current confirmation data.
 */
const useCurrentConfirmation = () => {
  const { id: paramsConfirmationId } = useParams<{ id: string }>();
  const oldestPendingApproval = useSelector(oldestPendingConfirmationSelector);
  const confirmationId = paramsConfirmationId ?? oldestPendingApproval?.id;

  const pendingApproval = useSelector((state) =>
    selectPendingApproval(state as ApprovalsMetaMaskState, confirmationId),
  );

  const transactionMetadata = useSelector((state) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (getUnapprovedTransaction as any)(state, confirmationId),
  ) as TransactionMeta | undefined;

  const tokenBalances = useSelector(getTokenBalances);

  if (transactionMetadata) {
    const balance =
      tokenBalances?.[transactionMetadata.txParams.from as Hex]?.[
        transactionMetadata.chainId
      ]?.[GAS_FEE_TOKEN_ADDRESS] ?? '0x0';

    transactionMetadata.gasFeeTokens = [
      {
        contractAddress: GAS_FEE_TOKEN_ADDRESS,
        amount: numberToHex(100000),
        balance,
      },
    ];
  }

  const signatureMessage = useSelector((state) =>
    selectUnapprovedMessage(state, confirmationId),
  );

  const useRedesignedForSignatures = shouldUseRedesignForSignatures({
    approvalType: pendingApproval?.type as ApprovalType,
  });

  const useRedesignedForTransaction = shouldUseRedesignForTransactions({
    transactionMetadataType: transactionMetadata?.type,
  });

  const shouldUseRedesign =
    useRedesignedForSignatures || useRedesignedForTransaction;

  return useMemo(() => {
    if (!shouldUseRedesign) {
      return { currentConfirmation: undefined };
    }

    const currentConfirmation =
      transactionMetadata ?? signatureMessage ?? undefined;

    return { currentConfirmation };
  }, [transactionMetadata, signatureMessage, shouldUseRedesign]);
};

export default useCurrentConfirmation;
