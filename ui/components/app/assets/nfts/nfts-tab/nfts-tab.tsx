import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toHex } from '@metamask/controller-utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonVariant,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  getIsMainnet,
  getUseNftDetection,
  getNftIsStillFetchingIndication,
  getUseExternalServices,
} from '../../../../../selectors';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';
import NFTsDetectionNoticeNFTsTab from '../nfts-detection-notice-nfts-tab/nfts-detection-notice-nfts-tab';
import { endTrace, TraceName } from '../../../../../../shared/lib/trace';
import { useNfts } from '../../../../../hooks/useNfts';
import { NFT } from '../../../../multichain/asset-picker-amount/asset-picker-modal/types';
import {
  ASSET_ROUTE,
  PRIVACY_ROUTE,
} from '../../../../../helpers/constants/routes';
import NftGrid from '../nft-grid/nft-grid';
import { sortAssets } from '../../util/sort';
import AssetListControlBar from '../../asset-list/asset-list-control-bar';
import { NftEmptyState } from '../nft-empty-state/nft-empty-state';
import { transitionForward } from '../../../../ui/transition';
import { useScreenViewedEvent } from '../../../../../hooks/useScreenViewedEvent';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  MetaMetricsEventName,
  ScreenViewedEntryPoint,
} from '../../../../../../shared/constants/metametrics';

export default function NftsTab({
  entryPoint,
}: Readonly<{
  entryPoint?: ScreenViewedEntryPoint;
}>) {
  const navigate = useNavigate();
  const t = useI18nContext();
  const useExternalServices = useSelector(getUseExternalServices);
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const { privacyMode } = useSelector(getPreferences);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );
  const { collections } = useNftsCollections();

  const { currentlyOwnedNfts, previouslyOwnedNfts } = useNfts();

  const hasAnyNfts = Object.keys(collections).length > 0;

  useEffect(() => {
    if (!nftsStillFetchingIndication) {
      endTrace({ name: TraceName.AccountOverviewNftsTab });
    }
  }, [nftsStillFetchingIndication]);

  useScreenViewedEvent(MetaMetricsEventName.NftScreenViewed, entryPoint);

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

  const hasNftsToShow = hasAnyNfts || previouslyOwnedNfts.length > 0;

  return (
    <>
      <Box>
        <AssetListControlBar
          showSortControl={false}
          data-testid="parent-selector-nfts-tab"
        />
      </Box>

      <Box className="nfts-tab">
        {useExternalServices ? (
          <>
            {isMainnet && !useNftDetection ? (
              <Box paddingTop={4} paddingHorizontal={4}>
                <NFTsDetectionNoticeNFTsTab />
              </Box>
            ) : null}
            {hasNftsToShow ? (
              <Box>
                <NftGrid
                  nfts={sortedNfts}
                  handleNftClick={handleNftClick}
                  privacyMode={privacyMode}
                />
              </Box>
            ) : (
              <NftEmptyState />
            )}
          </>
        ) : (
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={4}
            paddingTop={10}
            paddingBottom={10}
            data-testid="nfts-basic-functionality-off"
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
              className="max-w-64"
            >
              {t('perpsBasicFunctionalityOff')}
            </Text>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => navigate(PRIVACY_ROUTE)}
            >
              {t('basicFunctionalityRequired_reviewInSettings')}
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}
