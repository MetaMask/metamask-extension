import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import CollectiblesDetectionNotice from '../collectibles-detection-notice';
import CollectiblesItems from '../collectibles-items';
import {
  TypographyVariant,
  TEXT_ALIGN,
  JustifyContent,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  AlignItems,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsMainnet, getUseNftDetection } from '../../../selectors';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
} from '../../../store/actions';
import { useCollectiblesCollections } from '../../../hooks/useCollectiblesCollections';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

export default function CollectiblesTab({ onAddNFT }) {
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { collectiblesLoading, collections, previouslyOwnedCollection } =
    useCollectiblesCollections();

  const onEnableAutoDetect = () => {
    history.push(EXPERIMENTAL_ROUTE);
  };

  const onRefresh = () => {
    if (isMainnet) {
      dispatch(detectNfts());
    }
    checkAndUpdateAllNftsOwnershipStatus();
  };

  if (collectiblesLoading) {
    return <div className="collectibles-tab__loading">{t('loadingNFTs')}</div>;
  }

  return (
    <Box className="collectibles-tab">
      {Object.keys(collections).length > 0 ||
      previouslyOwnedCollection.collectibles.length > 0 ? (
        <CollectiblesItems
          collections={collections}
          previouslyOwnedCollection={previouslyOwnedCollection}
        />
      ) : (
        <>
          {isMainnet && !useNftDetection ? (
            <CollectiblesDetectionNotice />
          ) : null}
          <Box padding={12}>
            <Box justifyContent={JustifyContent.center}>
              <img src="./images/no-nfts.svg" />
            </Box>
            <Box
              marginTop={4}
              marginBottom={12}
              justifyContent={JustifyContent.center}
              flexDirection={FLEX_DIRECTION.COLUMN}
              className="collectibles-tab__link"
            >
              <Typography
                color={TextColor.textMuted}
                variant={TypographyVariant.H4}
                align={TEXT_ALIGN.CENTER}
                fontWeight={FONT_WEIGHT.BOLD}
              >
                {t('noNFTs')}
              </Typography>
              <Button
                type="link"
                target="_blank"
                rel="noopener noreferrer"
                href={ZENDESK_URLS.NFT_TOKENS}
              >
                {t('learnMoreUpperCase')}
              </Button>
            </Box>
          </Box>
        </>
      )}
      <Box
        marginBottom={4}
        justifyContent={JustifyContent.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Typography
          color={TextColor.textMuted}
          variant={TypographyVariant.H5}
          align={TEXT_ALIGN.CENTER}
        >
          {t('missingNFT')}
        </Typography>
        <Box
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          {!isMainnet && Object.keys(collections).length < 1 ? null : (
            <>
              <Box
                className="collectibles-tab__link"
                justifyContent={JustifyContent.flexEnd}
              >
                {isMainnet && !useNftDetection ? (
                  <Button type="link" onClick={onEnableAutoDetect}>
                    {t('enableAutoDetect')}
                  </Button>
                ) : (
                  <Button type="link" onClick={onRefresh}>
                    {t('refreshList')}
                  </Button>
                )}
              </Box>
              <Typography
                color={TextColor.textMuted}
                variant={TypographyVariant.H6}
                align={TEXT_ALIGN.CENTER}
              >
                {t('or')}
              </Typography>
            </>
          )}
          <Box
            justifyContent={JustifyContent.flexStart}
            className="collectibles-tab__link"
          >
            <Button type="link" onClick={onAddNFT}>
              {t('importNFTs')}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

CollectiblesTab.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
};
