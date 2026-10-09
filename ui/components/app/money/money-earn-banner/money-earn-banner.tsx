import React, { useCallback, useState, type CSSProperties } from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  MONEY_EARN_BANNER_CTA_LABEL_KEY,
  useMoneyEarnBanner,
  type MoneyAssetOverviewToken,
} from '../../../../hooks/money/use-money-asset-overview-ctas';
import { isMusdToken } from '../../musd/constants';

export const MONEY_EARN_BANNER_TEST_ID = 'money-earn-banner';

type BannerImage = { src: string; style: CSSProperties };

const image = (name: string, style: CSSProperties): BannerImage => ({
  src: `./images/money-earn-banner-${name}.png`,
  style: { position: 'absolute', ...style },
});

const MUSD_IMAGE = image('musd', { top: 2, left: -5, width: 43, height: 43 });
const AUSDC_IMAGE = image('ausdc', { top: 8, left: 3, width: 34, height: 34 });

const SOURCE_TOKEN_IMAGES: Record<string, BannerImage> = {
  USDC: image('usdc', { top: 6, left: 0, width: 37, height: 39 }),
  USDT: image('usdt', { top: 7, left: 1, width: 34, height: 37 }),
  DAI: image('dai', { top: 7, left: 0, width: 36, height: 37 }),
  AUSDC: AUSDC_IMAGE,
  AUSDCN: AUSDC_IMAGE,
  AUSDT: image('ausdt', { top: 8, left: 1, width: 33, height: 33 }),
  ADAI: image('adai', { top: 8, left: 1, width: 34, height: 34 }),
};

const ARROW_IMAGE = image('arrow', { top: 4, left: 30, width: 32, height: 30 });
const COIN_IMAGE = image('coin', { top: 35, left: 40, width: 28, height: 33 });

const getSourceTokenImage = (address: string, symbol: string) =>
  isMusdToken(address) ? MUSD_IMAGE : SOURCE_TOKEN_IMAGES[symbol.toUpperCase()];

export type MoneyEarnBannerProps = {
  token: MoneyAssetOverviewToken & { image?: string | null };
};

/**
 * Dismissible "Earn up to X% APY" Money deposit banner for token details.
 * Dismissal lasts only while mounted, so the banner returns on the next visit.
 *
 * @param props - Component props.
 * @param props.token - The token whose details page is shown.
 */
export const MoneyEarnBanner = ({ token }: MoneyEarnBannerProps) => {
  const t = useI18nContext();
  const [isDismissed, setIsDismissed] = useState(false);
  const {
    isVisible,
    apyPercentFormatted,
    onBannerClick,
    onCtaClick,
    onDismiss,
  } = useMoneyEarnBanner(token);

  const handleCtaClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onCtaClick();
    },
    [onCtaClick],
  );

  const handleDismiss = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onDismiss();
      setIsDismissed(true);
    },
    [onDismiss],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.target === event.currentTarget && event.key === 'Enter') {
        onBannerClick();
      }
    },
    [onBannerClick],
  );

  if (!isVisible || isDismissed) {
    return null;
  }

  const sourceTokenImage = getSourceTokenImage(token.address, token.symbol);

  return (
    <Box
      data-testid={MONEY_EARN_BANNER_TEST_ID}
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      backgroundColor={BoxBackgroundColor.BackgroundMuted}
      gap={4}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
      className="mx-4 mt-4 cursor-pointer rounded-xl"
      role="button"
      tabIndex={0}
      onClick={onBannerClick}
      onKeyDown={handleKeyDown}
    >
      <Box className="relative h-[72px] w-[72px] shrink-0 overflow-hidden">
        {sourceTokenImage ? (
          <img
            src={sourceTokenImage.src}
            style={sourceTokenImage.style}
            alt=""
            data-testid={`${MONEY_EARN_BANNER_TEST_ID}-source-image`}
          />
        ) : (
          <AvatarToken
            name={token.symbol}
            src={token.image ?? undefined}
            size={AvatarTokenSize.Md}
            className="absolute left-0.5 top-2"
          />
        )}
        <img src={ARROW_IMAGE.src} style={ARROW_IMAGE.style} alt="" />
        <img src={COIN_IMAGE.src} style={COIN_IMAGE.style} alt="" />
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} className="min-w-0 flex-1">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Bold}
            className="flex-1"
            data-testid={`${MONEY_EARN_BANNER_TEST_ID}-title`}
          >
            {apyPercentFormatted
              ? t('moneyEarnApyTitle', [apyPercentFormatted])
              : t('moneyEarnBannerTitleNoApy')}
          </Text>
          <ButtonIcon
            iconName={IconName.Close}
            size={ButtonIconSize.Sm}
            onClick={handleDismiss}
            ariaLabel={t('dismiss')}
            data-testid={`${MONEY_EARN_BANNER_TEST_ID}-dismiss`}
          />
        </Box>
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('moneyEarnBannerDescription', [token.symbol])}
        </Text>
        <button
          type="button"
          onClick={handleCtaClick}
          className="m-0 cursor-pointer self-start border-0 bg-transparent p-0"
          data-testid={`${MONEY_EARN_BANNER_TEST_ID}-cta`}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.PrimaryDefault}
          >
            {t(MONEY_EARN_BANNER_CTA_LABEL_KEY, [token.symbol])}
          </Text>
        </button>
      </Box>
    </Box>
  );
};
