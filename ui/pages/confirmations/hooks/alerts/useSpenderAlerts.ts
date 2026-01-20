import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { TransactionMeta } from '@metamask/transaction-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { isSignatureTransactionType } from '../../utils';
import { SignatureRequestType } from '../../types/confirm';
import {
  parseTypedDataMessage,
  parseApprovalTransactionData,
} from '../../../../../shared/modules/transaction.utils';
import { PRIMARY_TYPES_PERMIT } from '../../../../../shared/constants/signatures';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { useIsNFT } from '../../components/confirm/info/approve/hooks/use-is-nft';
import { DAI_CONTRACT_ADDRESS } from '../../components/confirm/info/shared/constants';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';
import { TokenStandard } from '../../../../../shared/constants/transaction';

function isZeroAmount(amount: string | number | undefined): boolean {
  return amount === '0' || amount === 0;
}

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

  if (
    isSignatureTransactionType(currentConfirmation) &&
    currentConfirmation.type === 'eth_signTypedData'
  ) {
    const signatureRequest = currentConfirmation as SignatureRequestType;
    const msgData = signatureRequest.msgParams?.data as string;

    if (msgData) {
      const { primaryType, message, domain } = parseTypedDataMessage(msgData);
      const isPermit = PRIMARY_TYPES_PERMIT.some(
        (type) => type === primaryType,
      );

      if (isPermit) {
        const isDaiPermit =
          domain?.verifyingContract?.toLowerCase() ===
          DAI_CONTRACT_ADDRESS.toLowerCase();

        const isZeroValuePermit = isDaiPermit
          ? message?.allowed === false // DAI uses `allowed` boolean
          : isZeroAmount(message?.value); // Standard EIP-2612 uses `value`

        if (isZeroValuePermit) {
          return AlertSkipReason.ZeroValue;
        }
      }
    }
  }

  return AlertSkipReason.None;
}

/**
 * Hook to generate alerts for spender addresses in approval transactions and permit signatures.
 * Supports both warning and malicious states using the trust signals system.
 * Skips alerts for zero-value operations (revocations or zero-amount permits) since they pose no risk.
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
    }, [tokenAddressOverride]);

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
    const transactionMeta = currentConfirmation as TransactionMeta;
    const txData = transactionMeta.txParams?.data;

    if (txData) {
      const approvalData = parseApprovalTransactionData(
        txData as `0x${string}`,
      );
      if (approvalData?.spender) {
        return approvalData.spender;
      }
    }
    // Handle permit signatures
    else if (
      isSignatureTransactionType(currentConfirmation) &&
      currentConfirmation.type === 'eth_signTypedData'
    ) {
      const signatureRequest = currentConfirmation as SignatureRequestType;
      const msgData = signatureRequest.msgParams?.data as string;

      if (msgData) {
        const typedDataMessage = parseTypedDataMessage(msgData);
        const { primaryType } = typedDataMessage;

        if (PRIMARY_TYPES_PERMIT.some((type) => type === primaryType)) {
          return typedDataMessage.message?.spender || null;
        }
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
