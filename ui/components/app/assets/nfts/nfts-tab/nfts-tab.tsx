import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { toHex } from '@metamask/controller-utils';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  getCurrentNetwork,
  getIsMainnet,
  getUseNftDetection,
  getNftIsStillFetchingIndication,
  getPreferences,
  getAllChainsToPoll,
} from '../../../../../selectors';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
  IconName,
  Text,
} from '../../../../component-library';
import NFTsDetectionNoticeNFTsTab from '../nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { getCurrentLocale } from '../../../../../ducks/locale/locale';
import Spinner from '../../../../ui/spinner';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import { useNfts } from '../../../../../hooks/useNfts';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
  showImportNftsModal,
} from '../../../../../store/actions';
import {
  ASSET_ROUTE,
  SECURITY_ROUTE,
} from '../../../../../helpers/constants/routes';
import NftGrid from '../nft-grid/nft-grid';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
///: END:ONLY_INCLUDE_IF
import { sortAssets } from '../../util/sort';
import AssetListControlBar from '../../asset-list/asset-list-control-bar';

export default function NftsTab() {
  const history = useHistory();
  const dispatch = useDispatch();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const { privacyMode } = useSelector(getPreferences);
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  const { nftsLoading, collections } = useNftsCollections();

  const { currentlyOwnedNfts, previouslyOwnedNfts } = useNfts();

  const hasAnyNfts = Object.keys(collections).length > 0;
  const showNftBanner = hasAnyNfts === false;
  const { chainId, nickname } = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);
  const allChainIds = useSelector(getAllChainsToPoll);

  useEffect(() => {
    if (nftsLoading || !showNftBanner) {
      return;
    }
    trackEvent({
      event: MetaMetricsEventName.EmptyNftsBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        chain_id: chainId,
        locale: currentLocale,
        network: nickname,
        referrer: ORIGIN_METAMASK,
      },
    });
  }, [
    nftsLoading,
    showNftBanner,
    trackEvent,
    chainId,
    nickname,
    currentLocale,
  ]);

  useEffect(() => {
    if (!nftsLoading && !nftsStillFetchingIndication) {
      endTrace({ name: TraceName.AccountOverviewNftsTab });
    }
  }, [nftsLoading, nftsStillFetchingIndication]);

  const handleNftClick = (nft: NFT) => {
    history.push(
      `${ASSET_ROUTE}/${toHex(nft.chainId)}/${nft.address}/${nft.tokenId}`,
    );
  };

  const onEnableAutoDetect = () => {
    history.push(SECURITY_ROUTE);
  };

  const onRefresh = () => {
    if (isMainnet) {
      dispatch(detectNfts(allChainIds));
    }
    checkAndUpdateAllNftsOwnershipStatus();
  };

  const sortedNfts = sortAssets(currentlyOwnedNfts, {
    key: 'collection.name',
    order: 'asc',
    sortCallback: 'alphaNumeric',
  });

  if (!hasAnyNfts && nftsStillFetchingIndication) {
    return (
      <Box
        className="nfts-tab__loading"
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        display={Display.Flex}
        marginTop={4}
      >
        <Spinner
          color="var(--color-warning-default)"
          className="loading-overlay__spinner"
        />
      </Box>
    );
  }

  return (
    <>
      <Box marginTop={2}>
        <AssetListControlBar
          showTokensLinks={false}
          showTokenFiatBalance={false}
        />
      </Box>

      <Box className="nfts-tab">
        {isMainnet && !useNftDetection ? (
          <Box paddingTop={4} paddingInlineStart={4} paddingInlineEnd={4}>
            <NFTsDetectionNoticeNFTsTab />
          </Box>
        ) : null}
        {hasAnyNfts || previouslyOwnedNfts.length > 0 ? (
          <Box>
            <NftGrid
              nfts={sortedNfts}
              handleNftClick={handleNftClick}
              privacyMode={privacyMode}
            />
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
                size={ButtonLinkSize.Md}
                data-testid="import-nft-button"
                startIconName={IconName.Add}
                onClick={() => {
                  dispatch(showImportNftsModal({}));
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
                        size={ButtonLinkSize.Md}
                        startIconName={IconName.Setting}
                        data-testid="refresh-list-button"
                        onClick={onEnableAutoDetect}
                      >
                        {t('enableAutoDetect')}
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        size={ButtonLinkSize.Md}
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
        ) : (
          <>
            <Box
              padding={12}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              alignItems={AlignItems.center}
              justifyContent={JustifyContent.center}
            >
              <Box
                paddingTop={6}
                marginTop={12}
                marginBottom={12}
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
                flexDirection={FlexDirection.Column}
                className="nfts-tab__link"
              >
                <Text
                  color={TextColor.textAlternative}
                  variant={TextVariant.bodyMdMedium}
                  textAlign={TextAlign.Center}
                >
                  {t('noNFTs')}
                </Text>
                {
                  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
                  <ButtonLink
                    size={ButtonLinkSize.Md}
                    href={ZENDESK_URLS.NFT_TOKENS}
                    externalLink
                  >
                    {t('learnMoreUpperCase')}
                  </ButtonLink>
                  ///: END:ONLY_INCLUDE_IF
                }
              </Box>
            </Box>
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
                size={ButtonLinkSize.Md}
                data-testid="import-nft-button"
                startIconName={IconName.Add}
                onClick={() => {
                  dispatch(showImportNftsModal({}));
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
                        size={ButtonLinkSize.Md}
                        startIconName={IconName.Setting}
                        data-testid="refresh-list-button"
                        onClick={onEnableAutoDetect}
                      >
                        {t('enableAutoDetect')}
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        size={ButtonLinkSize.Md}
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
          </>
        )}
      </Box>
    </>
  );
}
