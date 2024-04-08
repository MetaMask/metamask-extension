import React, { useCallback, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { Box, Text, ButtonBase } from '../../component-library';
import {
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentNetwork, getSwapsDefaultToken } from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import useRamps, {
  RampsMetaMaskEntry,
} from '../../../hooks/experiences/useRamps';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getCurrentLocale } from '../../../ducks/locale/locale';

const darkenGradient =
  'linear-gradient(rgba(0, 0, 0, 0.12),rgba(0, 0, 0, 0.12))';

export const RAMPS_CARD_VARIANT_TYPES = {
  TOKEN: 'token',
  NFT: 'nft',
  ACTIVITY: 'activity',
};

export const RAMPS_CARD_VARIANTS = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: {
    illustrationSrc: './images/ramps-card-token-illustration.png',
    gradient:
      'linear-gradient(90deg, #0189EC 0%, #4B7AED 35%, #6774EE 58%, #706AF4 80.5%, #7C5BFC 100%)',
    title: 'fundYourWallet',
    body: 'fundYourWalletDescription',
  },
  [RAMPS_CARD_VARIANT_TYPES.NFT]: {
    illustrationSrc: './images/ramps-card-nft-illustration.png',
    gradient: 'linear-gradient(90deg, #F6822D 0%, #F894A7 52%, #ED94FB 92.5%)',
    title: 'getStartedWithNFTs',
    body: 'getStartedWithNFTsDescription',
  },
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: {
    illustrationSrc: './images/ramps-card-activity-illustration.png',
    gradient:
      'linear-gradient(90deg, #57C5DC 0%, #06BFDD 49.39%, #35A9C7 100%)',

    title: 'startYourJourney',
    body: 'startYourJourneyDescription',
  },
};

const metamaskEntryMap = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: RampsMetaMaskEntry.TokensBanner,
  [RAMPS_CARD_VARIANT_TYPES.NFT]: RampsMetaMaskEntry.NftBanner,
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: RampsMetaMaskEntry.ActivityBanner,
};

export const RampsCard = ({ variant }) => {
  const t = useI18nContext();
  const { gradient, illustrationSrc, title, body } =
    RAMPS_CARD_VARIANTS[variant];
  const { openBuyCryptoInPdapp } = useRamps(metamaskEntryMap[variant]);
  const trackEvent = useContext(MetaMetricsContext);
  const currentLocale = useSelector(getCurrentLocale);
  const { chainId, nickname } = useSelector(getCurrentNetwork);
  const { symbol = 'ETH' } = useSelector(getSwapsDefaultToken);

  useEffect(() => {
    trackEvent({
      event: MetaMetricsEventName.EmptyBuyBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        chain_id: chainId,
        locale: currentLocale,
        network: nickname,
        referrer: ORIGIN_METAMASK,
      },
    });
  }, [currentLocale, chainId, nickname, trackEvent]);

  const onClick = useCallback(() => {
    openBuyCryptoInPdapp();
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: `${variant} tab`,
        text: `Buy ${symbol}`,
        chain_id: chainId,
        token_symbol: symbol,
      },
    });
  }, [chainId, openBuyCryptoInPdapp, symbol, trackEvent, variant]);

  return (
    <Box
      className={classnames('ramps-card', `ramps-card-${variant}`)}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      borderRadius={BorderRadius.LG}
      margin={2}
      style={{
        background: `url(${illustrationSrc}) no-repeat right bottom / contain,
            ${darkenGradient}, ${gradient}`,
      }}
    >
      <Text className="ramps-card__title" variant={TextVariant.headingSm}>
        {t(title, [symbol])}
      </Text>
      <Text className="ramps-card__body">{t(body, [symbol])}</Text>
      <ButtonBase className="ramps-card__cta-button" onClick={onClick}>
        {t('buyToken', [symbol])}
      </ButtonBase>
    </Box>
  );
};

RampsCard.propTypes = {
  variant: PropTypes.oneOf(Object.values(RAMPS_CARD_VARIANT_TYPES)),
};
