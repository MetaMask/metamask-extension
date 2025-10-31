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

/**
 * Hook to generate alerts for spender addresses in approval transactions and permit signatures.
 * Supports both warning and malicious states using the trust signals system.
 *
 * @returns Array of alerts for spender addresses
 */
export function useSpenderAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (PRIMARY_TYPES_PERMIT.includes(primaryType as any)) {
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
    if (!spenderAddress) {
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
  }, [spenderAddress, trustSignalDisplayState, t]);
}
