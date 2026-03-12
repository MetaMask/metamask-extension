import React, { useCallback, useContext } from 'react';
import type { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain';
import { useMerklClaim } from './hooks/useMerklClaim';
import { useOnMerklClaimConfirmed } from './hooks/useOnMerklClaimConfirmed';
import {
  MUSD_EVENTS_CONSTANTS,
  type MusdClaimBonusButtonClickedEventProperties,
} from './musd-events';

export const ClaimBonusBadge = ({
  label,
  tokenAddress,
  chainId,
  refetchRewards,
}: {
  label: string;
  tokenAddress: string;
  chainId: Hex;
  refetchRewards: () => void;
}) => {
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  // Get network name for analytics
  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const networkConfig = networkConfigurationsByChainId[chainId];
  const networkName = networkConfig?.name ?? 'Unknown Network';

  // Refetch rewards when a pending claim is confirmed
  useOnMerklClaimConfirmed(refetchRewards);

  const { claimRewards, isClaiming, error } = useMerklClaim({
    tokenAddress,
    chainId,
  });
  // Trigger the claim transaction directly, routing to the confirmation page.
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      // Track claim bonus button click
      trackEvent({
        event: MetaMetricsEventName.MusdClaimBonusButtonClicked,
        category: MetaMetricsEventCategory.MusdConversion,
        properties: {
          location:
            MUSD_EVENTS_CONSTANTS.EVENT_LOCATIONS.CLAIM_BONUS_BOTTOM_SHEET,
          /* eslint-disable @typescript-eslint/naming-convention */
          claim_amount: label,
          network_chain_id: chainId,
          network_name: networkName,
          /* eslint-enable @typescript-eslint/naming-convention */
        } as MusdClaimBonusButtonClickedEventProperties,
      });

      claimRewards();
    },
    [claimRewards, trackEvent, label, chainId, networkName],
  );

  if (isClaiming) {
    return (
      <Icon
        name={IconName.Loading}
        size={IconSize.Sm}
        color={IconColor.PrimaryDefault}
        style={{ animation: 'spin 1.2s linear infinite' }}
        data-testid="claim-bonus-spinner"
      />
    );
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
