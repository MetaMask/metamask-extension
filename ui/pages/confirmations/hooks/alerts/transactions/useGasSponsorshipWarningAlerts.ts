import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { MONAD_RESERVE_BALANCE_MON } from '../../../../../../shared/lib/monad-reserve-balance';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { useIsMonadReserveViolation } from './useIsMonadReserveViolation';

type SponsorshipWarningRule = {
  messageKey: string;
  titleKey: string;
  minBalance: string;
  nativeCurrency: string;
};

const GAS_SPONSORSHIP_WARNING_RULES: Partial<
  Record<Hex, SponsorshipWarningRule>
> = {
  [CHAIN_IDS.MONAD]: {
    messageKey: 'gasSponsorshipReserveBalanceWarning',
    titleKey: 'alertMinimumReserve',
    minBalance: MONAD_RESERVE_BALANCE_MON,
    nativeCurrency: 'MON',
  },
  [CHAIN_IDS.MONAD_TESTNET]: {
    messageKey: 'gasSponsorshipReserveBalanceWarning',
    titleKey: 'alertMinimumReserve',
    minBalance: MONAD_RESERVE_BALANCE_MON,
    nativeCurrency: 'MON',
  },
};

/**
 * Hook that returns an alert when a Monad reserve-balance requirement would be
 * violated (protocol rule, not only gas-sponsorship UX).
 *
 * Sources:
 * - Simulation `callTraceErrors` / `simulationFails` containing
 * `"reserve balance violation"`
 * - Proactive check: delegated account with `value > 0` and `balance - value < 10 MON`
 * (gas may come from the reserve; a zero value does not decrement the balance)
 *
 * Shown whenever the reserve would fail, including when gas is sponsored.
 *
 * @returns An array containing a blocking danger alert if reserve would fail
 */
export function useGasSponsorshipWarningAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const chainId = currentConfirmation?.chainId;
  const hasWarning = useIsMonadReserveViolation();

  return useMemo(() => {
    if (!hasWarning || !chainId) {
      return [];
    }

    const rule = GAS_SPONSORSHIP_WARNING_RULES[chainId as Hex];
    if (!rule) {
      return [];
    }

    const message = t(rule.messageKey, [rule.minBalance, rule.nativeCurrency]);
    const reason = t(rule.titleKey);

    return [
      {
        actions: [
          {
            key: AlertActionKey.Buy,
            label: t('alertActionBuyWithNativeCurrency', [rule.nativeCurrency]),
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isOpenModalOnClick: true,
        key: 'gasSponsorshipAlert',
        message,
        reason,
        severity: Severity.Danger,
        isBlocking: true,
        showArrow: false,
      },
    ];
  }, [hasWarning, chainId, t]);
}
