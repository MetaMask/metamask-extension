import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
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
import { getNftImageAlt } from '../../../../../helpers/utils/nfts';
import { NftItem } from '../../../../multichain/nft-item';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { showImportNftsModal } from '../../../../../store/actions';

export default function NftsTab() {
  const dispatch = useDispatch();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );
  const currentChain = useSelector(getCurrentNetwork) as {
    chainId: Hex;
    nickname: string;
    rpcPrefs?: { imageUrl: string };
  };

  const { nftsLoading, collections, previouslyOwnedCollection } =
    useNftsCollections();

  const { currentlyOwnedNfts } = useNfts();

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

  if (!hasAnyNfts && nftsStillFetchingIndication) {
    return (
      <Box className="nfts-tab__loading">
        <Spinner
          color="var(--color-warning-default)"
          className="loading-overlay__spinner"
        />
      </Box>
    );
  }

  return (
    <>
      <Box className="nfts-tab">
        {isMainnet && !useNftDetection ? (
          <Box paddingTop={4} paddingInlineStart={4} paddingInlineEnd={4}>
            <NFTsDetectionNoticeNFTsTab />
          </Box>
        ) : null}
        {hasAnyNfts || previouslyOwnedCollection.nfts.length > 0 ? (
          <Box display={Display.Grid} gap={4} className="nft-items__wrapper">
            {/* <NftsItems
              collections={collections}
              previouslyOwnedCollection={previouslyOwnedCollection}
            /> */}
            {currentlyOwnedNfts.map((nft: NFT) => {
              const { image, imageOriginal, tokenURI } = nft;
              const nftImageAlt = getNftImageAlt(nft);

              const isIpfsURL = (
                imageOriginal ??
                image ??
                tokenURI
              )?.startsWith('ipfs:');
              return (
                <Box
                  data-testid="nft-wrapper"
                  key={tokenURI}
                  className="nft-items__image-wrapper"
                >
                  <NftItem
                    nft={nft}
                    alt={nftImageAlt}
                    src={image ?? ''}
                    networkName={currentChain.nickname}
                    networkSrc={currentChain.rpcPrefs?.imageUrl}
                    onClick={() => console.log('click')}
                    isIpfsURL={isIpfsURL}
                    clickable
                  />
                </Box>
              );
            })}

            {nftsStillFetchingIndication ? (
              <Box className="nfts-tab__fetching">
                <Spinner
                  color="var(--color-warning-default)"
                  className="loading-overlay__spinner"
                />
              </Box>
            ) : null}
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
                        // onClick={onEnableAutoDetect}
                        onClick={() => console.log('enable autodetect')}
                      >
                        {t('enableAutoDetect')}
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        size={ButtonLinkSize.Md}
                        startIconName={IconName.Refresh}
                        data-testid="refresh-list-button"
                        // onClick={onRefresh}
                        onClick={() => console.log('refresh list')}
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
                  textAlign={TextAlign.Center}
                  as="h4"
                >
                  {t('noNFTs')}
                </Text>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </>
  );
}
