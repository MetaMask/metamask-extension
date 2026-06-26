import React, { useEffect, useMemo, useState } from 'react';
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
import { hasAtLeastOneQuoteAvailable } from './utils/hasAtLeastOneQuoteAvailable';
import { hasAnyEnabledAsset } from './utils/hasAnyEnabledAsset';

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

  const {
    data,
    entries,
    isLoading: quotesAreLoading,
    quotesLastFetchedMs,
    areQuotesRefreshExpired,
    refetch,
  } = useBatchSellQuotesFetching(
    {
      sendAssetsConfig,
      receivedAsset: selectedReceiveAsset,
    },
    { enabled: hasInitialSelection },
  );

  const batchSellChain = entries[0]?.asset.chainId ?? '';

  useBatchSellTradesFetching(
    { data, entries, quotesLastFetchedMs, chain: batchSellChain },
    { enabled: hasInitialSelection && !quotesAreLoading },
  );

  const {
    totalNetworkFee: batchFees,
    isBatchSellTradeAvailable,
    isLoading: feesAreLoading,
  } = useSelector(getBatchSellTrades);

  const validation = useBatchSellAggregateValidation({
    sendAssetsConfig,
    quotes: data?.quotes,
  });

  const atLeastOneQuoteAvailable = useMemo(
    () => hasAtLeastOneQuoteAvailable(sendAssetsConfig, data?.quotes),
    [sendAssetsConfig, data?.quotes],
  );

  const anyEnabledAsset = useMemo(
    () => hasAnyEnabledAsset(sendAssetsConfig),
    [sendAssetsConfig],
  );

  useEffect(() => {
    setReviewAndConfirmModalIsOpen(false);
  }, [areQuotesRefreshExpired]);

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
        quotesAreFetching={quotesAreLoading}
        atLeastOneQuoteAvailable={atLeastOneQuoteAvailable}
        anyEnabledAsset={anyEnabledAsset}
        totalReceivedFiat={data?.totalReceivedAmountFiat}
        selectedAsset={{
          symbol: selectedReceiveAsset.symbol,
          image: selectedReceiveAsset.iconUrl,
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
        quotesAreLoading={quotesAreLoading}
        onReviewClick={() => setReviewAndConfirmModalIsOpen(true)}
        reviewIsDisabled={
          quotesAreLoading || !data || validation.isNoQuotesAvailable
        }
        areQuotesRefreshExpired={areQuotesRefreshExpired}
        onGetNewQuotesClick={refetch}
      />
      <SelectReceivedAssetModal
        assets={receivedAssets}
        selectedAssetId={selectedReceiveAsset.assetId}
        onClose={() => setSelectReceivedAssetModalIsOpen(false)}
        open={selectReceivedAssetModalIsOpen}
        onSelectAsset={(assetId) => {
          selectReceivedAsset(assetId);
          setSelectReceivedAssetModalIsOpen(false);
        }}
      />
      <TotalReceivedModal
        atLeastOneQuoteAvailable={atLeastOneQuoteAvailable}
        anyEnabledAsset={anyEnabledAsset}
        sendAssetsConfig={sendAssetsConfig}
        quotes={data?.quotes}
        receivedAsset={{
          symbol: selectedReceiveAsset.symbol,
        }}
        totalReceivedAmount={data?.totalReceivedAmount}
        minimumReceivedAmount={data?.minimumReceivedAmount}
        onClose={() => setTotalReceivedAssetModalIsOpen(false)}
        open={totalReceivedModalIsOpen}
        quotesAreFetching={quotesAreLoading}
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
        quotesAreLoading={quotesAreLoading}
        receivedAsset={selectedReceiveAsset}
        totalReceivedAmount={data?.totalReceivedAmount}
        minimumReceivedAmount={data?.minimumReceivedAmount}
        totalNetworkFee={batchFees?.amount}
        totalNetworkFeeFiat={batchFees?.valueInCurrency}
        totalNetworkFeeAssetSymbol={batchFees?.asset.symbol}
        totalNetworkFeeAreLoading={feesAreLoading}
        totalNetworkFeeHasError={!isBatchSellTradeAvailable}
        isBatchSellTradeAvailable={isBatchSellTradeAvailable}
      />
    </Box>
  );
};
