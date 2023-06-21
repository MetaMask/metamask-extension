import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import NftsDetectionNotice from '../nfts-detection-notice';
import NftsItems from '../nfts-items';
import {
  TypographyVariant,
  TextAlign,
  JustifyContent,
  FlexDirection,
  FontWeight,
  AlignItems,
  TextColor,
  Size,
  Display,
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
import { Box, ButtonLink, IconName } from '../../component-library';

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
            <Box justifyContent={JustifyContent.center} display={Display.Flex}>
              <img src="./images/no-nfts.svg" />
            </Box>
            <Box
              marginTop={4}
              marginBottom={12}
              justifyContent={JustifyContent.center}
              flexDirection={FlexDirection.Column}
              className="nfts-tab__link"
            >
              <Typography
                color={TextColor.textMuted}
                variant={TypographyVariant.H4}
                align={TextAlign.Center}
                fontWeight={FontWeight.Bold}
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
        className="nfts-tab__buttons"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
        margin={4}
        gap={4}
      >
        <ButtonLink
          size={Size.MD}
          data-testid="import-nft-button"
          startIconName={IconName.Add}
          onClick={onAddNFT}
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

NftsTab.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
};
