import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useI18nContext } from '../../hooks/useI18nContext';
import { transitionBack } from '../../components/ui/transition';
import {
  useBatchSellNavigation,
  BatchSellNavigationState,
} from '../../hooks/batch-sell/useBatchSellNavigation';
import { toRelativeRoutePath } from '../routes/utils';
import {
  BATCH_SELL_REVIEW_ROUTE,
  BATCH_SELL_ROOT_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { getIsBatchSellEnabled } from '../../selectors/batch-sell/feature-flags';
import { BatchSellSelectPage } from './pages/select';
import { BatchSellReviewPage } from './pages/review';
import { BatchSellInfoModalProvider } from './providers/batch-sell-info-modal-provider';

const BatchSellPage = () => {
  const t = useI18nContext();
  const { pathname, state } = useLocation();
  const { navigateToDefaultRoute, navigateToBatchSellSelectPage } =
    useBatchSellNavigation();
  const batchSellEnabled = useSelector(getIsBatchSellEnabled);

  const handleBack = () => {
    const isOnConfirmPage = pathname === BATCH_SELL_REVIEW_ROUTE;

    if (isOnConfirmPage) {
      const { selectedNetworkChainId, selectedAssetsId } = (state ??
        {}) as BatchSellNavigationState;

      transitionBack(() =>
        navigateToBatchSellSelectPage({
          selectedNetworkChainId,
          selectedAssetsId,
        }),
      );

      return;
    }

    transitionBack(navigateToDefaultRoute);
  };

  if (!batchSellEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <BatchSellInfoModalProvider>
      <Page>
        <Header
          startAccessory={
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              onClick={handleBack}
            />
          }
        />
        <Content padding={0}>
          <Routes>
            <Route
              path={toRelativeRoutePath(
                BATCH_SELL_SELECT_ROUTE,
                BATCH_SELL_ROOT_ROUTE,
              )}
              element={<BatchSellSelectPage />}
            />
            <Route
              path={toRelativeRoutePath(
                BATCH_SELL_REVIEW_ROUTE,
                BATCH_SELL_ROOT_ROUTE,
              )}
              element={<BatchSellReviewPage />}
            />
          </Routes>
        </Content>
      </Page>
    </BatchSellInfoModalProvider>
  );
};

export default BatchSellPage;
