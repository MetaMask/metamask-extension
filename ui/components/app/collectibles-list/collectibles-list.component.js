import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function CollectiblesList({ onAddNFT }) {
  const collectibles = [];
  const t = useI18nContext();

  return (
    <div className="collectibles-list">
      {collectibles.length > 0 ? (
        <span>{JSON.stringify(collectibles)}</span>
      ) : (
        <Box padding={[4, 0, 4, 0]}>
          <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
            <img src="./images/no-nfts.svg" />
          </Box>
          <Box
            marginTop={4}
            marginBottom={12}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H4}
              align={TEXT_ALIGN.CENTER}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('noNFTs')}
            </Typography>
            <Button
              type="link"
              target="_blank"
              rel="noopener noreferrer"
              href="https://metamask.zendesk.com/hc/en-us/articles/360058238591-NFT-tokens-in-MetaMask-wallet"
              style={{ padding: 0, fontSize: '1rem' }}
            >
              {t('learnMore')}
            </Button>
          </Box>
          <Box
            marginBottom={4}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            flexDirection={FLEX_DIRECTION.COLUMN}
          >
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H5}
              align={TEXT_ALIGN.CENTER}
            >
              {t('missingNFT')}
            </Typography>
            <Button
              type="link"
              onClick={onAddNFT}
              style={{ padding: 0, fontSize: '1rem' }}
            >
              {t('addNFT')}
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
