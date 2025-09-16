import { useMemo } from 'react';
import {
  TransactionMeta,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useTokenTrustSignals } from '../../../../hooks/useTokenTrustSignals';

export function useTokenTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const txMeta = currentConfirmation as TransactionMeta;
  const chainId = txMeta?.chainId;

  // Get token balance changes from simulation data
  const tokenBalanceChanges = txMeta?.simulationData?.tokenBalanceChanges || [];

  // Filter for incoming tokens (positive balance changes) and ERC20 tokens only
  const incomingTokens = useMemo(() => {
    return tokenBalanceChanges
      .filter(
        (change) =>
          !change.isDecrease &&
          change.standard === SimulationTokenStandard.erc20,
      )
      .map((change) => change.address.toLowerCase());
  }, [tokenBalanceChanges]);

  // Check trust signals for all incoming tokens
  const tokenTrustSignals = incomingTokens.map((tokenAddress) => {
    const { state } = useTokenTrustSignals(chainId, tokenAddress);
    return { tokenAddress, state };
  });

  return useMemo(() => {
    if (!chainId || incomingTokens.length === 0) {
      return [];
    }

    const alerts: Alert[] = [];

    // Check each incoming token for trust signal alerts
    tokenTrustSignals.forEach(({ tokenAddress, state }) => {
      if (state === TrustSignalDisplayState.Malicious) {
        alerts.push({
          key: `tokenTrustSignalMalicious-${tokenAddress}`,
          reason: t('alertReasonTokenTrustSignalMalicious'),
          field: RowAlertKey.IncomingTokens,
          severity: Severity.Danger,
          message: t('alertMessageTokenTrustSignalMalicious'),
        });
      } else if (state === TrustSignalDisplayState.Warning) {
        alerts.push({
          key: `tokenTrustSignalWarning-${tokenAddress}`,
          reason: t('alertReasonTokenTrustSignalWarning'),
          field: RowAlertKey.IncomingTokens,
          severity: Severity.Warning,
          message: t('alertMessageTokenTrustSignalWarning'),
        });
      }
    });

    return alerts;
  }, [chainId, incomingTokens, tokenTrustSignals, t]);
}
