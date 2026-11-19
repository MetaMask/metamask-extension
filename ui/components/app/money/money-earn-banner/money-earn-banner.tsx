import React, { useCallback, useState } from 'react';
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
  TextButton,
  TextButtonSize,
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

type BannerImage = { src: string; className: string };

const image = (name: string, className: string): BannerImage => ({
  src: `./images/money-earn-banner-${name}.png`,
  className: `absolute ${className}`,
});

const MUSD_IMAGE = image('musd', 'top-[2px] -left-[5px] h-[43px] w-[43px]');
const AUSDC_IMAGE = image('ausdc', 'top-[8px] left-[3px] h-[34px] w-[34px]');

const SOURCE_TOKEN_IMAGES: Record<string, BannerImage> = {
  USDC: image('usdc', 'top-[6px] left-0 h-[39px] w-[37px]'),
  USDT: image('usdt', 'top-[7px] left-[1px] h-[37px] w-[34px]'),
  DAI: image('dai', 'top-[7px] left-0 h-[37px] w-[36px]'),
  AUSDC: AUSDC_IMAGE,
  AUSDCN: AUSDC_IMAGE,
  AUSDT: image('ausdt', 'top-[8px] left-[1px] h-[33px] w-[33px]'),
  ADAI: image('adai', 'top-[8px] left-[1px] h-[34px] w-[34px]'),
};

const ARROW_IMAGE = image('arrow', 'top-[4px] left-[30px] h-[30px] w-[32px]');
const COIN_IMAGE = image('coin', 'top-[35px] left-[40px] h-[33px] w-[28px]');

const getSourceTokenImage = (address: string, symbol: string) =>
  isMusdToken(address) ? MUSD_IMAGE : SOURCE_TOKEN_IMAGES[symbol.toUpperCase()];

export type MoneyEarnBannerProps = {
  token: MoneyAssetOverviewToken & { image?: string | null };
};

/**
 * Dismissible "Earn up to X% APY" Money deposit banner for token details.
 * Dismissal is persisted per token by the hook, and hides the banner here
 * straight away rather than after the background state update arrives.
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
      marginHorizontal={4}
      marginTop={4}
      className="cursor-pointer rounded-xl"
      onClick={onBannerClick}
    >
      <Box className="relative h-[72px] w-[72px] shrink-0 overflow-hidden">
        {sourceTokenImage ? (
          <img
            src={sourceTokenImage.src}
            className={sourceTokenImage.className}
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
        <img src={ARROW_IMAGE.src} className={ARROW_IMAGE.className} alt="" />
        <img src={COIN_IMAGE.src} className={COIN_IMAGE.className} alt="" />
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
        <TextButton
          size={TextButtonSize.BodySm}
          onClick={handleCtaClick}
          className="self-start"
          data-testid={`${MONEY_EARN_BANNER_TEST_ID}-cta`}
        >
          {t(MONEY_EARN_BANNER_CTA_LABEL_KEY, [token.symbol])}
        </TextButton>
      </Box>
    </Box>
  );
};
