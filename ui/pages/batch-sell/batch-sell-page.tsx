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
import { useBatchSellNavigation } from '../../hooks/batch-sell/useBatchSellNavigation';
import { toRelativeRoutePath } from '../routes/utils';
import {
  BATCH_SELL_REVIEW_ROUTE,
  BATCH_SELL_ROOT_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { getIsBatchSellEnabled } from '../../selectors/batch-sell/feature-flags';
import { BatchSellSelectPage } from './pages/select/batch-sell-select-page';
import { BatchSellReviewPage } from './pages/review/batch-sell-review-page';
import { BatchSellInfoModalProvider } from './providers/batch-sell-info-modal-provider';
import { BatchSellSelectionProvider } from './providers/batch-sell-selection-provider';

const BatchSellPage = () => {
  const t = useI18nContext();
  const { pathname } = useLocation();
  const { navigateToDefaultRoute, navigateToBatchSellSelectPage } =
    useBatchSellNavigation();
  const batchSellEnabled = useSelector(getIsBatchSellEnabled);

  const handleBack = () => {
    const isOnConfirmPage = pathname === BATCH_SELL_REVIEW_ROUTE;

    if (isOnConfirmPage) {
      transitionBack(navigateToBatchSellSelectPage);
      return;
    }

    transitionBack(navigateToDefaultRoute);
  };

  if (!batchSellEnabled) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <BatchSellSelectionProvider>
      <BatchSellInfoModalProvider>
        <Page>
          <Header
            startAccessory={
              <ButtonIcon
                iconName={IconName.ArrowLeft}
                size={ButtonIconSize.Md}
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
    </BatchSellSelectionProvider>
  );
};

export default BatchSellPage;
