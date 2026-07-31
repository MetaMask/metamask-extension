import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { Hex } from '@metamask/utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain';
import { useMerklClaim } from './hooks/useMerklClaim';
import { useOnMerklClaimConfirmed } from './hooks/useOnMerklClaimConfirmed';
import {
  type MerklClaimBonusAnalyticsLocation,
  type MusdClaimBonusButtonClickedEventProperties,
  type MusdClaimBonusCtaDisplayedEventProperties,
} from './musd-events';

export const ClaimBonusBadge = ({
  label,
  tokenAddress,
  chainId,
  refetchRewards,
  analyticsLocation,
  assetSymbol,
  bonusAmountRange,
  hasClaimedBefore,
}: {
  label: string;
  tokenAddress: string;
  chainId: Hex;
  refetchRewards: () => void;
  analyticsLocation: MerklClaimBonusAnalyticsLocation;
  assetSymbol: string;
  bonusAmountRange: string;
  hasClaimedBefore: boolean;
}) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasFiredCtaDisplayedEvent = useRef(false);

  // Get network name for analytics
  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const networkConfig = networkConfigurationsByChainId[chainId];
  const networkName = networkConfig?.name ?? 'Unknown Network';

  // Refetch rewards when a pending claim is confirmed
  const { isClaimInFlight } = useOnMerklClaimConfirmed(refetchRewards);

  const { claimRewards, isClaiming, error } = useMerklClaim({
    tokenAddress,
    chainId,
  });

  useEffect(() => {
    if (
      hasFiredCtaDisplayedEvent.current ||
      isClaimInFlight ||
      isClaiming ||
      error ||
      !bonusAmountRange
    ) {
      return;
    }
    hasFiredCtaDisplayedEvent.current = true;

    /* eslint-disable @typescript-eslint/naming-convention */
    const impressionProperties: MusdClaimBonusCtaDisplayedEventProperties = {
      location: analyticsLocation,
      view_trigger: 'component_mounted',
      button_text: label,
      network_chain_id: chainId,
      network_name: networkName,
      asset_symbol: assetSymbol,
      bonus_amount_range: bonusAmountRange,
      has_claimed_before: hasClaimedBefore,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    trackEvent(
      createEventBuilder(MetaMetricsEventName.MusdClaimBonusCtaDisplayed)
        .addCategory(MetaMetricsEventCategory.MusdConversion)
        .addProperties(impressionProperties)
        .build(),
    );
  }, [
    assetSymbol,
    bonusAmountRange,
    chainId,
    error,
    hasClaimedBefore,
    isClaimInFlight,
    isClaiming,
    label,
    analyticsLocation,
    networkName,
    createEventBuilder,
    trackEvent,
  ]);

  // Trigger the claim transaction directly, routing to the confirmation page.
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      /* eslint-disable @typescript-eslint/naming-convention */
      const eventProperties: MusdClaimBonusButtonClickedEventProperties = {
        location: analyticsLocation,
        claim_amount: label,
        network_chain_id: chainId,
        network_name: networkName,
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      // Track claim bonus button click
      trackEvent(
        createEventBuilder(MetaMetricsEventName.MusdClaimBonusButtonClicked)
          .addCategory(MetaMetricsEventCategory.MusdConversion)
          .addProperties(eventProperties)
          .build(),
      );

      claimRewards();
    },
    [
      claimRewards,
      createEventBuilder,
      trackEvent,
      label,
      chainId,
      networkName,
      analyticsLocation,
    ],
  );

  if (isClaimInFlight || isClaiming) {
    return null;
  }

  if (error) {
    return (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.ErrorDefault}
        data-testid="claim-bonus-error"
        style={{ textAlign: 'end' }}
      >
        {t('merklRewardsUnexpectedError')}
      </Text>
    );
  }

  return (
    <button
      type="button"
      onClick={handleBadgeClick}
      style={{
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        font: 'inherit',
      }}
    >
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.PrimaryDefault}
        data-testid="claim-bonus-badge"
      >
        {label}
      </Text>
    </button>
  );
};
