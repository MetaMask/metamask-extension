import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Text,
  ButtonLink,
  ButtonLinkSize,
} from '../../../component-library';
import {
  TextColor,
  TextVariant,
  TextAlign,
  Display,
  JustifyContent,
  AlignItems,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import Spinner from '../../../ui/spinner';
import {
  getIsMainnet,
  getNftIsStillFetchingIndication,
  getUseNftDetection,
} from '../../../../selectors';
import NFTsDetectionNoticeNFTsTab from '../../../app/assets/nfts/nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import NftGrid from '../../../app/assets/nfts/nft-grid/nft-grid';
import { useNfts } from '../../../../hooks/useNfts';
import { SEND_ROUTE } from '../../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { AssetType } from '../../../../../shared/constants/transaction';
import {
  getSendAnalyticProperties,
  updateSendAsset,
} from '../../../../ducks/send';
import { NFT } from './types';

export type PreviouslyOwnedCollections = {
  collectionName: string;
  nfts: NFT[];
};

type AssetPickerModalNftTabProps = {
  searchQuery: string;
  onClose: () => void;
  renderSearch: () => void;
};

export function AssetPickerModalNftTab({
  searchQuery,
  onClose,
  renderSearch,
}: AssetPickerModalNftTabProps) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const history = useHistory();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  const { currentlyOwnedNfts } = useNfts();
  const trackEvent = useContext(MetaMetricsContext);
  const sendAnalytics = useSelector(getSendAnalyticProperties);

  const filteredNfts = currentlyOwnedNfts.reduce((acc: NFT[], nft: NFT) => {
    // Assuming `nft` has a `name` property
    const isMatchingQuery = nft.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (isMatchingQuery) {
      acc.push(nft);
    }

    return acc;
  }, []);

  const hasAnyNfts = filteredNfts.length > 0;

  const handleNftClick = async (nft: NFT) => {
    trackEvent(
      {
        event: MetaMetricsEventName.sendAssetSelected,
        category: MetaMetricsEventCategory.Send,
        properties: {
          is_destination_asset_picker_modal: false,
          is_nft: true,
        },
        sensitiveProperties: {
          ...sendAnalytics,
          new_asset_symbol: nft.name,
          new_asset_address: nft.address,
        },
      },
      { excludeMetaMetricsId: false },
    );
    await dispatch(
      updateSendAsset({
        type: AssetType.NFT,
        details: nft,
        skipComputeEstimatedGasLimit: false,
      }),
    );
    history.push(SEND_ROUTE);
    onClose && onClose();
  };

  if (!hasAnyNfts && nftsStillFetchingIndication) {
    return (
      <Box className="modal-tab__loading" data-testid="spinner">
        <Spinner
          color="var(--color-warning-default)"
          className="loading-overlay__spinner"
        />
      </Box>
    );
  }

  return (
    <Box className="modal-tab__main-view">
      {renderSearch()}
      {hasAnyNfts ? (
        <>
          <Box>
            <NftGrid nfts={filteredNfts} handleNftClick={handleNftClick} />
          </Box>
          {nftsStillFetchingIndication && (
            <Box className="modal-tab__fetching">
              <Spinner
                color="var(--color-warning-default)"
                className="loading-overlay__spinner"
              />
            </Box>
          )}
        </>
      ) : (
        <>
          {isMainnet && !useNftDetection && (
            <Box paddingTop={4} paddingInlineStart={4} paddingInlineEnd={4}>
              <NFTsDetectionNoticeNFTsTab />
            </Box>
          )}
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
              <ButtonLink
                size={ButtonLinkSize.Sm}
                href={ZENDESK_URLS.NFT_TOKENS}
                externalLink
              >
                {t('learnMoreUpperCase')}
              </ButtonLink>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
