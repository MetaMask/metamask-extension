import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
} from '../../../../../selectors';
import {
  Box,
  ButtonLink,
  ButtonLinkSize,
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
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import { useNfts } from '../../../../../hooks/useNfts';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import NftGrid from '../nft-grid/nft-grid';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { sortAssets } from '../../util/sort';
import AssetListControlBar from '../../asset-list/asset-list-control-bar';
import PulseLoader from '../../../../ui/pulse-loader';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftsTab() {
  const history = useHistory();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const { privacyMode } = useSelector(getPreferences);
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  const { nftsLoading, collections } = useNftsCollections();

  const { currentlyOwnedNfts, previouslyOwnedNfts } = useNfts();

  const hasAnyNfts = Object.keys(collections).length > 0;
  const showNftBanner = hasAnyNfts === false;
  const { chainId, nickname } = useSelector(getCurrentNetwork);
  const currentLocale = useSelector(getCurrentLocale);

  useEffect(() => {
    if (nftsLoading || !showNftBanner) {
      return;
    }
    trackEvent({
      event: MetaMetricsEventName.EmptyNftsBannerDisplayed,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
        <Box marginTop={4} marginBottom={4}>
          <PulseLoader />
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Box>
        <AssetListControlBar />
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
                  <ButtonLink
                    size={ButtonLinkSize.Md}
                    href={ZENDESK_URLS.NFT_TOKENS}
                    externalLink
                  >
                    {t('learnMoreUpperCase')}
                  </ButtonLink>
                }
              </Box>
            </Box>
          </>
        )}
      </Box>
    </>
  );
}
