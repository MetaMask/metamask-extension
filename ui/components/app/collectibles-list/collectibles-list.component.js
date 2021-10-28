import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  BLOCK_SIZES,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';

export default function CollectiblesList({ onAddNFT }) {
  const collectibles = [];
  const t = useI18nContext();
  const blockSizes = {
    copy:
      getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
        ? BLOCK_SIZES.TWO_THIRDS
        : BLOCK_SIZES.ONE_THIRD,
    button:
      getEnvironmentType() === ENVIRONMENT_TYPE_POPUP
        ? BLOCK_SIZES.HALF
        : BLOCK_SIZES.ONE_FIFTH,
  };

  return (
    <div className="collectibles-list">
      {collectibles.length > 0 ? (
        <span>{JSON.stringify(collectibles)}</span>
      ) : (
        <Box padding={[4, 0, 4, 0]} flexDirection={FLEX_DIRECTION.COLUMN}>
          <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
            <img src="./images/diamond.png" />
          </Box>
          <Typography
            color={COLORS.UI3}
            variant={TYPOGRAPHY.H3}
            align={TEXT_ALIGN.CENTER}
          >
            {t('noNFTs')}
          </Typography>
          <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
            <Box width={blockSizes.copy}>
              <Typography
                color={COLORS.UI3}
                variant={TYPOGRAPHY.H5}
                align={TEXT_ALIGN.CENTER}
              >
                {t('noNFTsDetails')}
              </Typography>
            </Box>
          </Box>
          <Box marginTop={6} justifyContent={JUSTIFY_CONTENT.CENTER}>
            <Box width={blockSizes.button}>
              <Button type="primary" onClick={onAddNFT}>
                {t('addNFT')}
              </Button>
            </Box>
          </Box>
          <Box marginTop={2}>
            <Button
              href="https://community.metamask.io/"
              target="_blank"
              type="link"
              rel="noopener noreferrer"
            >
              {t('learnMore')}
            </Button>
          </Box>
        </Box>
      )}
    </div>
  );
}

CollectiblesList.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
};
