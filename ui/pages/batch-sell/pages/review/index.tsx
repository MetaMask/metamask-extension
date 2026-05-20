import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  LOW_SLIPPAGE_PERCENT_THRESHOLD,
  SLIPPAGE_PERCENT_OPTIONS,
} from '../../../../constants/batch-sell';
import { BATCH_SELL_SELECT_ROUTE } from '../../../../helpers/constants/routes';
import { getBatchSellTrades } from '../../../../ducks/batch-sell/selectors';
import { useBatchSellQuotesConfig } from './hooks/useBatchSellQuotesConfig';
import { Header } from './components/header';
import { QuotesList } from './components/quotes-list';
import { Footer } from './components/footer';
import { SelectReceivedAssetModal } from './components/select-received-asset-modal';
import { TotalReceivedModal } from './components/total-received-modal';
import { SlippageModal } from './components/slippage-modal';
import { ReviewAndConfirmModal } from './components/review-and-confirm-modal';
import { useBatchSellQuotesFetching } from './hooks/useBatchSellQuotesFetching';
import { useBatchSellTradesFetching } from './hooks/useBatchSellTradesFetching';
import { useBatchSellAggregateValidation } from './hooks/useBatchSellAggregateValidation';

// CASE: no quotes available for any asset should disable the info button and review
// CASE: no quotes available for some assets should not render row in review
// TODO: add test ids
// TODO: write tests
// TODO: migrate hook tests to components
// TODO: try to extract test configurations
// TODO: add security warnings array

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
    hasInitialSelection,
    setSendAmountPercent,
    setSlippagePercent,
    setEditingSlippageAssetId,
    selectReceivedAsset,
    deleteAsset,
  } = useBatchSellQuotesConfig();

  const { data, entries, isLoading, quotesLastFetchedMs } =
    useBatchSellQuotesFetching(
      {
        sendAssetsConfig,
        receivedAsset: selectedReceiveAsset,
      },
      { enabled: hasInitialSelection },
    );

  useBatchSellTradesFetching(
    { data, entries, quotesLastFetchedMs },
    { enabled: hasInitialSelection && !isLoading },
  );

  const { totalNetworkFee: batchFees, isBatchSellTradeAvailable } =
    useSelector(getBatchSellTrades);

  const validation = useBatchSellAggregateValidation({
    sendAssetsConfig,
    quotes: data?.quotes,
    totalNetworkFee: batchFees?.amount,
  });

  if (!hasInitialSelection) {
    return <Navigate to={BATCH_SELL_SELECT_ROUTE} replace />;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full"
      data-testid="batch-sell-review-page"
    >
      <Header
        totalReceivedFiat={data?.totalReceivedAmountFiat}
        isLoading={isLoading}
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
        isLoading={isLoading}
        onSendAmountPercentChange={setSendAmountPercent}
        onSlippagePercentChangeClick={(asset) =>
          setEditingSlippageAssetId(asset.assetId)
        }
        onAssetDeleteClick={deleteAsset}
        canDeleteAssets={canDeleteAssets}
      />
      <Footer
        onReviewClick={() => setReviewAndConfirmModalIsOpen(true)}
        reviewIsDisabled={isLoading || !data || validation.isNoQuotesAvailable}
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
        sendAssetsConfig={sendAssetsConfig}
        quotes={data?.quotes}
        receivedAsset={{
          symbol: selectedReceiveAsset.symbol,
        }}
        totalReceivedAmount={data?.totalReceivedAmount}
        minimumReceivedAmount={data?.minimumReceivedAmount}
        totalNetworkFee={batchFees?.amount}
        totalNetworkFeeFiat={batchFees?.valueInCurrency}
        networkFeeAssetSymbol={batchFees?.asset.symbol}
        isInsufficientGasForFee={validation.isInsufficientGasForFee}
        isBatchSellTradeAvailable={isBatchSellTradeAvailable}
      />
    </Box>
  );
};
