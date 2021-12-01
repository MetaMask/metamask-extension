import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import NewCollectiblesNotice from '../new-collectibles-notice';
import CollectiblesItems from '../collectibles-items';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCollectibles,
  getCollectibleContracts,
} from '../../../ducks/metamask/metamask';
import { getUseCollectibleDetection } from '../../../selectors';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import { detectCollectibles } from '../../../store/actions';

export default function CollectiblesTab({ onAddNFT }) {
  const collectibles = useSelector(getCollectibles);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const useCollectibleDetection = useSelector(getUseCollectibleDetection);
  const history = useHistory();
  const newNFTsDetected = false;
  const t = useI18nContext();
  const collections = {};
  const dispatch = useDispatch();

  collectibles.forEach((collectible) => {
    if (collections[collectible.address]) {
      collections[collectible.address].collectibles.push(collectible);
    } else {
      const collectionContract = collectibleContracts.find(
        ({ address }) => address === collectible.address,
      );
      collections[collectible.address] = {
        collectionName: collectionContract?.name || collectible.name,
        collectionImage:
          collectionContract?.logo || collectible.collectionImage,
        collectibles: [collectible],
      };
    }
  });

  return (
    <div className="collectibles-tab">
      {collectibles.length > 0 ? (
        <CollectiblesItems
          collections={collections}
          onAddNFT={onAddNFT}
          useCollectibleDetection={useCollectibleDetection}
          onRefreshList={() => dispatch(detectCollectibles())}
          onEnableAutoDetect={() => history.push(EXPERIMENTAL_ROUTE)}
        />
      ) : (
        <Box padding={[6, 12, 6, 12]}>
          {newNFTsDetected ? <NewCollectiblesNotice /> : null}
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

CollectiblesTab.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
};
