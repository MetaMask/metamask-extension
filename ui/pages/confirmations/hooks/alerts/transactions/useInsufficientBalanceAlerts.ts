import { CaipChainId, Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { sumHexes } from '../../../../../../shared/modules/conversion.utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import {
  getMultichainNetworkConfigurationsByChainId,
  getUseTransactionSimulations,
  selectTransactionAvailableBalance,
  selectTransactionFeeById,
  selectTransactionValue,
} from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { isBalanceSufficient } from '../../../send/send.utils';
import { useConfirmContext } from '../../../context/confirm';

export function useInsufficientBalanceAlerts({
  ignoreGasFeeToken,
}: {
  ignoreGasFeeToken?: boolean;
} = {}): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    id: transactionId,
    chainId,
    selectedGasFeeToken,
    gasFeeTokens,
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? 0x0,
    ) ?? [];

  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const balance = useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId, chainId),
  );

  const value = useSelector((state) =>
    selectTransactionValue(state, transactionId),
  );

  const totalValue = sumHexes(value, ...batchTransactionValues);

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const nativeCurrency = (
    multichainNetworks[chainId as CaipChainId] ?? evmNetworks[chainId]
  )?.nativeCurrency;

  const insufficientBalance = !isBalanceSufficient({
    amount: totalValue,
    gasTotal: hexMaximumTransactionFee,
    balance,
  });

  const canSkipSimulationChecks = ignoreGasFeeToken || !isSimulationEnabled;
  const hasGaslessSimulationFinished =
    canSkipSimulationChecks || Boolean(gasFeeTokens);

  const showAlert =
    insufficientBalance &&
    hasGaslessSimulationFinished &&
    (ignoreGasFeeToken || !selectedGasFeeToken);

  return useMemo(() => {
    if (!showAlert) {
      return [];
    }

    return [
      {
        actions: [
          {
            key: AlertActionKey.Buy,
            label: t('alertActionBuyWithNativeCurrency', [nativeCurrency]),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'insufficientBalance',
        message: t('alertMessageInsufficientBalanceWithNativeCurrency', [
          nativeCurrency,
        ]),
        reason: t('alertReasonInsufficientBalance'),
        severity: Severity.Danger,
      },
    ];
  }, [nativeCurrency, showAlert, t]);
}
