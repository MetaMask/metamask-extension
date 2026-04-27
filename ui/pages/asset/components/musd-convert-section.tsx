import {
  AvatarNetwork,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  BadgeWrapperPosition,
  BadgeWrapperPositionAnchorShape,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxFlexWrap,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { Hex } from '@metamask/utils';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Tag } from '../../../components/component-library';
import {
  BackgroundColor,
  FontWeight as LegacyFontWeight,
  TextColor as LegacyTextColor,
} from '../../../helpers/constants/design-system';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import {
  MUSD_CONVERSION_APY,
  MUSD_SUPPORT_ARTICLE_URL,
} from '../../../components/app/musd/constants';
import {
  getMultichainNetworkConfigurationsByChainId,
  getImageForChainId,
} from '../../../selectors/multichain';
import { selectIsMusdConversionFlowEnabled } from '../../../selectors/musd';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import {
  useMusdConversion,
  useMusdConversionTokens,
} from '../../../hooks/musd';
import type { TokenWithFiatAmount } from '../../../components/app/assets/types';
import { useMusdGeoBlocking } from '../../../hooks/musd/useMusdGeoBlocking';

/** Figma node 10049:41315 — Secondary list row Convert control */
const MUSD_CONVERT_LIST_BUTTON_MIN_WIDTH_PX = 92;
const MUSD_CONVERT_LIST_BUTTON_MIN_HEIGHT_PX = 40;

/** Figma node 10053:43120 — Avatar Token + Badge Network (convert list row), 40px token */
const MUSD_CONVERT_LIST_TOKEN_SIZE = AvatarTokenSize.Lg;

/** Preferred row order for the primary (stablecoin) variant */
const STABLECOIN_ORDER = ['USDC', 'USDT', 'DAI'] as const;

/**
 * Figma node 10025:38455 — Hardcoded stablecoin avatars for the promotional
 * "no stablecoins held" variant. Always displays USDC, USDT, DAI regardless
 * of user holdings. Leftmost token renders on top (highest z-index).
 */
