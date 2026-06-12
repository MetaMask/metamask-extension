import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextAlign,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { Hex } from '@metamask/utils';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { PopoverPosition } from '../../../components/component-library';
import {
  BackgroundColor,
  TextColor as LegacyTextColor,
} from '../../../helpers/constants/design-system';
import { Tag } from '../../../components/component-library/tag';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
  MUSD_SUPPORT_ARTICLE_URL,
} from '../../../components/app/musd/constants';
import { getBonusAmountRange } from '../../../components/app/musd/merkl-bonus-analytics';
import {
  ASSET_OVERVIEW_TOKEN_CELL_MUSD_OPTIONS,
  type MusdClaimBonusButtonClickedEventProperties,
  type MusdClaimBonusCtaDisplayedEventProperties,
} from '../../../components/app/musd/musd-events';
import { useMerklClaim } from '../../../components/app/musd/hooks/useMerklClaim';
import { useMerklRewards } from '../../../components/app/musd/hooks/useMerklRewards';
import { useOnMerklClaimConfirmed } from '../../../components/app/musd/hooks/useOnMerklClaimConfirmed';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors/multichain';
import {
  selectIsMerklClaimingEnabled,
  selectIsMusdConversionFlowEnabled,
} from '../../../selectors/musd';
import { useMusdGeoBlocking } from '../../../hooks/musd/useMusdGeoBlocking';
import { InfoPopover } from '../../../components/app/musd/info-popover';

const MERKL_CLAIM_ANALYTICS_LOCATION =
  ASSET_OVERVIEW_TOKEN_CELL_MUSD_OPTIONS.merklClaimBonus.location;

export type MusdBonusSectionProps = {
  chainId: Hex;
  tokenAddress: Hex;
  /**
   * Combined fiat value of mUSD held across Merkl-eligible chains (Mainnet + Linea
   * per `ELIGIBLE_TOKENS`), used for estimated annual bonus (3% APY of this total).
   */
  positionFiatValue: number | null;
  showFiat: boolean;
  /**
   * Whether the account holds a positive mUSD balance on any Merkl-eligible chain.
   * Must reflect actual token balance (e.g. raw hex), not fiat prefs —
   * `positionFiatValue` is omitted when `showFiat` is false.
   */
  hasPositiveBalance: boolean;
};

