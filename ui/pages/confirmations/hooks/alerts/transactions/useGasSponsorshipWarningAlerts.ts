import {
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import {
  hasMonadReserveBalanceRule,
  hasMonadReserveBalanceViolation,
  MONAD_RESERVE_BALANCE_MON,
} from '../../../../../../shared/lib/monad-reserve-balance';
import { sumHexes } from '../../../../../../shared/lib/conversion.utils';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getNativeTokenCachedBalanceByChainIdSelector } from '../../../../../selectors';
import { useConfirmContext } from '../../../context/confirm';

type SponsorshipWarningRule = {
  messageKey: string;
  titleKey: string;
  minBalance: string;
  nativeCurrency: string;
};

type SimulationDataWithCallTraceErrors = SimulationData & {
  callTraceErrors?: string[];
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

const ZERO_HEX_FALLBACK = '0x0';

/**
 * Hook that returns an alert when a Monad reserve-balance requirement would be
 * violated (protocol rule, not only gas-sponsorship UX).
 *
 * Sources:
 * - Simulation `callTraceErrors` / `simulationFails` containing
 * `"reserve balance violation"`
 * - Proactive check: `balance - value < 10 MON` (gas may come from the reserve)
 *
 * Shown whenever the tx is not gas-sponsored. Previously gated on gasless
 * support, which hid the correct alert for hardware wallets and other
 * non-relay paths and let the generic "insufficient network fees" message win.
 *
 * @returns An array containing a blocking danger alert if reserve would fail
 */
export function useGasSponsorshipWarningAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    chainId,
    isGasFeeSponsored,
    simulationData,
    simulationFails,
    txParams: { value = ZERO_HEX_FALLBACK, from: fromAddress = '' } = {},
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? ZERO_HEX_FALLBACK,
    ) ?? [];

  const chainBalances = useSelector((state) =>
    getNativeTokenCachedBalanceByChainIdSelector(state, fromAddress ?? ''),
  ) as Record<Hex, Hex>;

  const balance =
    chainId && Object.hasOwn(chainBalances ?? {}, chainId)
      ? (chainBalances?.[chainId as Hex] ?? ZERO_HEX_FALLBACK)
      : undefined;

  const totalValue = sumHexes(value, ...batchTransactionValues);

  const hasWarning = useMemo(() => {
    if (!chainId || !hasMonadReserveBalanceRule(chainId)) {
      return false;
    }

    return hasMonadReserveBalanceViolation({
      chainId,
      balance,
      value: totalValue,
      simulationData: simulationData as
        | SimulationDataWithCallTraceErrors
        | undefined,
      simulationFails,
    });
  }, [balance, chainId, simulationData, simulationFails, totalValue]);

  // Show when reserve would fail and sponsorship is not covering gas. Do not
  // require gasless support — the reserve is a protocol rule for all account types.
  const shouldShow = hasWarning && !isGasFeeSponsored;

  return useMemo(() => {
    if (!shouldShow || !chainId) {
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
  }, [shouldShow, chainId, t]);
}
