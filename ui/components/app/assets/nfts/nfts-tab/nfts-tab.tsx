import React, { useCallback, useEffect, useMemo } from 'react';
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
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getAllEnabledNetworksForAllNamespaces } from '#ui/selectors/multichain/networks';
import {
  checkAndUpdateAllNftsOwnershipStatus,
  detectNfts,
} from '#ui/store/actions';
import { useDispatch } from '#ui/store/hooks';
import { OverflowMenu } from '#ui/components/ui/overflow-menu/overflow-menu';
import { useNftsCollections } from '../../../../../hooks/useNftsCollections';
import {
  getAllChainsToPoll,
  getIsLineaMainnet,
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
  ASSETS_ROUTE,
  IMPORT_NFTS_ROUTE,
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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useI18nContext();
  const useExternalServices = useSelector(getUseExternalServices);
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const isLineaMainnet = useSelector(getIsLineaMainnet);
  const { privacyMode } = useSelector(getPreferences);
  const nftsStillFetchingIndication = useSelector(
    getNftIsStillFetchingIndication,
  );
  const { collections } = useNftsCollections();
  const allChainIds = useSelector(getAllChainsToPoll);
  const allNetworkClientIds = useSelector(
    getAllEnabledNetworksForAllNamespaces,
  );

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

  const handleNftRefresh = useCallback(() => {
    if (isMainnet || isLineaMainnet) {
      dispatch(detectNfts(allChainIds));
    }
    allNetworkClientIds.forEach((networkClientId) => {
      checkAndUpdateAllNftsOwnershipStatus(networkClientId);
    });
  }, [dispatch, isMainnet, isLineaMainnet, allChainIds, allNetworkClientIds]);

  const shouldShowRefreshButtons = useExternalServices;
  const shouldShowEnableAutoDetect =
    isMainnet && !useNftDetection && !privacyMode;

  const nftMenuItems = useMemo(
    () => [
      {
        key: 'import-nft',
        label: t('importNFT'),
        iconName: IconName.Add,
        'data-testid': 'import-nfts__button',
        to: IMPORT_NFTS_ROUTE,
      },
      ...(shouldShowRefreshButtons
        ? [
            {
              key: 'refresh-nfts',
              label: t('refreshList'),
              iconName: IconName.Refresh,
              onClick: handleNftRefresh,
            },
          ]
        : []),
      ...(shouldShowEnableAutoDetect
        ? [
            {
              key: 'enable-autodetect',
              label: t('enableAutoDetect'),
              iconName: IconName.Setting,
              to: `${ASSETS_ROUTE}#autodetect-tokens`,
            },
          ]
        : []),
    ],
    [t, shouldShowRefreshButtons, handleNftRefresh, shouldShowEnableAutoDetect],
  );

  return (
    <>
      <Box>
        <AssetListControlBar
          showSortControl={false}
          actionMenu={
            <OverflowMenu
              ariaLabel={t('assetOptions')}
              items={nftMenuItems}
              testId="asset-list-control-bar-action-button"
            />
          }
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
