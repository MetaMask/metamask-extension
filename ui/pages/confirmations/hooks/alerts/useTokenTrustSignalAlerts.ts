import { useMemo } from 'react';
import {
  SimulationTokenStandard,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../context/confirm';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// eslint-disable-next-line import/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';
import { useTokenTrustSignalsForAddresses } from '../../../../hooks/useTokenTrustSignals';

// Stable references to prevent infinite re-renders
const EMPTY_ALERTS: Alert[] = [];
const EMPTY_ACTIONS: Alert['actions'] = [];

export function useTokenTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const txMeta = currentConfirmation as TransactionMeta | undefined;
  const chainId = txMeta?.chainId;
  const tokenBalanceChanges = txMeta?.simulationData?.tokenBalanceChanges;

  // Stable, deduped list of incoming ERC-20 token addresses (lowercased)
  const incomingTokenAddresses = useMemo<string[] | undefined>(() => {
    if (!tokenBalanceChanges?.length) {
      return undefined;
    }
    const dedup = new Set<string>();
    for (const change of tokenBalanceChanges) {
      if (
        !change.isDecrease &&
        change.standard === SimulationTokenStandard.erc20 &&
        change.address
      ) {
        dedup.add(change.address.toLowerCase());
      }
    }
    return dedup.size ? Array.from(dedup) : undefined;
  }, [tokenBalanceChanges]);

  // Hooks must remain unconditional; this hook should handle undefined args internally.
  const tokenTrustSignals = useTokenTrustSignalsForAddresses(
    chainId,
    incomingTokenAddresses,
  );

  return useMemo(() => {
    if (!isSecurityAlertsAPIEnabled() || !incomingTokenAddresses?.length) {
      return EMPTY_ALERTS; // Use stable reference instead of []
    }

    const hasMaliciousToken = tokenTrustSignals?.some(
      (s) => s.state === TrustSignalDisplayState.Malicious,
    );
    const hasWarningToken = tokenTrustSignals?.some(
      (s) => s.state === TrustSignalDisplayState.Warning,
    );

    if (hasMaliciousToken) {
      return [
        {
          actions: EMPTY_ACTIONS,
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'tokenTrustSignalMalicious',
          message: t('alertMessageTokenTrustSignalMalicious'),
          reason: t('alertReasonTokenTrustSignalMalicious'),
          severity: Severity.Danger,
        },
      ];
    } else if (hasWarningToken) {
      return [
        {
          actions: EMPTY_ACTIONS,
          field: RowAlertKey.EstimatedChangesStatic,
          isBlocking: false,
          key: 'tokenTrustSignalWarning',
          message: t('alertMessageTokenTrustSignalWarning'),
          reason: t('alertReasonTokenTrustSignalWarning'),
          severity: Severity.Warning,
        },
      ];
    }

    return EMPTY_ALERTS; // Use stable reference instead of []
  }, [incomingTokenAddresses, tokenTrustSignals, t]);
}
