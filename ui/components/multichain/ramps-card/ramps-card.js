import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  IconName,
  Text,
  ButtonBase,
  ButtonIconSize,
  ButtonIcon,
} from '../../component-library';
import {
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const RAMPS_CARD_VARIANT_TYPES = {
  TOKEN: 'token',
  NFT: 'nft',
  ACTIVITY: 'activity',
};

export const RAMPS_CARD_VARIANTS = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: {
    color: 'var(--color-info-default)',
    backgroundImage: 'url(/images/ramps-card-tokens-background.png)',
    illustration: './images/ramps-card-tokens-illustration.png',
    imageStyle: { height: '240%', right: '-25px', top: '-35px' },
    title: 'Fund your wallet',
    body: 'Get started by adding some [TokenName] to your wallet.',
  },
  [RAMPS_CARD_VARIANT_TYPES.NFT]: {
    color: 'var(--color-flask-default)',
    backgroundImage: 'url(/images/ramps-card-nfts-background.png)',
    illustration: './images/ramps-card-nft-illustration.png',
    imageStyle: { height: '80%', right: '-25px', top: '40px' },
    title: 'Get [TokenName] to buy NFTs',
    body: 'Get started with NFTs by adding some [TokenName] to your wallet.',
  },
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: {
    color: 'var(--color-error-alternative)',
    backgroundImage: 'url(/images/ramps-card-activity-background.png)',
    illustration: './images/ramps-card-activity-illustration.png',
    imageStyle: { height: '140%', right: '-45px', top: 0 },
    title: 'Start your journey with [TokenName]',
    body: 'Get started with web3 by adding some [TokenName] to your wallet.',
  },
};

export const RampsCard = ({ variant }) => {
  const t = useI18nContext();
  const { color, backgroundImage, illustration, imageStyle, title, body } =
    RAMPS_CARD_VARIANTS[variant];

  return (
    <Box
      className="ramps-card"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      gap={2}
      borderRadius={BorderRadius.LG}
      style={{
        width: '100%',
        backgroundImage,
        backgroundSize: '100% 100%',
        backgroundColor: color,
        overflow: 'hidden',
        padding: '8px 12px',
      }}
    >
      <img
        src={illustration}
        alt=""
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          ...imageStyle,
        }}
      />
      <ButtonIcon
        className="ramps-card__close-button"
        iconName={IconName.Close}
        size={ButtonIconSize.Sm}
        ariaLabel={t('close')}
      />
      <Text variant={TextVariant.headingSm}>{title}</Text>
      <Text style={{ width: '80%' }}>{body}</Text>
      <ButtonBase
        style={{
          width: 'fit-content',
          color: TextColor.textDefault,
          backgroundColor: BackgroundColor.backgroundDefault,
        }}
      >
        Buy TokenName
      </ButtonBase>
    </Box>
  );
};

RampsCard.propTypes = {
  variant: PropTypes.oneOf(Object.values(RAMPS_CARD_VARIANT_TYPES)),
};
