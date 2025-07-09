import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';

import { useSelector } from 'react-redux';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { getInternalAccounts } from '../../../../../selectors';
import { useTransferRecipient } from '../../../components/confirm/info/hooks/useTransferRecipient';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../../hooks/useTrustSignals';

export function useFirstTimeInteractionAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const internalAccounts = useSelector(getInternalAccounts);
  const to = useTransferRecipient();
  const { isFirstTimeInteraction } = currentConfirmation ?? {};

  const isInternalAccount = internalAccounts.some(
    (account) => account.address?.toLowerCase() === to?.toLowerCase(),
  );

  const { state: trustSignalDisplayState } = useTrustSignal(
    to || '',
    NameType.ETHEREUM_ADDRESS,
  );

  const isVerifiedAddress =
    trustSignalDisplayState === TrustSignalDisplayState.Verified;

  const showAlert =
    !isInternalAccount && isFirstTimeInteraction && !isVerifiedAddress;

  return useMemo(() => {
    // If isFirstTimeInteraction is undefined that means it's either disabled or error in accounts API
    // If it's false that means account relationship found
    if (!showAlert) {
      return [];
    }

    return [
      {
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'firstTimeInteractionTitle',
        message: t('alertMessageFirstTimeInteraction'),
        reason: t('alertReasonFirstTimeInteraction'),
        severity: Severity.Warning,
      },
    ];
  }, [showAlert, t]);
}
