import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  Size,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { SECURITY_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import {
  getCurrentNetwork,
  getIsMainnet,
  getUseNftDetection,
} from '../../../selectors';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
  showImportNftsModal,
} from '../../../store/actions';
import { Box, ButtonLink, IconName, Text } from '../../component-library';
import NFTsDetectionNoticeNFTsTab from '../nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import NftsItems from '../nfts-items';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import { AssetListConversionButton } from '../../multichain';
import { ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES } from '../../multichain/asset-list-conversion-button/asset-list-conversion-button';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
///: END:ONLY_INCLUDE_IF
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getCurrentLocale } from '../../../ducks/locale/locale';

export default function NftsTab() {
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const { nftsLoading, collections, previouslyOwnedCollection } =
    useNftsCollections();

  const onEnableAutoDetect = () => {
    history.push(SECURITY_ROUTE);
  };

  const onRefresh = () => {
    if (isMainnet) {
      dispatch(detectNfts());
    }
    checkAndUpdateAllNftsOwnershipStatus();
  };

  const hasAnyNfts = Object.keys(collections).length > 0;
  const showNftBanner = hasAnyNfts === false;
  const currentNetwork = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);
  useEffect(() => {
    if (!showNftBanner) {
      return;
    }
    trackEvent({
      event: MetaMetricsEventName.EmptyNftsBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        chain_id: currentNetwork.chainId,
        locale: currentLocale,
        network: currentNetwork.nickname,
        referrer: ORIGIN_METAMASK,
      },
    });
  }, [showNftBanner, trackEvent, currentNetwork, currentLocale]);

  if (nftsLoading) {
    return <div className="nfts-tab__loading">{t('loadingNFTs')}</div>;
  }

  return (
    <Box className="nfts-tab">
      {hasAnyNfts > 0 || previouslyOwnedCollection.nfts.length > 0 ? (
        <NftsItems
          collections={collections}
          previouslyOwnedCollection={previouslyOwnedCollection}
        />
      ) : (
        <>
          {isMainnet && !useNftDetection ? (
            <Box paddingTop={4} paddingInlineStart={4} paddingInlineEnd={4}>
              <NFTsDetectionNoticeNFTsTab />
            </Box>
          ) : null}
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
            showNftBanner ? (
              <Box
                paddingInlineStart={4}
                paddingInlineEnd={4}
                display={Display.Flex}
                paddingTop={4}
              >
                <AssetListConversionButton
                  variant={ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.NFT}
                  onClick={() => {
                    global.platform.openTab({ url: ZENDESK_URLS.NFT_TOKENS });
                    trackEvent({
                      event: MetaMetricsEventName.EmptyNftsBannerClicked,
                      properties: {
                        chain_id: currentNetwork.chainId,
                        locale: currentLocale,
                        network: currentNetwork.nickname,
                        referrer: ORIGIN_METAMASK,
                      },
                    });
                  }}
                />
              </Box>
            ) : null
            ///: END:ONLY_INCLUDE_IF
          }
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
              {
                ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
                <ButtonLink
                  size={Size.MD}
                  href={ZENDESK_URLS.NFT_TOKENS}
                  externalLink
                >
                  {t('learnMoreUpperCase')}
                </ButtonLink>
                ///: END:ONLY_INCLUDE_IF
              }
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
