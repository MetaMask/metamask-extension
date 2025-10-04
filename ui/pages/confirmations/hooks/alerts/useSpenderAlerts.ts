import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { isSignatureTransactionType } from '../../utils';
import { SignatureRequestType } from '../../types/confirm';
import {
  parseTypedDataMessage,
  parseApprovalTransactionData,
} from '../../../../../shared/modules/transaction.utils';
import { PRIMARY_TYPES_PERMIT } from '../../../../../shared/constants/signatures';
import { getAddressSecurityAlertResponse } from '../../../../selectors';
import {
  Alert,
  AlertSeverity,
} from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';

/**
 * Hook to generate alerts for malicious spender addresses in approval transactions and permit signatures.
 *
 * @returns Array of alerts for malicious spender addresses
 */
export function useSpenderAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const spenderAlert = useMemo(() => {
    if (!currentConfirmation) {
      return null;
    }

    let spenderAddress: string | undefined;

    // Handle approval transactions
    if (
      currentConfirmation.type &&
      [
        TransactionType.tokenMethodApprove,
        TransactionType.tokenMethodIncreaseAllowance,
        TransactionType.tokenMethodSetApprovalForAll,
      ].includes(currentConfirmation.type as TransactionType)
    ) {
      const transactionMeta = currentConfirmation as TransactionMeta;
      const txData = transactionMeta.txParams?.data;

      if (txData) {
        const approvalData = parseApprovalTransactionData(
          txData as `0x${string}`,
        );
        spenderAddress = approvalData?.spender;
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
          spenderAddress = typedDataMessage.message?.spender;
        }
      }
    }

    if (!spenderAddress) {
      return null;
    }

    return { spenderAddress };
  }, [currentConfirmation]);

  // Get security alert response for the spender address
  const securityAlertResponse = useSelector((state) =>
    spenderAlert?.spenderAddress
      ? getAddressSecurityAlertResponse(state, spenderAlert.spenderAddress)
      : undefined,
  );

  return useMemo(() => {
    if (!spenderAlert?.spenderAddress || !securityAlertResponse) {
      return [];
    }

    // Only show alert for malicious addresses
    // eslint-disable-next-line @typescript-eslint/naming-convention
    if (securityAlertResponse.result_type !== 'Malicious') {
      return [];
    }

    const alert: Alert = {
      actions: [],
      field: RowAlertKey.Spender,
      isBlocking: false,
      key: 'spenderTrustSignalMalicious',
      message: t('alertMessageAddressTrustSignalMalicious'),
      reason: t('nameModalTitleMalicious'),
      severity: Severity.Danger as AlertSeverity,
    };

    return [alert];
  }, [t, spenderAlert?.spenderAddress, securityAlertResponse]);
}
