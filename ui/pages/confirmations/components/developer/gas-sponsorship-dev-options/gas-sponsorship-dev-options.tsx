import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';

import { Box, Text } from '../../../../../components/component-library';
import ToggleButton from '../../../../../components/ui/toggle-button';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';
import { getCurrencyRates } from '../../../../../selectors';
import { useGasSponsorshipCampaign } from '../../../hooks/gas/useGasSponsorshipCampaign';
import { useGasSponsorshipDevToggle } from '../../../hooks/gas/useGasSponsorshipDevToggle';
import {
  GAS_SPONSORSHIP_CAMPAIGN_ID,
  GAS_SPONSORSHIP_CAMPAIGN_NAME,
  GAS_SPONSORSHIP_SUPPORTED_CHAIN_ID,
  GAS_SPONSORSHIP_VAULT_ADDRESS_BASE,
} from '../../../../../../shared/constants/gas-sponsorship';
import { getNetworkConfigurationsByChainId } from '../../../../../../shared/lib/selectors/networks';

const WEI_PER_ETH = 10n ** 18n;
const WEI_PER_ETH_DECIMAL = new BigNumber(WEI_PER_ETH.toString());

function formatNativeBalance(wei: bigint): string {
  const whole = wei / WEI_PER_ETH;
  const fractional = (wei % WEI_PER_ETH)
    .toString()
    .padStart(18, '0')
    .slice(0, 6)
    .replace(/0+$/u, '');

  return fractional ? `${whole}.${fractional}` : whole.toString();
}

export const GasSponsorshipDevOptions = () => {
  const { enabled, setEnabled } = useGasSponsorshipDevToggle();
  const { campaign, error, pending } = useGasSponsorshipCampaign();
  const formatFiat = useFiatFormatter();
  const currencyRates = useSelector(getCurrencyRates);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const remainingBalanceWei = campaign?.remainingBalanceWei ?? 0n;
  const fiatBalance = useMemo(() => {
    const nativeCurrency =
      networkConfigurationsByChainId?.[GAS_SPONSORSHIP_SUPPORTED_CHAIN_ID]
        ?.nativeCurrency;
    const conversionRate = nativeCurrency
      ? currencyRates?.[nativeCurrency]?.conversionRate
      : undefined;

    if (!conversionRate || conversionRate <= 0) {
      return undefined;
    }

    const nativeBalance = new BigNumber(remainingBalanceWei.toString()).div(
      WEI_PER_ETH_DECIMAL,
    );
    const fiatAmount = nativeBalance.times(conversionRate);

    if (!fiatAmount.isFinite()) {
      return undefined;
    }

    return formatFiat(fiatAmount.toNumber());
  }, [
    currencyRates,
    formatFiat,
    networkConfigurationsByChainId,
    remainingBalanceWei,
  ]);

  let healthStatus = 'insufficient';
  if (pending) {
    healthStatus = 'loading';
  } else if (error) {
    healthStatus = 'error';
  } else if (remainingBalanceWei > 0n) {
    healthStatus = 'ready';
  }

  return (
    <>
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>Gas sponsorship (dev local)</span>
          <div className="settings-page__content-description">
            Enables the sponsorship route only in this local developer profile.
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <ToggleButton
            value={enabled}
            onToggle={() => setEnabled(!enabled)}
            offLabel="Off"
            onLabel="On"
            dataTestId="confirmations-gas-sponsorship-dev-toggle"
          />
        </div>
      </Box>
      <Box className="settings-page__content-padded" paddingBottom={4}>
        <Text variant={TextVariant.bodySm}>
          Campaign name: {GAS_SPONSORSHIP_CAMPAIGN_NAME}
        </Text>
        <Text variant={TextVariant.bodySm}>
          Campaign id: {GAS_SPONSORSHIP_CAMPAIGN_ID}
        </Text>
        <Text variant={TextVariant.bodySm}>
          Contract: {GAS_SPONSORSHIP_VAULT_ADDRESS_BASE}
        </Text>
        <Text variant={TextVariant.bodySm}>
          Balance: {remainingBalanceWei.toString()} wei (
          {formatNativeBalance(remainingBalanceWei)} ETH)
          {fiatBalance ? ` ~ ${fiatBalance}` : ''}
        </Text>
        <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
          Status: {healthStatus}
        </Text>
      </Box>
    </>
  );
};
