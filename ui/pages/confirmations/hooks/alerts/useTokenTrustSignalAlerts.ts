import { useMemo } from 'react';
import { useSelector } from 'react-redux';
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
import { getTokenScanCacheResult } from '../../../../selectors/selectors';

type TokenScanCacheResult = {
  data: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type?: string;
  };
  timestamp?: number;
};

function getTrustState(
  cachedResult: TokenScanCacheResult | undefined,
): TrustSignalDisplayState {
  const resultType = cachedResult?.data?.result_type;

  if (!resultType) {
    return TrustSignalDisplayState.Unknown;
  }

  switch (resultType.toLowerCase()) {
    case 'malicious':
      return TrustSignalDisplayState.Malicious;
    case 'warning':
    case 'suspicious':
      return TrustSignalDisplayState.Warning;
    case 'benign':
    case 'verified':
      return TrustSignalDisplayState.Verified;
    default:
      return TrustSignalDisplayState.Unknown;
  }
}

export function useTokenTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const txMeta = currentConfirmation as TransactionMeta;
  const chainId = txMeta?.chainId;

  // Get token balance changes from simulation data
  const tokenBalanceChanges = txMeta?.simulationData?.tokenBalanceChanges || [];

  // Filter for incoming tokens (positive balance changes) and ERC20 tokens only
  const incomingTokens = useMemo(() => {
    if (!tokenBalanceChanges || tokenBalanceChanges.length === 0) {
      return [];
    }

    return tokenBalanceChanges
      .filter(
        (change) =>
          !change.isDecrease &&
          change.standard === SimulationTokenStandard.erc20,
      )
      .map((change) => change.address.toLowerCase());
  }, [tokenBalanceChanges]);

  // Use a selector hook for each token to get their trust states
  const tokenTrustStates = useSelector((state) => {
    if (!chainId || !incomingTokens || incomingTokens.length === 0) {
      return [];
    }

    return incomingTokens.map((tokenAddress) => {
      const cachedResult = getTokenScanCacheResult(
        state,
        chainId,
        tokenAddress,
      );
      return {
        tokenAddress,
        trustState: getTrustState(cachedResult),
      };
    });
  });

  return useMemo(() => {
    if (!chainId || !tokenTrustStates || tokenTrustStates.length === 0) {
      return [];
    }

    const alerts: Alert[] = [];

    // Check each incoming token for trust signal alerts
    tokenTrustStates.forEach(({ tokenAddress, trustState }) => {
      if (trustState === TrustSignalDisplayState.Malicious) {
        alerts.push({
          key: `tokenTrustSignalMalicious-${tokenAddress}`,
          reason: t('alertReasonTokenTrustSignalMalicious'),
          field: RowAlertKey.IncomingTokens,
          severity: Severity.Danger,
          isBlocking: false,
          message: t('alertMessageTokenTrustSignalMalicious'),
        });
      } else if (trustState === TrustSignalDisplayState.Warning) {
        alerts.push({
          key: `tokenTrustSignalWarning-${tokenAddress}`,
          reason: t('alertReasonTokenTrustSignalWarning'),
          field: RowAlertKey.IncomingTokens,
          severity: Severity.Warning,
          isBlocking: false,
          message: t('alertMessageTokenTrustSignalWarning'),
        });
      }
    });

    return alerts;
  }, [chainId, tokenTrustStates, t]);
}
