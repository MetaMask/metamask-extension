import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Box } from '../../../component-library';
import Spinner from '../../../ui/spinner';
import {
  getIsMainnet,
  getNftIsStillFetchingIndication,
  getUseNftDetection,
} from '../../../../selectors';
import NFTsDetectionNoticeNFTsTab from '../../../app/assets/nfts/nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import NftGrid from '../../../app/assets/nfts/nft-grid/nft-grid';
import { useNfts } from '../../../../hooks/useNfts';
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
import { useRedesignedSendFlow } from '../../../../pages/confirmations/hooks/useRedesignedSendFlow';
import { navigateToSendRoute } from '../../../../pages/confirmations/utils/send';
import { NftEmptyState } from '../../../app/assets/nfts/nft-empty-state';
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );
  const { enabled: isSendRedesignEnabled } = useRedesignedSendFlow();

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
        event: MetaMetricsEventName.SendAssetSelected,
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
    navigateToSendRoute(navigate, isSendRedesignEnabled, {
      address: nft.address,
      chainId: nft.chainId,
    });
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
          <NftEmptyState className="mx-auto mt-5 mb-6" />
        </>
      )}
    </Box>
  );
}
