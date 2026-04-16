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
import React from 'react';
import { useSelector } from 'react-redux';
import { PopoverPosition } from '../../../components/component-library';
import {
  BackgroundColor,
  TextColor as LegacyTextColor,
} from '../../../helpers/constants/design-system';
import { Tag } from '../../../components/component-library/tag';
import {
  MUSD_CONVERSION_APY,
  MUSD_CONVERSION_BONUS_TERMS_OF_USE,
} from '../../../components/app/musd/constants';
import { useMerklClaim } from '../../../components/app/musd/hooks/useMerklClaim';
import { useMerklRewards } from '../../../components/app/musd/hooks/useMerklRewards';
import { useOnMerklClaimConfirmed } from '../../../components/app/musd/hooks/useOnMerklClaimConfirmed';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import {
  selectIsMerklClaimingEnabled,
  selectIsMusdConversionFlowEnabled,
} from '../../../selectors/musd';
import { useMusdGeoBlocking } from '../../../hooks/musd/useMusdGeoBlocking';
import { InfoPopover } from '../../../components/app/musd/info-popover';

const MUSD_SUPPORT_ARTICLE_URL =
  'https://support.metamask.io/manage-crypto/tokens/musd';

export type MusdBonusSectionProps = {
  chainId: Hex;
  tokenAddress: Hex;
  /** Fiat value of mUSD position on this chain (for estimated annual bonus) */
  positionFiatValue: number | null;
  showFiat: boolean;
  /**
   * Whether the account holds a positive mUSD balance on this chain. Must reflect
   * actual token balance (e.g. raw hex), not fiat prefs — `positionFiatValue` is
   * omitted when `showFiat` is false.
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
  const isMusdFlowEnabled = useSelector(selectIsMusdConversionFlowEnabled);
  const isMerklClaimingEnabled = useSelector(selectIsMerklClaimingEnabled);
  const { isBlocked: isGeoBlocked } = useMusdGeoBlocking();

  const showMerklBadge =
    isMusdFlowEnabled && isMerklClaimingEnabled && !isGeoBlocked;

  const {
    hasClaimableReward,
    rewardAmountFiat,
    lifetimeClaimedFiat,
    isLoading,
    isEligible,
    refetch: refetchRewards,
  } = useMerklRewards({
    tokenAddress,
    chainId,
    showMerklBadge,
  });

  useOnMerklClaimConfirmed(refetchRewards);

  const { claimRewards, isClaiming } = useMerklClaim({
    tokenAddress,
    chainId,
  });

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

  const bonusButtonDisabled = !hasClaimable || isClaiming || isGeoBlocked;

  if (!isMusdFlowEnabled) {
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
            onClick={hasClaimable ? () => claimRewards() : undefined}
            disabled={bonusButtonDisabled}
            isLoading={isClaiming}
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
