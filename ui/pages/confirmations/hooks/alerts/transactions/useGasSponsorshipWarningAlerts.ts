'use no memo';

import {
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessSupported } from '../../gas/useIsGaslessSupported';

type SponsorshipWarningRule = {
  messageKey: string;
  minBalance: string;
  nativeCurrency: string;
  matchers: string[];
};

type SimulationDataWithCallTraceErrors = SimulationData & {
  callTraceErrors?: string[];
};

const GAS_SPONSORSHIP_WARNING_RULES: Partial<
  Record<Hex, SponsorshipWarningRule>
> = {
  [CHAIN_IDS.MONAD]: {
    messageKey: 'gasSponsorshipReserveBalanceWarning',
    minBalance: '10',
    nativeCurrency: 'MON',
    matchers: ['reserve balance violation'],
  },
};

/**
 * Checks if the callTraceErrors match any sponsorship warning rules for the given chain.
 *
 * @param callTraceErrors - Array of error messages from simulation
 * @param chainId - The chain ID of the transaction
 * @returns True if a matching rule is found, false otherwise
 */
function hasGasSponsorshipWarning(
  callTraceErrors: string[] | undefined,
  chainId: Hex,
): boolean {
  if (!callTraceErrors?.length) {
    return false;
  }

  const rule = GAS_SPONSORSHIP_WARNING_RULES[chainId];
  if (!rule) {
    return false;
  }

  const normalizedErrors = callTraceErrors.map((error) => error.toLowerCase());
  return rule.matchers.some((matcher) =>
    normalizedErrors.some((error) => error.includes(matcher)),
  );
}

/**
 * Hook that returns an alert when gas sponsorship fails due to reserve balance requirements.
 *
 * This hook checks for specific error patterns in the transaction simulation's callTraceErrors
 * and displays a warning alert when sponsorship is unavailable due to insufficient reserve balance.
 *
 * Currently configured for Monad network which requires a minimum of 10 MON in the account
 * for gas sponsorship to work.
 *
 * @returns An array containing a warning alert if sponsorship failed, empty array otherwise
 */
export function useGasSponsorshipWarningAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, isGasFeeSponsored, simulationData } =
    currentConfirmation ?? {};
  const { isSupported: isGaslessSupported } = useIsGaslessSupported();

  const callTraceErrors = (
    simulationData as SimulationDataWithCallTraceErrors | undefined
  )?.callTraceErrors;

  // Use primitive boolean to avoid object reference changes on every render
  const hasWarning = useMemo(
    () =>
      chainId ? hasGasSponsorshipWarning(callTraceErrors, chainId) : false,
    [callTraceErrors, chainId],
  );

  // Only show warning when:
  // 1. We have a warning match from configured rules
  // 2. Gas fee is NOT currently sponsored (the warning explains why)
  // 3. Gasless is supported on this network (otherwise sponsorship wouldn't be expected)
  const shouldShow = hasWarning && !isGasFeeSponsored && isGaslessSupported;

  return useMemo(() => {
    if (!shouldShow || !chainId) {
      return [];
    }

    const rule = GAS_SPONSORSHIP_WARNING_RULES[chainId];
    if (!rule) {
      return [];
    }

    const message = t(rule.messageKey, [rule.minBalance, rule.nativeCurrency]);

    return [
      {
        field: RowAlertKey.EstimatedFee,
        inlineAlertText: message,
        isOpenModalOnClick: false,
        key: 'gasSponsorshipReserveBalanceWarning',
        message,
        reason: t('alertReasonGasSponsorshipUnavailable'),
        severity: Severity.Warning,
        showArrow: false,
      },
    ];
  }, [shouldShow, chainId, t]);
}
