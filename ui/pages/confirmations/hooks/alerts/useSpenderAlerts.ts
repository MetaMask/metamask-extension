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
import { DAI_CONTRACT_ADDRESS } from '../../components/confirm/info/shared/constants';
import { useIsNFT } from '../../components/confirm/info/approve/hooks/use-is-nft';

enum RevokeStatus {
  NotRevoke = 'not-revoke',
  Revoke = 'revoke',
  RevokeUnlessNFT = 'revoke-unless-nft',
}

function getRevokeStatus(
  currentConfirmation: TransactionMeta | SignatureRequestType | undefined,
): RevokeStatus {
  if (!currentConfirmation) {
    return RevokeStatus.NotRevoke;
  }

  const transactionMeta = currentConfirmation as TransactionMeta;
  const txData = transactionMeta.txParams?.data;

  if (txData) {
    const approvalData = parseApprovalTransactionData(txData as `0x${string}`);
    if (approvalData?.isRevokeAll) {
      return RevokeStatus.Revoke;
    }
    if (approvalData?.amountOrTokenId?.isZero()) {
      return RevokeStatus.RevokeUnlessNFT;
    }
    return RevokeStatus.NotRevoke;
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
        const isDaiRevoke =
          message?.allowed === false &&
          domain?.verifyingContract?.toLowerCase() ===
            DAI_CONTRACT_ADDRESS.toLowerCase();
        const isZeroValuePermit =
          message?.value === '0' || message?.value === 0;

        if (isDaiRevoke || isZeroValuePermit) {
          return RevokeStatus.Revoke;
        }
      }
    }
  }

  return RevokeStatus.NotRevoke;
}

/**
 * Hook to generate alerts for spender addresses in approval transactions and permit signatures.
 * Supports both warning and malicious states using the trust signals system.
 * Does not return alerts for revoke operations since revoking is the safe action.
 *
 * @returns Array of alerts for spender addresses
 */
export function useSpenderAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const revokeStatus = useMemo(
    () => getRevokeStatus(currentConfirmation),
    [currentConfirmation],
  );

  const { isNFT, pending: isNFTPending } = useIsNFT(
    currentConfirmation as TransactionMeta,
  );

  const isRevoke = useMemo(() => {
    if (revokeStatus === RevokeStatus.Revoke) {
      return true;
    }
    if (revokeStatus === RevokeStatus.RevokeUnlessNFT) {
      return !isNFTPending && !isNFT;
    }
    return false;
  }, [revokeStatus, isNFT, isNFTPending]);

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
    if (!spenderAddress || isRevoke) {
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
  }, [spenderAddress, isRevoke, trustSignalDisplayState, t]);
}
