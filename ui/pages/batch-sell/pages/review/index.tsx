import React, { useState } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { CaipAssetType } from '@metamask/utils';
import {
  LOW_SLIPPAGE_PERCENT_THRESHOLD,
  SLIPPAGE_PERCENT_OPTIONS,
} from '../../../../constants/batch-sell';
import { useBatchSellQuotesConfig } from './hooks/useBatchSellQuotesConfig';
import { Header } from './components/Header';
import { QuotesList } from './components/QuotesList';
import { Footer } from './components/Footer';
import { SelectReceivedAssetModal } from './components/SelectReceivedAssetModal';
import { TotalReceivedModal } from './components/TotalReceivedModal';
import { SlippageModal } from './components/SlippageModal';
import { ReviewAndConfirmModal } from './components/ReviewAndConfirmModal';

// TODO: reduce slippage optuions to the same of swaps
// TODO: make modal heading variants consistent with other modals
// TODO: loading states
// TODO: wire up useBatchSellQuotesFetching
// TODO: No quotes available badge
// TODO: high price impact badge
// TODO: receive modal
// CASE: no quotes available for any asset should disable the info button and review
// CASE: no quotes available for some assets should not render row in review
// TODO: add test ids
// TODO: write tests

export const BatchSellReviewPage = () => {
  const [selectReceivedAssetModalIsOpen, setSelectReceivedAssetModalIsOpen] =
    useState(false);
  const [reviewAndConfirmModalIsOpen, setReviewAndConfirmModalIsOpen] =
    useState(false);
  const [totalReceivedModalIsOpen, setTotalReceivedAssetModalIsOpen] =
    useState(false);

  const {
    quoteConfigs,
    selectedReceiveAsset,
    editingSlippageAssetId,
    canDeleteAssets,
    receivedAssets,
    setSendAmountPercent,
    setSlippagePercent,
    setEditingSlippageAssetId,
    selectReceivedAsset,
    deleteAsset,
  } = useBatchSellQuotesConfig();

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
        sendAssets={quoteConfigs}
        onSendAmountPercentChange={setSendAmountPercent}
        onSlippagePercentChangeClick={(asset) =>
          setEditingSlippageAssetId(asset.assetId as CaipAssetType)
        }
        onAssetDeleteClick={deleteAsset}
        canDeleteAssets={canDeleteAssets}
      />
      <Footer
        onReviewClick={() => setReviewAndConfirmModalIsOpen(true)}
        reviewIsDisabled={false}
      />
      <SelectReceivedAssetModal
        assets={receivedAssets}
        selectedAssetId={selectedReceiveAsset.id}
        onClose={() => setSelectReceivedAssetModalIsOpen(false)}
        open={selectReceivedAssetModalIsOpen}
        onSelectAsset={(assetId) => {
          selectReceivedAsset(assetId);
          setSelectReceivedAssetModalIsOpen(false);
        }}
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
      {editingSlippageAssetId !== null && (
        <SlippageModal
          open
          onClose={() => setEditingSlippageAssetId(null)}
          value={quoteConfigs[editingSlippageAssetId]?.slippagePercent}
          onChange={setSlippagePercent}
          slippageOptions={SLIPPAGE_PERCENT_OPTIONS}
          warningSlippageTheshold={LOW_SLIPPAGE_PERCENT_THRESHOLD}
        />
      )}
      <ReviewAndConfirmModal
        open={reviewAndConfirmModalIsOpen}
        onClose={() => setReviewAndConfirmModalIsOpen(false)}
      />
    </Box>
  );
};