const STACKED_STABLECOIN_AVATARS = [
  {
    symbol: 'USDC',
    src: 'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  },
  {
    symbol: 'USDT',
    src: 'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
  },
  {
    symbol: 'DAI',
    src: 'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x6b175474e89094c44da98b954eedeac495271d0f.png',
  },
] as const;
const STACKED_AVATAR_OVERLAP_PX = 30;
/** AvatarToken Lg + `hasBorder` outer size (DS AvatarBase) */
const STACKED_AVATAR_TOKEN_OUTER_PX = 44;
const STACKED_AVATAR_CONTAINER_WIDTH_PX =
  (STACKED_STABLECOIN_AVATARS.length - 1) * STACKED_AVATAR_OVERLAP_PX +
  STACKED_AVATAR_TOKEN_OUTER_PX;

function isStablecoinSymbol(symbol: string): boolean {
  const upper = symbol.toUpperCase();
  return (STABLECOIN_ORDER as readonly string[]).includes(upper);
}

function sortStablecoins(tokens: TokenWithFiatAmount[]): TokenWithFiatAmount[] {
  return [...tokens].sort((a, b) => {
    const ia = STABLECOIN_ORDER.indexOf(
      a.symbol.toUpperCase() as (typeof STABLECOIN_ORDER)[number],
    );
    const ib = STABLECOIN_ORDER.indexOf(
      b.symbol.toUpperCase() as (typeof STABLECOIN_ORDER)[number],
    );
    const sa = ia === -1 ? 99 : ia;
    const sb = ib === -1 ? 99 : ib;
    return sa - sb;
  });
}

/**
 * "Convert your stablecoins" section with two variants: user holds supported
 * stablecoins (list + convert) or not (stacked avatars when any convertible
 * tokens exist, else copy + tags only).
 */
export function MusdConvertSection() {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();
  const isFlowEnabled = useSelector(selectIsMusdConversionFlowEnabled);
  const { isBlocked: isGeoBlocked } = useMusdGeoBlocking();
  const { tokens: conversionTokens } = useMusdConversionTokens();
  const { startConversionFlow } = useMusdConversion();

  const networkConfigurationsByChainId = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const stablecoins = useMemo(
    () =>
      sortStablecoins(
        conversionTokens.filter((tok) => isStablecoinSymbol(tok.symbol)),
      ),
    [conversionTokens],
  );

  const hasStablecoins = stablecoins.length > 0;

  const handleConvert = useCallback(
    async (token: TokenWithFiatAmount) => {
      if (isGeoBlocked || !isFlowEnabled) {
        return;
      }
      await startConversionFlow({
        preferredToken: {
          address: token.address,
          chainId: token.chainId as Hex,
        },
        entryPoint: 'asset_overview',
        skipEducation: false,
      });
    },
    [isFlowEnabled, isGeoBlocked, startConversionFlow],
  );

  const openLearnMore = useCallback(() => {
    global.platform.openTab({ url: MUSD_SUPPORT_ARTICLE_URL });
  }, []);

  const benefitTags = useMemo(
    () => [
      { key: 'dollar', label: t('musdAssetConvertBenefitDollarBacked') },
      { key: 'lock', label: t('musdAssetConvertBenefitNoLockups') },
      { key: 'fee', label: t('musdAssetConvertBenefitNoMetaMaskFee') },
      { key: 'daily', label: t('musdAssetConvertBenefitDailyBonus') },
    ],
    [t],
  );

  if (!isFlowEnabled) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingBottom={3}
      data-testid="musd-convert-section"
    >
      {!hasStablecoins && conversionTokens.length > 0 ? (
        <Box marginTop={3} marginBottom={3} data-testid="musd-stacked-avatars">
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            style={{
              width: STACKED_AVATAR_CONTAINER_WIDTH_PX,
              height: 40,
              position: 'relative',
            }}
          >
            {STACKED_STABLECOIN_AVATARS.map((coin, index) => (
              <Box
                key={coin.symbol}
                style={{
                  position: 'absolute',
                  left: index * STACKED_AVATAR_OVERLAP_PX,
                  top: 0,
                  zIndex: STACKED_STABLECOIN_AVATARS.length - index,
                }}
              >
                <AvatarToken
                  name={coin.symbol}
                  src={coin.src}
                  size={AvatarTokenSize.Lg}
                  hasBorder
                />
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box paddingTop={3} paddingBottom={3}>
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('musdAssetConvertTitle')}
        </Text>
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} gap={4} marginBottom={4}>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('musdAssetConvertDescriptionLead')}
          <Text
            asChild
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
          >
            <span>
              {t('musdAssetConvertDescriptionHighlight', [
                String(MUSD_CONVERSION_APY),
              ])}
            </span>
          </Text>
          {t('musdAssetConvertDescriptionTail')}
        </Text>

        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          data-testid="musd-convert-benefit-tags"
        >
          {[benefitTags.slice(0, 2), benefitTags.slice(2, 4)].map((rowTags) => (
            <Box
              key={`musd-benefit-row-${rowTags.map((tag) => tag.key).join('-')}`}
              flexDirection={BoxFlexDirection.Row}
              flexWrap={BoxFlexWrap.Wrap}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.Start}
              gap={2}
            >
              {rowTags.map(({ key, label }) => (
                <Tag
                  key={key}
                  iconName={IconName.CheckBold}
                  iconSize={IconSize.Sm}
                  label={label}
                  textVariant={TextVariant.BodySm}
                  labelProps={{
                    fontWeight: LegacyFontWeight.Medium,
                    color: LegacyTextColor.textAlternative,
                  }}
                  backgroundColor={BackgroundColor.backgroundMuted}
                  startIconProps={{
                    className: IconColor.SuccessDefault,
                  }}
                  paddingLeft={0}
                  paddingRight={0}
                  paddingTop={0}
                  paddingBottom={0}
                  style={{ paddingInline: 6, paddingBlock: 0 }}
                />
              ))}
            </Box>
          ))}
        </Box>
      </Box>

      {hasStablecoins
        ? stablecoins.map((token) => {
            const chainIdHex = token.chainId as Hex;
            const networkName =
              networkConfigurationsByChainId[chainIdHex.toLowerCase() as Hex]
                ?.name ?? '';
            const networkIcon = getImageForChainId(chainIdHex);
            const fiat = token.tokenFiatAmount ?? null;
            const fiatLabel =
              fiat !== null && Number.isFinite(fiat) ? formatFiat(fiat) : '—';

            return (
              <Box
                key={`${token.address}-${token.chainId}`}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Start}
                paddingTop={3}
                paddingBottom={3}
                gap={4}
                style={{ minHeight: 64 }}
              >
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={3}
                  style={{ minWidth: 0, flex: 1 }}
                >
                  <Box style={{ flexShrink: 0 }}>
                    <BadgeWrapper
                      position={BadgeWrapperPosition.BottomRight}
                      positionAnchorShape={
                        BadgeWrapperPositionAnchorShape.Circular
                      }
                      badgeContainerProps={{
                        color: BackgroundColor.backgroundDefault,
                      }}
                      badge={
                        <AvatarNetwork
                          name={networkName}
                          src={networkIcon}
                          style={{
                            width: 20,
                            height: 20,
                            borderWidth: 2,
                            borderRadius: 4,
                          }}
                          hasBorder
                        />
                      }
                    >
                      <AvatarToken
                        name={token.symbol}
                        size={MUSD_CONVERT_LIST_TOKEN_SIZE}
                        src={
                          getAssetImageUrl(token.address, chainIdHex) ??
                          token.image ??
                          ''
                        }
                      />
                    </BadgeWrapper>
                  </Box>
                  <Box
                    flexDirection={BoxFlexDirection.Column}
                    justifyContent={BoxJustifyContent.Center}
                    style={{ minWidth: 0, flex: 1 }}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {token.symbol}
                    </Text>
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {fiatLabel}
                    </Text>
                  </Box>
                </Box>
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Sm}
                  onClick={() => handleConvert(token)}
                  disabled={isGeoBlocked}
                  style={{
                    flexShrink: 0,
                    minWidth: MUSD_CONVERT_LIST_BUTTON_MIN_WIDTH_PX,
                    minHeight: MUSD_CONVERT_LIST_BUTTON_MIN_HEIGHT_PX,
                  }}
                >
                  {t('musdConvert')}
                </Button>
              </Box>
            );
          })
        : null}

      <Box marginTop={2} style={{ width: '100%' }}>
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={openLearnMore}
          data-testid="musd-learn-more-button"
          style={{ width: '100%' }}
        >
          {t('musdAssetConvertLearnMore')}
        </Button>
      </Box>
    </Box>
  );
}

export default MusdConvertSection;
