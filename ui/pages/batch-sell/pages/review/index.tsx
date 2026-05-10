import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { BatchSellNavigationState } from '../../../../hooks/batch-sell/useBatchSellNavigation';
import { Header } from './components/Header';
import { QuotesList } from './components/QuotesList';
import { Footer } from './components/Footer';

export const BatchSellReviewPage = () => {
  const { state } = useLocation();
  const { selectedNetworkChainId, selectedAssetsId } = (state ??
    {}) as BatchSellNavigationState;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full"
      data-testid="batch-sell-review-page"
    >
      <Header />
      <QuotesList />
      <Footer />
    </Box>
  );
};
