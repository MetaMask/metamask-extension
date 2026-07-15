import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toHex } from '@metamask/controller-utils';
import { Box } from '@metamask/design-system-react';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  getIsMainnet,
  getUseNftDetection,
  getNftIsStillFetchingIndication,
  selectEnabledNetworksAsCaipChainIds,
} from '../../../../../selectors';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import NFTsDetectionNoticeNFTsTab from '../nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import { useNfts } from '../../../../../hooks/useNfts';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import NftGrid from '../nft-grid/nft-grid';
import { sortAssets } from '../../util/sort';
import AssetListControlBar from '../../asset-list/asset-list-control-bar';
import { NftEmptyState } from '../nft-empty-state';
import { transitionForward } from '../../../../ui/transition';
import { useAnalytics } from '../../../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../../../../../shared/constants/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NftsTab({
  entryPoint,
}: Readonly<{
  entryPoint?: ScreenViewedEntryPoint;
}>) {
  const navigate = useNavigate();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const { privacyMode } = useSelector(getPreferences);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );
  const { trackEvent, createEventBuilder } = useAnalytics();
  const networkFilter = useSelector(selectEnabledNetworksAsCaipChainIds);

  const { collections } = useNftsCollections();

  const { currentlyOwnedNfts, previouslyOwnedNfts } = useNfts();

  const hasAnyNfts = Object.keys(collections).length > 0;

  useEffect(() => {
    if (!nftsStillFetchingIndication) {
      endTrace({ name: TraceName.AccountOverviewNftsTab });
    }
  }, [nftsStillFetchingIndication]);

  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current) {
      return;
    }
    hasTrackedRef.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NftScreenViewed)
        .addCategory(MetaMetricsEventCategory.Home)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          network_filter: networkFilter,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          entry_point: entryPoint,
        })
        .build(),
    );
  }, [trackEvent, createEventBuilder, networkFilter, entryPoint]);

  const handleNftClick = (nft: NFT) => {
    transitionForward(() =>
      navigate(
        `${ASSET_ROUTE}/${toHex(nft.chainId)}/${nft.address}/${nft.tokenId}`,
      ),
    );
  };

  const sortedNfts = sortAssets(currentlyOwnedNfts, {
    key: 'collection.name',
    order: 'asc',
    sortCallback: 'alphaNumeric',
  });

  return (
    <>
      <Box>
        <AssetListControlBar />
      </Box>

      <Box className="nfts-tab">
        {isMainnet && !useNftDetection ? (
          <Box paddingTop={4} paddingHorizontal={4}>
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
