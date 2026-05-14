import React, { useState } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
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
import { useBatchSellQuotesFetching } from './hooks/useBatchSellQuotesFetching';

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
    sendAssetsConfig,
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

  const { data, isLoading } = useBatchSellQuotesFetching({
    sendAssetsConfig,
    receivedAsset: selectedReceiveAsset,
  });

  // TODO: if availableBatchSellAssetsForNetworkList or selectedAssetsId is empty render error

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full"
      data-testid="batch-sell-review-page"
    >
      <Header
        totalReceivedFiat={data?.totalReceivedAmountFiat}
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
        sendAssetsConfig={sendAssetsConfig}
        quotes={data?.quotes}
        onSendAmountPercentChange={setSendAmountPercent}
        onSlippagePercentChangeClick={(asset) =>
          setEditingSlippageAssetId(asset.assetId)
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
        sendAssetsConfig={sendAssetsConfig}
        quotes={data?.quotes}
        receivedAsset={{
          symbol: selectedReceiveAsset.symbol,
        }}
        totalReceivedAmount={data?.totalReceivedAmount}
        minimumReceivedAmount={data?.minimumReceivedAmount}
        onClose={() => setTotalReceivedAssetModalIsOpen(false)}
        open={totalReceivedModalIsOpen}
      />
      {editingSlippageAssetId !== null && (
        <SlippageModal
          open
          onClose={() => setEditingSlippageAssetId(null)}
          value={sendAssetsConfig[editingSlippageAssetId]?.slippagePercent}
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
