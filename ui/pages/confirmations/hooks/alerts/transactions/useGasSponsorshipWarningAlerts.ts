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
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/modules/selectors/networks';
import { useConfirmContext } from '../../../context/confirm';
import { useSelector } from 'react-redux';

type SponsorshipWarningRule = {
  messageKey: string;
  minBalance: string;
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
    matchers: ['reserve balance violation'],
  },
};

function getGasSponsorshipWarning({
  callTraceErrors,
  chainId,
  nativeTokenSymbol,
  t,
}: {
  callTraceErrors?: string[];
  chainId: Hex;
  nativeTokenSymbol: string;
  t: ReturnType<typeof useI18nContext>;
}): string | null {
  if (!callTraceErrors?.length) {
    return null;
  }

  const rule = GAS_SPONSORSHIP_WARNING_RULES[chainId];
  if (!rule) {
    return null;
  }

  const normalizedErrors = callTraceErrors.map((error) => error.toLowerCase());
  const hasMatch = rule.matchers.some((matcher) =>
    normalizedErrors.some((error) => error.includes(matcher)),
  );

  if (!hasMatch) {
    return null;
  }

  return t(rule.messageKey, [rule.minBalance, nativeTokenSymbol]);
}

export function useGasSponsorshipWarningAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, isGasFeeSponsored, simulationData } =
    currentConfirmation ?? {};
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const nativeTokenSymbol = chainId
    ? (networkConfigurations?.[chainId]?.nativeCurrency ?? '')
    : '';

  const callTraceErrors = (
    simulationData as SimulationDataWithCallTraceErrors | undefined
  )?.callTraceErrors;

  const message =
    chainId && nativeTokenSymbol
      ? getGasSponsorshipWarning({
          callTraceErrors,
          chainId,
          nativeTokenSymbol,
          t,
        })
      : null;

  const shouldShow = Boolean(message) && !isGasFeeSponsored;

  return useMemo(() => {
    if (!shouldShow || !message) {
      return [];
    }

    return [
      {
        field: RowAlertKey.EstimatedFee,
        inlineAlertText: message,
        isOpenModalOnClick: false,
        key: 'gasSponsorshipReserveBalanceWarning',
        message,
        severity: Severity.Warning,
        showArrow: false,
      },
    ];
  }, [message, shouldShow]);
}
