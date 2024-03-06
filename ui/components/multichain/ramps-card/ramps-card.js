import React, { useContext } from 'react';
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
import useRamps from '../../../hooks/experiences/useRamps';

export const RAMPS_CARD_VARIANT_TYPES = {
  TOKEN: 'token',
  NFT: 'nft',
  ACTIVITY: 'activity',
};

export const RAMPS_CARD_VARIANTS = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: {
    backgroundImage: "url('/images/ramps-card-token-gradient.png')",
    illustrationSrc: './images/ramps-card-token-illustration.png',
    title: 'fundYourWallet',
    body: 'fundYourWalletDescription',
  },
  [RAMPS_CARD_VARIANT_TYPES.NFT]: {
    backgroundImage: "url('/images/ramps-card-nft-gradient.png')",
    illustrationSrc: './images/ramps-card-nft-illustration.png',
    title: 'getStartedWithNFTs',
    body: 'getStartedWithNFTsDescription',
  },
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: {
    backgroundImage: "url('/images/ramps-card-activity-gradient.png')",
    illustrationSrc: './images/ramps-card-activity-illustration.png',
    title: 'startYourJourney',
    body: 'startYourJourneyDescription',
  },
};

export const RampsCard = ({ variant }) => {
  const t = useI18nContext();
  const { backgroundImage, illustrationSrc, title, body } =
    RAMPS_CARD_VARIANTS[variant];
  const { openBuyCryptoInPdapp } = useRamps();
  const trackEvent = useContext(MetaMetricsContext);
  const currentNetwork = useSelector(getCurrentNetwork);
  const { symbol = 'ETH' } = useSelector(getSwapsDefaultToken);

  const onClick = () => {
    openBuyCryptoInPdapp();
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: `${variant} tab`,
        text: `Buy ${symbol}`,
        chain_id: currentNetwork.chainId,
        token_symbol: symbol,
      },
    });
  };

  return (
    <Box
      className={classnames('ramps-card', `ramps-card-${variant}`)}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      borderRadius={BorderRadius.LG}
      margin={2}
      style={{
        backgroundImage,
      }}
    >
      <img
        className={classnames(
          'ramps-card-illustration',
          `ramps-card-${variant}-illustration`,
        )}
        src={illustrationSrc}
        alt=""
      />
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
