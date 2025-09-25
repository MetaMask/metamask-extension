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
import { useTokenTrustSignalsForAddresses } from '../../../../hooks/useTokenTrustSignals';

const EMPTY_ALERTS: Alert[] = [];
const EMPTY_ACTIONS: Alert['actions'] = [];

export function useTokenTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const txMeta = currentConfirmation as TransactionMeta | undefined;
  const chainId = txMeta?.chainId;
  const tokenBalanceChanges = txMeta?.simulationData?.tokenBalanceChanges;

  const incomingTokenAddresses = useMemo<string[] | undefined>(() => {
    if (!tokenBalanceChanges?.length) {
      return undefined;
    }
    const addresses = tokenBalanceChanges
      .filter(
        (change) =>
          !change.isDecrease &&
          change.standard === SimulationTokenStandard.erc20 &&
          change.address,
      )
      .map((change) => change.address.toLowerCase());
    return addresses.length ? addresses : undefined;
  }, [tokenBalanceChanges]);

  const tokenTrustSignals = useTokenTrustSignalsForAddresses(
    chainId,
    incomingTokenAddresses,
  );

  return useMemo(() => {
    if (!incomingTokenAddresses?.length) {
      return EMPTY_ALERTS;
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
          field: RowAlertKey.IncomingTokens,
          isBlocking: false,
          key: 'tokenTrustSignalMalicious',
          message: t('alertMessageTokenTrustSignalMalicious'),
          reason: t('alertReasonTokenTrustSignalMalicious'),
          severity: Severity.Danger,
        },
      ];
    }
    if (hasWarningToken) {
      return [
        {
          actions: EMPTY_ACTIONS,
          field: RowAlertKey.IncomingTokens,
          isBlocking: false,
          key: 'tokenTrustSignalWarning',
          message: t('alertMessageTokenTrustSignalWarning'),
          reason: t('alertReasonTokenTrustSignalWarning'),
          severity: Severity.Warning,
        },
      ];
    }

    return EMPTY_ALERTS;
  }, [incomingTokenAddresses, tokenTrustSignals, t]);
}
