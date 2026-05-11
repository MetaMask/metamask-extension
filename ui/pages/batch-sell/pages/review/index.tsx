import React, { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { CaipAssetType } from '@metamask/utils';
import { BatchSellNavigationState } from '../../../../hooks/batch-sell/useBatchSellNavigation';
import { BridgeAppState } from '../../../../ducks/bridge/selectors';
import { getAvailableBatchSellReceiveAssetsForNetwork } from '../../../../ducks/batch-sell/selectors';
import { Header } from './components/Header';
import { QuotesList } from './components/QuotesList';
import { Footer } from './components/Footer';
import { SelectReceiveAssetModal } from './components/SelectReceiveAssetModal';
import { TotalReceiveModal } from './components/TotalReceiveModal';

export const BatchSellReviewPage = () => {
  const { state } = useLocation();
  const { selectedNetworkChainId, selectedAssetsId } = (state ??
    {}) as BatchSellNavigationState;
  const [selectReceiveAssetModalIsOpen, setSelectReceiveAssetModalIsOpen] =
    useState(false);
  const [totalReceivedModalIsOpen, setTotalReceivedAssetModalIsOpen] =
    useState(false);

  const receiveAssets = useSelector((_state: BridgeAppState) =>
    getAvailableBatchSellReceiveAssetsForNetwork(
      _state,
      selectedNetworkChainId ?? undefined,
    ).map((asset) => ({
      id: asset.assetId,
      symbol: asset.symbol,
      fiatBalance: asset.tokenFiatAmount,
      image: asset.iconUrl,
    })),
  );

  const [selectedReceiveAsset, setSelectedReceiveAsset] = useState(
    receiveAssets[0],
  );

  const onSelectAsset = useCallback(
    (assetId: CaipAssetType) => {
      const newAsset = receiveAssets.find((asset) => asset.id === assetId);
      if (newAsset) {
        setSelectedReceiveAsset(newAsset);
        setSelectReceiveAssetModalIsOpen(false);
      }
    },
    [receiveAssets],
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full"
      data-testid="batch-sell-review-page"
    >
      <Header
        totalReceivedFiat={343454.3}
        selectedAsset={{
          symbol: selectedReceiveAsset.symbol,
          image: selectedReceiveAsset.image,
        }}
        onTotalReceivedFiatIconClick={() =>
          setTotalReceivedAssetModalIsOpen(true)
        }
        onSelectAssetClick={() => setSelectReceiveAssetModalIsOpen(true)}
      />
      <QuotesList />
      <Footer />
      <SelectReceiveAssetModal
        assets={receiveAssets}
        selectedAssetId={selectedReceiveAsset.id}
        onClose={() => setSelectReceiveAssetModalIsOpen(false)}
        open={selectReceiveAssetModalIsOpen}
        onSelectAsset={onSelectAsset}
      />
      <TotalReceiveModal
        sentAssets={[
          {
            id: '1',
            symbol: 'ETH',
            slippagePercent: 5,
            receivedAmount: 3456.78,
          },
          {
            id: '2',
            symbol: 'UNI',
            slippagePercent: 5,
            receivedAmount: 834.2,
          },
        ]}
        receivedAsset={{
          symbol: selectedReceiveAsset.symbol,
        }}
        totalReceivedAmount={7638.23}
        minimumReceivedAmount={7485.47}
        onClose={() => setTotalReceivedAssetModalIsOpen(false)}
        open={totalReceivedModalIsOpen}
      />
    </Box>
  );
};