function formatSignedFiat(
  formatFiat: ReturnType<typeof useFiatFormatter>,
  amount: number | null,
): string {
  if (amount === null || !Number.isFinite(amount)) {
    return '—';
  }
  const formatted = formatFiat(Math.abs(amount));
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${formatted}`;
}

/**
 * "Your bonus" block: estimated annual bonus, lifetime claimed, Merkl claim CTA.
 * @param options0
 * @param options0.chainId
 * @param options0.tokenAddress
 * @param options0.positionFiatValue
 * @param options0.showFiat
 * @param options0.hasPositiveBalance
 */
export function MusdBonusSection({
  chainId,
  tokenAddress,
  positionFiatValue,
  showFiat,
  hasPositiveBalance,
}: MusdBonusSectionProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hasFiredCtaDisplayedEvent = useRef(false);
  const isMusdFlowEnabled = useSelector(selectIsMusdConversionFlowEnabled);
  const isMerklClaimingEnabled = useSelector(selectIsMerklClaimingEnabled);
  const { isBlocked: isGeoBlocked } = useMusdGeoBlocking();
  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const networkName =
    networkConfigurationsByChainId[chainId]?.name ?? 'Unknown Network';

  const showMerklBadge =
    isMusdFlowEnabled && isMerklClaimingEnabled && !isGeoBlocked;

  const {
    hasClaimableReward,
    rewardAmountFiat,
    lifetimeClaimedFiat,
    isLoading,
    isEligible,
    claimableRewardDisplay,
    hasClaimedBefore,
    refetch: refetchRewards,
  } = useMerklRewards({
    tokenAddress,
    chainId,
    showMerklBadge,
  });

  const { isClaimInFlight } = useOnMerklClaimConfirmed(refetchRewards);

  const {
    claimRewards,
    isClaiming,
    error: merklClaimError,
  } = useMerklClaim({
    tokenAddress,
    chainId,
  });

  const bonusAmountRange = useMemo(
    () => getBonusAmountRange(claimableRewardDisplay ?? '< 0.01'),
    [claimableRewardDisplay],
  );

  const estimatedAnnualBonus =
    showFiat && positionFiatValue !== null && Number.isFinite(positionFiatValue)
      ? (positionFiatValue * MUSD_CONVERSION_APY) / 100
      : null;

  const hasMusd = hasPositiveBalance;

  const hasClaimable =
    hasClaimableReward && rewardAmountFiat !== null && rewardAmountFiat > 0;

  let bonusButtonLabel: string;
  if (hasClaimable && rewardAmountFiat !== null) {
    bonusButtonLabel = t('musdAssetBonusClaimAmount', [
      formatFiat(rewardAmountFiat),
    ]);
  } else if (hasMusd) {
    bonusButtonLabel = t('musdAssetBonusAccruing');
  } else {
    bonusButtonLabel = t('musdAssetBonusNoAccruing');
  }

  const bonusButtonDisabled =
    !hasClaimable || isClaiming || isClaimInFlight || isGeoBlocked;

  useEffect(() => {
    if (
      hasFiredCtaDisplayedEvent.current ||
      !showMerklBadge ||
      !hasClaimable ||
      isClaiming ||
      isClaimInFlight ||
      merklClaimError ||
      !bonusAmountRange
    ) {
      return;
    }
    hasFiredCtaDisplayedEvent.current = true;

    /* eslint-disable @typescript-eslint/naming-convention */
    const impressionProperties: MusdClaimBonusCtaDisplayedEventProperties = {
      location: MERKL_CLAIM_ANALYTICS_LOCATION,
      view_trigger: 'component_mounted',
      button_text: bonusButtonLabel,
      network_chain_id: chainId,
      network_name: networkName,
      asset_symbol: t('musdSymbol'),
      bonus_amount_range: bonusAmountRange,
      has_claimed_before: hasClaimedBefore,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    trackEvent({
      event: MetaMetricsEventName.MusdClaimBonusCtaDisplayed,
      category: MetaMetricsEventCategory.MusdConversion,
      properties: impressionProperties,
    });
  }, [
    bonusAmountRange,
    bonusButtonLabel,
    chainId,
    hasClaimable,
    hasClaimedBefore,
    merklClaimError,
    isClaiming,
    isClaimInFlight,
    networkName,
    showMerklBadge,
    t,
    trackEvent,
  ]);

  const handleClaimBonusClick = useCallback(() => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const clickProperties: MusdClaimBonusButtonClickedEventProperties = {
      location: MERKL_CLAIM_ANALYTICS_LOCATION,
      claim_amount: bonusButtonLabel,
      network_chain_id: chainId,
      network_name: networkName,
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    trackEvent({
      event: MetaMetricsEventName.MusdClaimBonusButtonClicked,
      category: MetaMetricsEventCategory.MusdConversion,
      properties: clickProperties,
    });

    claimRewards();
  }, [bonusButtonLabel, chainId, claimRewards, networkName, trackEvent]);

  if (!isMusdFlowEnabled) {
    return null;
  }

  if (!isMerklClaimingEnabled) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      data-testid="musd-bonus-section"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        marginBottom={3}
        gap={2}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          style={{ minWidth: 0 }}
        >
          <Text variant={TextVariant.HeadingSm} fontWeight={FontWeight.Bold}>
            {t('musdAssetBonusTitle')}
          </Text>
          <InfoPopover
            position={PopoverPosition.TopStart}
            iconName={IconName.Info}
            iconColor={IconColor.IconAlternative}
            iconSize={IconSize.Sm}
            ariaLabel={t('musdAssetBonusInfoAria') as string}
            data-testid="musd-bonus-info-tooltip"
            wrapperStyle={{
              display: 'inline-flex',
              alignItems: 'center',
              alignSelf: 'center',
              position: 'relative',
              top: '-1px',
            }}
            popoverStyle={{
              maxWidth: 315,
              paddingTop: '12px',
              paddingBottom: '16px',
            }}
          >
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              <Text
                variant={TextVariant.HeadingSm}
                fontWeight={FontWeight.Bold}
                textAlign={TextAlign.Center}
                color={TextColor.InfoInverse}
                style={{ width: '100%' }}
              >
                {t('musdAssetBonusTitle')}
              </Text>

              <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
                <strong>{t('musdAssetBonusTitle')}: </strong>
                {t('musdAssetBonusInfoYourBonus', [
                  String(MUSD_CONVERSION_APY),
                  <TextButton
                    key="terms"
                    size={TextButtonSize.BodyMd}
                    isInverse
                    asChild
                  >
                    <a
                      href={MUSD_CONVERSION_BONUS_TERMS_OF_USE}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'underline' }}
                    >
                      {t('musdTermsApply')}
                    </a>
                  </TextButton>,
                ])}
              </Text>

              <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
                <strong>{t('musdAssetBonusEstimatedAnnual')}: </strong>
                {t('musdAssetBonusInfoEstimatedAnnual')}
              </Text>

              <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
                <strong>{t('musdAssetBonusLifetimeClaimed')}: </strong>
                {t('musdAssetBonusInfoLifetimeClaimed')}{' '}
                <TextButton isInverse asChild>
                  <a
                    href={MUSD_SUPPORT_ARTICLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline' }}
                  >
                    {t('musdAssetBonusInfoLearnMore')}
                  </a>
                </TextButton>
              </Text>
            </Box>
          </InfoPopover>
        </Box>
        <Tag
          label={t('musdAssetBonusRate', [String(MUSD_CONVERSION_APY)])}
          backgroundColor={BackgroundColor.successMuted}
          labelProps={{ color: LegacyTextColor.successDefault }}
        />
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            style={{ minWidth: 0 }}
          >
            {t('musdAssetBonusEstimatedAnnual')}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
            {isLoading && isEligible
              ? '…'
              : formatSignedFiat(formatFiat, estimatedAnnualBonus)}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          alignItems={BoxAlignItems.Center}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
        >
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            style={{ minWidth: 0 }}
          >
            {t('musdAssetBonusLifetimeClaimed')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
          >
            {isLoading && isEligible
              ? '…'
              : formatSignedFiat(formatFiat, lifetimeClaimedFiat)}
          </Text>
        </Box>
      </Box>

      {showMerklBadge ? (
        <Box marginTop={4} marginBottom={3} style={{ width: '100%' }}>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={hasClaimable ? handleClaimBonusClick : undefined}
            disabled={bonusButtonDisabled}
            isLoading={isClaiming || isClaimInFlight}
            data-testid="musd-claim-bonus-button"
            style={{ width: '100%' }}
          >
            {bonusButtonLabel}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

export default MusdBonusSection;
