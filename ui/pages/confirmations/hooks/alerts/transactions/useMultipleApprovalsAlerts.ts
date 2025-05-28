import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { parseApprovalTransactionData } from '../../../../../../shared/modules/transaction.utils';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';

interface ApprovalInfo {
  tokenAddress: Hex;
  spenderAddress?: Hex;
  amount?: BigNumber;
  isNFT: boolean;
}

interface TokenOutflow {
  tokenAddress: Hex;
  amount: BigNumber;
  isDecrease: boolean;
}

export function useMultipleApprovalsAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isBatchTransaction = currentConfirmation?.type === 'batch';
  const nestedTransactions = currentConfirmation?.nestedTransactions;
  const simulationDataArray =
    currentConfirmation?.simulationData?.tokenBalanceChanges;

  // Extract all approvals from nested transactions
  const approvals = useMemo((): ApprovalInfo[] => {
    if (!isBatchTransaction || !nestedTransactions) {
      return [];
    }

    const approvalsList: ApprovalInfo[] = [];

    nestedTransactions.forEach((transaction) => {
      const { data, to } = transaction;
      if (!data || !to) return;

      const parseResult = parseApprovalTransactionData(data);
      if (!parseResult) return;

      const { name, amountOrTokenId, tokenAddress } = parseResult;

      // Skip revocations (zero amounts or setApprovalForAll with false)
      if (
        (amountOrTokenId && amountOrTokenId.isZero()) ||
        parseResult.isRevokeAll
      ) {
        return;
      }

      let actualTokenAddress: Hex;
      let spenderAddress: Hex | undefined;

      switch (name) {
        case 'approve':
          if (tokenAddress) {
            // Permit2 approve
            actualTokenAddress = tokenAddress;
            spenderAddress = to;
          } else {
            // Regular ERC20 approve
            actualTokenAddress = to;
          }
          break;
        case 'increaseAllowance':
        case 'setApprovalForAll':
          actualTokenAddress = to;
          break;
        default:
          return;
      }

      const isNFT = name === 'setApprovalForAll';

      approvalsList.push({
        tokenAddress: actualTokenAddress,
        spenderAddress,
        amount: amountOrTokenId,
        isNFT,
      });
    });

    return approvalsList;
  }, [isBatchTransaction, nestedTransactions]);

  const tokenOutflows = useMemo((): TokenOutflow[] => {
    if (!simulationDataArray) {
      return [];
    }

    return simulationDataArray
      .filter((change) => change.isDecrease)
      .map((change) => ({
        tokenAddress: change.address.toLowerCase() as Hex,
        amount: new BigNumber(change.difference, 16),
        isDecrease: change.isDecrease,
      }));
  }, [simulationDataArray]);

  const unusedApprovals = useMemo(() => {
    if (approvals.length === 0) {
      return [];
    }

    return approvals.filter((approval) => {
      if (approval.isNFT) {
        const hasNFTOutflows = tokenOutflows.some(
          (outflow) =>
            outflow.tokenAddress.toLowerCase() ===
            approval.tokenAddress.toLowerCase(),
        );
        return !hasNFTOutflows;
      }

      const tokenOutflow = tokenOutflows.find(
        (outflow) =>
          outflow.tokenAddress.toLowerCase() ===
          approval.tokenAddress.toLowerCase(),
      );

      if (!tokenOutflow) {
        return true;
      }

      // If there's an outflow but the approval amount is much larger than needed,
      // we might still want to flag it, but for now we'll only flag completely unused approvals
      return false;
    });
  }, [approvals, tokenOutflows]);

  const shouldShowAlert = unusedApprovals.length > 0;

  const hasUnusedNFTApprovals = unusedApprovals.some(
    (approval) => approval.isNFT,
  );

  return useMemo(() => {
    if (!shouldShowAlert) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedApprovalChanges,
        isBlocking: false,
        key: 'multipleApprovals',
        reason: t('alertReasonMultipleApprovals'),
        content: t('alertContentMultipleApprovals', [
          hasUnusedNFTApprovals ? t('nfts') : t('tokens'),
        ]),
        severity: Severity.Danger,
      },
    ];
  }, [shouldShowAlert, hasUnusedNFTApprovals, t]);
}
