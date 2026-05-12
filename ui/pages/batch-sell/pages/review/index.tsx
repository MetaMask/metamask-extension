import React, { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { CaipAssetType } from '@metamask/utils';
import { BatchSellNavigationState } from '../../../../hooks/batch-sell/useBatchSellNavigation';
import { BridgeAppState } from '../../../../ducks/bridge/selectors';
import {
  getAvailableBatchSellReceiveAssetsForNetwork as getAvailableBatchSellReceivedAssetsForNetwork,
  getAvailableBatchSellSwapAssetsForNetwork,
} from '../../../../ducks/batch-sell/selectors';
import {
  DEFAULT_SEND_AMOUNT_PERCENT,
  DEFAULT_SLIPPAGE_PERCENT,
} from '../../../../constants/batch-sell';
import { Header } from './components/Header';
import { QuotesList } from './components/QuotesList';
import { Footer } from './components/Footer';
import { SelectReceivedAssetModal } from './components/SelectReceivedAssetModal';
import { TotalReceivedModal } from './components/TotalReceivedModal';
import { BatchSellAsset } from 'ui/ducks/batch-sell/types';

export const BatchSellReviewPage = () => {
  const { state } = useLocation();
  const { selectedNetworkChainId, selectedAssetsId } = (state ??
    {}) as BatchSellNavigationState;
  const [selectReceivedAssetModalIsOpen, setSelectReceivedAssetModalIsOpen] =
    useState(false);
  const [totalReceivedModalIsOpen, setTotalReceivedAssetModalIsOpen] =
    useState(false);

  const receivedAssets = useSelector((_state: BridgeAppState) =>
    getAvailableBatchSellReceivedAssetsForNetwork(
      _state,
      selectedNetworkChainId ?? undefined,
    ).map((asset) => ({
      id: asset.assetId,
      symbol: asset.symbol,
      fiatBalance: asset.tokenFiatAmount,
      image: asset.iconUrl,
    })),
  );

  const availableBatchSellAssetsForNetworkList = useSelector((_state) =>
    getAvailableBatchSellSwapAssetsForNetwork(
      _state,
      selectedNetworkChainId ?? null,
    ).filter((asset) => selectedAssetsId?.includes(asset.assetId)),
  );

  const [selectedReceiveAsset, setSelectedReceiveAsset] = useState(
    receivedAssets[0],
  );

  const [quoteConfigs, setQuoteConfigs] = useState(() =>
    Object.fromEntries(
      availableBatchSellAssetsForNetworkList.map((asset) => [
        asset.assetId,
        {
          asset,
          sendAmountPercent: DEFAULT_SEND_AMOUNT_PERCENT,
          slippagePercent: DEFAULT_SLIPPAGE_PERCENT,
        },
      ]),
    ),
  );

  const canDeleteAssets = useMemo(
    () => Object.values(quoteConfigs).length > 2,
    [quoteConfigs],
  );

  const onSelectReceivedAsset = useCallback(
    (assetId: CaipAssetType) => {
      const newAsset = receivedAssets.find((asset) => asset.id === assetId);
      if (newAsset) {
        setSelectedReceiveAsset(newAsset);
        setSelectReceivedAssetModalIsOpen(false);
      }
    },
    [receivedAssets],
  );

  const onQuoteSendAmountPercentChange = useCallback(
    (asset: BatchSellAsset, newSendAmountPercent: number) => {
      setQuoteConfigs((config) => ({
        ...config,
        [asset.assetId]: {
          ...config[asset.assetId],
          sendAmountPercent: newSendAmountPercent,
        },
      }));
    },
    [],
  );

  const onAssetDeleteClick = useCallback((asset: BatchSellAsset) => {
    setQuoteConfigs((config) => {
      const update = { ...config };
      delete update[asset.assetId];
      return update;
    });
  }, []);

  console.log(
    'availableBatchSellAssetsForNetworkList',
    availableBatchSellAssetsForNetworkList,
  );

  // TODO: if availableBatchSellAssetsForNetworkList or selectedAssetsId is empty render error

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
        onSelectReceivedAssetClick={() =>
          setSelectReceivedAssetModalIsOpen(true)
        }
      />
      <QuotesList
        config={quoteConfigs}
        onSendAmountPercentChange={onQuoteSendAmountPercentChange}
        onSlippagePercentChangeClick={console.log}
        onAssetDeleteClick={onAssetDeleteClick}
        canDeleteAssets={canDeleteAssets}
      />
      <Footer />
      <SelectReceivedAssetModal
        assets={receivedAssets}
        selectedAssetId={selectedReceiveAsset.id}
        onClose={() => setSelectReceivedAssetModalIsOpen(false)}
        open={selectReceivedAssetModalIsOpen}
        onSelectAsset={onSelectReceivedAsset}
      />
      <TotalReceivedModal
        sendAssets={[
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
