import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  currentConfirmationSelector,
  getNetworkIdentifier,
  selectTransactionAvailableBalance,
  selectTransactionFeeById,
  selectTransactionValue,
} from '../../../../../selectors';
import { isBalanceSufficient } from '../../../send/send.utils';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { getNativeCurrency } from '../../../../../ducks/metamask/metamask';
import { NETWORK_TO_NAME_MAP } from '../../../../../../shared/constants/network';

export function useInsufficientBalanceAlerts(): Alert[] {
  const t = useI18nContext();
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const { id: transactionId, chainId } = currentConfirmation ?? {};
  const nativeCurrency = useSelector(getNativeCurrency);
  const networkIdentifier = useSelector(getNetworkIdentifier);

  const balance = useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId),
  );

  const value = useSelector((state) =>
    selectTransactionValue(state, transactionId),
  );

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const networkName =
    (NETWORK_TO_NAME_MAP as Record<string, string>)[chainId as string] ||
    networkIdentifier;

  const insufficientBalance = !isBalanceSufficient({
    amount: value,
    gasTotal: hexMaximumTransactionFee,
    balance,
  });

  return useMemo(() => {
    if (!insufficientBalance) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.Buy,
            label: t('alertActionBuy'),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'insufficientBalance',
        message: t('insufficientCurrencyBuyOrDeposit', [
          nativeCurrency,
          networkName,
          t('buyAsset', [nativeCurrency]),
        ]),
        reason: t('alertReasonInsufficientBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [insufficientBalance]);
}
