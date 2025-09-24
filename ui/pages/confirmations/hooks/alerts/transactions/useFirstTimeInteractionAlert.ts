import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';

import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../../context/confirm';
import { getInternalAccounts } from '../../../../../selectors';
import { useTransferRecipient } from '../../../components/confirm/info/hooks/useTransferRecipient';
import {
  useTrustSignals,
  TrustSignalDisplayState,
} from '../../../../../hooks/useTrustSignals';
import { getExperience } from '../../../../../../shared/constants/verification';

export function useFirstTimeInteractionAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const internalAccounts = useSelector(getInternalAccounts);
  const recipient = useTransferRecipient();
  const { isFirstTimeInteraction, chainId, txParams } =
    currentConfirmation ?? {};
  const transactionTo = txParams?.to;

  const isInternalAccount = internalAccounts.some(
    (account) => account.address?.toLowerCase() === recipient?.toLowerCase(),
  );

  const trustSignalRequests = [
    { value: transactionTo || '', type: NameType.ETHEREUM_ADDRESS },
  ];

  if (recipient !== transactionTo) {
    trustSignalRequests.push({
      value: recipient || '',
      type: NameType.ETHEREUM_ADDRESS,
    });
  }

  const trustSignalResults = useTrustSignals(trustSignalRequests);

  const hasAnyLoadingTrustSignal = trustSignalResults.some(
    (result) => result.state === TrustSignalDisplayState.Loading,
  );

  const isAllAddressesVerified = trustSignalResults.every(
    (result) => result.state === TrustSignalDisplayState.Verified,
  );

  const isFirstPartyContract = Boolean(
    getExperience(txParams?.to as Hex, chainId),
  );

  console.log(
    'OGO - showAlert',
    JSON.stringify(
      {
        isInternalAccount,
        isFirstTimeInteraction,
        isAllAddressesVerified,
        isFirstPartyContract,
        hasAnyLoadingTrustSignal,
        trustSignalResults,
      },
      null,
      2,
    ),
  );

  const showAlert =
    !isInternalAccount &&
    isFirstTimeInteraction &&
    !isAllAddressesVerified &&
    !isFirstPartyContract &&
    !hasAnyLoadingTrustSignal;

  return useMemo(() => {
    // If isFirstTimeInteraction is undefined that means it's either disabled or error in accounts API
    // If it's false that means account relationship found
    // If trust signal is loading, we wait for it to complete before showing any alerts
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
