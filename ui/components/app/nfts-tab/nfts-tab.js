import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Box from '../../ui/box';
import Button from '../../ui/button';
import NftsDetectionNotice from '../nfts-detection-notice';
import NftsItems from '../nfts-items';
import {
  TextVariant,
  TextAlign,
  JustifyContent,
  FLEX_DIRECTION,
  FontWeight,
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
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { Text } from '../../component-library';

export default function NftsTab({ onAddNFT }) {
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const { nftsLoading, collections, previouslyOwnedCollection } =
    useNftsCollections();

  const onEnableAutoDetect = () => {
    history.push(EXPERIMENTAL_ROUTE);
  };

  const onRefresh = () => {
    if (isMainnet) {
      dispatch(detectNfts());
    }
    checkAndUpdateAllNftsOwnershipStatus();
  };

  if (nftsLoading) {
    return <div className="nfts-tab__loading">{t('loadingNFTs')}</div>;
  }

  return (
    <Box className="nfts-tab">
      {Object.keys(collections).length > 0 ||
      previouslyOwnedCollection.nfts.length > 0 ? (
        <NftsItems
          collections={collections}
          previouslyOwnedCollection={previouslyOwnedCollection}
        />
      ) : (
        <>
          {isMainnet && !useNftDetection ? <NftsDetectionNotice /> : null}
          <Box padding={12}>
            <Box justifyContent={JustifyContent.center}>
              <img src="./images/no-nfts.svg" />
            </Box>
            <Box
              marginTop={4}
              marginBottom={12}
              justifyContent={JustifyContent.center}
              flexDirection={FLEX_DIRECTION.COLUMN}
              className="nfts-tab__link"
            >
              <Text
                color={TextColor.textMuted}
                variant={TextVariant.headingSm}
                as="h4"
                align={TextAlign.Center}
                fontWeight={FontWeight.Bold}
              >
                {t('noNFTs')}
              </Text>
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
        <Text
          color={TextColor.textMuted}
          variant={TextVariant.bodyMd}
          as="h5"
          align={TextAlign.Center}
        >
          {t('missingNFT')}
        </Text>
        <Box
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          {!isMainnet && Object.keys(collections).length < 1 ? null : (
            <>
              <Box
                className="nfts-tab__link"
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
              <Text
                color={TextColor.textMuted}
                variant={TextVariant.bodySm}
                as="h6"
                align={TextAlign.Center}
              >
                {t('or')}
              </Text>
            </>
          )}
          <Box
            justifyContent={JustifyContent.flexStart}
            className="nfts-tab__link"
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

NftsTab.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
};
