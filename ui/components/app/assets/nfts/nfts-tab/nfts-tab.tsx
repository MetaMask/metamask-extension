import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { toHex } from '@metamask/controller-utils';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  getIsMainnet,
  getUseNftDetection,
  getNftIsStillFetchingIndication,
  getPreferences,
} from '../../../../../selectors';
import { Box } from '../../../../component-library';
import NFTsDetectionNoticeNFTsTab from '../nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import { useNfts } from '../../../../../hooks/useNfts';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import NftGrid from '../nft-grid/nft-grid';
import { sortAssets } from '../../util/sort';
import AssetListControlBar from '../../asset-list/asset-list-control-bar';
import PulseLoader from '../../../../ui/pulse-loader';
import { NftEmptyState } from '../nft-empty-state';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftsTab() {
  const navigate = useNavigate();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const { privacyMode } = useSelector(getPreferences);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );

  const { nftsLoading, collections } = useNftsCollections();

  const { currentlyOwnedNfts, previouslyOwnedNfts } = useNfts();

  const hasAnyNfts = Object.keys(collections).length > 0;

  useEffect(() => {
    if (!nftsLoading && !nftsStillFetchingIndication) {
      endTrace({ name: TraceName.AccountOverviewNftsTab });
    }
  }, [nftsLoading, nftsStillFetchingIndication]);

  const handleNftClick = (nft: NFT) => {
    navigate(
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
        paddingTop={4}
        paddingBottom={4}
      >
        <PulseLoader />
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
          <NftEmptyState className="mx-auto mt-5 mb-6" />
        )}
      </Box>
    </>
  );
}
