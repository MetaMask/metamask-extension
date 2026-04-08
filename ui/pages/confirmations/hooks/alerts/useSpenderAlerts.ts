import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { SignatureRequestType } from '../../types/confirm';
import { parseApprovalTransactionData } from '../../../../../shared/lib/transaction.utils';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { useIsNFT } from '../../components/confirm/info/approve/hooks/use-is-nft';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';
import { TokenStandard } from '../../../../../shared/constants/transaction';

enum AlertSkipReason {
  None = 'none',
  ZeroValue = 'zero-value',
  ZeroValueUnlessNFT = 'zero-value-unless-nft',
}

function getAlertSkipReason(
  currentConfirmation: TransactionMeta | SignatureRequestType | undefined,
): AlertSkipReason {
  if (!currentConfirmation) {
    return AlertSkipReason.None;
  }

  // Approval transactions
  const transactionMeta = currentConfirmation as TransactionMeta;
  const txData = transactionMeta.txParams?.data;

  if (txData) {
    const approvalData = parseApprovalTransactionData(txData as `0x${string}`);
    if (approvalData?.isRevokeAll) {
      return AlertSkipReason.ZeroValue;
    }
    if (approvalData?.amountOrTokenId?.isZero()) {
      return AlertSkipReason.ZeroValueUnlessNFT;
    }
    return AlertSkipReason.None;
  }

  return AlertSkipReason.None;
}

/**
 * Hook to generate alerts for spender addresses in approval transactions.
 * Supports both warning and malicious states using the trust signals system.
 * Skips alerts for zero-value operations (revocations) since they pose no risk.
 *
 * @returns Array of alerts for spender addresses
 */
export function useSpenderAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const { alertSkipReason, tokenAddressOverride } = useMemo(() => {
    const reason = getAlertSkipReason(currentConfirmation);

    if (reason === AlertSkipReason.ZeroValueUnlessNFT && currentConfirmation) {
      const transactionMeta = currentConfirmation as TransactionMeta;
      const txData = transactionMeta.txParams?.data;
      if (txData) {
        const approvalData = parseApprovalTransactionData(
          txData as `0x${string}`,
        );
        if (approvalData?.tokenAddress) {
          return {
            alertSkipReason: reason,
            tokenAddressOverride: approvalData.tokenAddress,
          };
        }
      }
    }

    return { alertSkipReason: reason, tokenAddressOverride: undefined };
  }, [currentConfirmation]);

  const { isNFT: isNFTFromTxTo, pending: isNFTPendingFromTxTo } = useIsNFT(
    currentConfirmation as TransactionMeta,
  );

  const transactionMeta = currentConfirmation as TransactionMeta;
  const { value: tokenDetails, pending: isTokenDetailsPending } =
    useAsyncResult(async () => {
      if (!tokenAddressOverride) {
        return null;
      }
      return await getTokenStandardAndDetailsByChain(
        tokenAddressOverride,
        transactionMeta?.txParams?.from as string,
        undefined,
        transactionMeta?.chainId as string,
      );
    }, [
      tokenAddressOverride,
      transactionMeta?.txParams?.from,
      transactionMeta?.chainId,
    ]);

  const isSafeToSkipAlert = useMemo(() => {
    if (alertSkipReason === AlertSkipReason.ZeroValue) {
      return true;
    }
    if (alertSkipReason === AlertSkipReason.ZeroValueUnlessNFT) {
      if (tokenAddressOverride) {
        const isNFT = tokenDetails?.standard !== TokenStandard.ERC20;
        return !isTokenDetailsPending && !isNFT;
      }
      return !isNFTPendingFromTxTo && !isNFTFromTxTo;
    }
    return false;
  }, [
    alertSkipReason,
    tokenAddressOverride,
    tokenDetails,
    isTokenDetailsPending,
    isNFTFromTxTo,
    isNFTPendingFromTxTo,
  ]);

  const spenderAddress = useMemo(() => {
    if (!currentConfirmation) {
      return null;
    }

    // Handle approval transactions
    const txMeta = currentConfirmation as TransactionMeta;
    const txData = txMeta.txParams?.data;

    if (txData) {
      const approvalData = parseApprovalTransactionData(
        txData as `0x${string}`,
      );
      if (approvalData?.spender) {
        return approvalData.spender;
      }
    }

    return null;
  }, [currentConfirmation]);

  const { state: trustSignalDisplayState } = useTrustSignal(
    spenderAddress || '',
    NameType.ETHEREUM_ADDRESS,
    currentConfirmation?.chainId,
  );

  return useMemo(() => {
    if (!spenderAddress || isSafeToSkipAlert) {
      return [];
    }

    const alerts: Alert[] = [];

    if (trustSignalDisplayState === TrustSignalDisplayState.Malicious) {
      alerts.push({
        actions: [],
        field: RowAlertKey.Spender,
        isBlocking: false,
        key: 'spenderTrustSignalMalicious',
        message: t('alertMessageAddressTrustSignalMalicious'),
        reason: t('nameModalTitleMalicious'),
        severity: Severity.Danger,
      });
    } else if (trustSignalDisplayState === TrustSignalDisplayState.Warning) {
      alerts.push({
        actions: [],
        field: RowAlertKey.Spender,
        isBlocking: false,
        key: 'spenderTrustSignalWarning',
        message: t('alertMessageAddressTrustSignal'),
        reason: t('nameModalTitleWarning'),
        severity: Severity.Warning,
      });
    }

    return alerts;
  }, [spenderAddress, isSafeToSkipAlert, trustSignalDisplayState, t]);
}
