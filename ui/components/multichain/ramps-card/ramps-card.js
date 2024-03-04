import React from 'react';
import PropTypes from 'prop-types';

import { Box, Icon, IconName, IconSize, Text } from '../../component-library';
import {
  AlignItems,
  BorderRadius,
  Display,
} from '../../../helpers/constants/design-system';

import { useI18nContext } from '../../../hooks/useI18nContext';

export const RAMPS_CARD_VARIANT_TYPES = {
  TOKEN: 'token',
  NFT: 'nft',
  ACTIVITY: 'activity',
};

const RAMPS_CARD_VARIANTS = {
  [RAMPS_CARD_VARIANT_TYPES.TOKEN]: {
    color: 'var(--color-info-default)',
    backgroundImage: 'url(/images/ramps-card-tokens-background.png)',
  },
  [RAMPS_CARD_VARIANT_TYPES.NFT]: {
    color: 'var(--color-flask-default)',
    backgroundImage: 'url(/images/ramps-card-nfts-background.png)',
  },
  [RAMPS_CARD_VARIANT_TYPES.ACTIVITY]: {
    color: 'var(--color-error-alternative)',
    backgroundImage: 'url(/images/ramps-card-activity-background.png)',
  },
};

export const RampsCard = ({ variant }) => {
  const t = useI18nContext();
  const { color, backgroundImage } = RAMPS_CARD_VARIANTS[variant];

  return (
    <Box
      display={Display.Flex}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.LG}
      padding={2}
      style={{
        backgroundImage,
        backgroundSize: '100% 100%',
        backgroundColor: color,
      }}
    >
      <Text>Ramps Card</Text>
    </Box>
  );
};

RampsCard.propTypes = {
  /**
   * Text within the button body
   */
  variant: PropTypes.oneOf(Object.values(RAMPS_CARD_VARIANT_TYPES)),
};
