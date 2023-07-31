import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import NftsItems from '../nfts-items';
import {
  JustifyContent,
  FlexDirection,
  AlignItems,
  Size,
  Display,
  TextAlign,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsMainnet, getUseNftDetection } from '../../../selectors';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
  showImportNftsModal,
} from '../../../store/actions';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { Box, ButtonLink, IconName, Text } from '../../component-library';
import NftsDetectionNotice from '../nfts-detection-notice';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';

export default function NftsTab() {
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
          {isMainnet && !useNftDetection ? (
            <Box padding={4}>
              <NftsDetectionNotice />
            </Box>
          ) : null}
          <Box
            padding={12}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            <Box justifyContent={JustifyContent.center}>
              <img src="./images/no-nfts.svg" />
            </Box>
            <Box
              marginTop={4}
              marginBottom={12}
              display={Display.Flex}
              justifyContent={JustifyContent.center}
              alignItems={AlignItems.center}
              flexDirection={FlexDirection.Column}
              className="nfts-tab__link"
            >
              <Text
                color={TextColor.textMuted}
                variant={TextVariant.headingSm}
                align={TextAlign.Center}
                as="h4"
              >
                {t('noNFTs')}
              </Text>
              <ButtonLink
                size={Size.MD}
                href={ZENDESK_URLS.NFT_TOKENS}
                externalLink
              >
                {t('learnMoreUpperCase')}
              </ButtonLink>
            </Box>
          </Box>
        </>
      )}
      <Box
        className="nfts-tab__buttons"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        margin={4}
        gap={2}
        marginBottom={2}
      >
        <ButtonLink
          size={Size.MD}
          data-testid="import-nft-button"
          startIconName={IconName.Add}
          onClick={() => {
            dispatch(showImportNftsModal());
          }}
        >
          {t('importNFT')}
        </ButtonLink>
        {!isMainnet && Object.keys(collections).length < 1 ? null : (
          <>
            <Box
              className="nfts-tab__link"
              justifyContent={JustifyContent.flexEnd}
            >
              {isMainnet && !useNftDetection ? (
                <ButtonLink
                  size={Size.MD}
                  startIconName={IconName.Setting}
                  data-testid="refresh-list-button"
                  onClick={onEnableAutoDetect}
                >
                  {t('enableAutoDetect')}
                </ButtonLink>
              ) : (
                <ButtonLink
                  size={Size.MD}
                  startIconName={IconName.Refresh}
                  data-testid="refresh-list-button"
                  onClick={onRefresh}
                >
                  {t('refreshList')}
                </ButtonLink>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
