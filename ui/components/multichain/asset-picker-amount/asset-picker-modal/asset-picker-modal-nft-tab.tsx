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
import { getNftImage } from '../../../../helpers/utils/nfts';
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

  const { currentlyOwnedNfts } = useNfts({
    overridePopularNetworkFilter: true,
  });

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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_destination_asset_picker_modal: false,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_nft: true,
        },
        sensitiveProperties: {
          ...sendAnalytics,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_asset_symbol: nft.name,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_asset_address: nft.address,
        },
      },
      { excludeMetaMetricsId: false },
    );

    const nftWithSimplifiedImage = {
      ...nft,
      image: getNftImage(nft.image),
    };

    await dispatch(
      updateSendAsset({
        type: AssetType.NFT,
        details: nftWithSimplifiedImage,
        skipComputeEstimatedGasLimit: false,
      }),
    );
    const queryParams = new URLSearchParams();
    queryParams.append('asset', nft.address);
    history.push(`${SEND_ROUTE}/amount-recipient?${queryParams.toString()}`);
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
            {/* TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879 */}
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
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
            <Box
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
