import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { useI18nContext } from '../../hooks/useI18nContext';
import { transitionBack } from '../../components/ui/transition';
import {
  useBatchSellNavigation,
  BatchSellNavigationState,
} from '../../hooks/batch-sell/useBatchSellNavigation';
import { toRelativeRoutePath } from '../routes/utils';
import {
  BATCH_SELL_CONFIRM_ROUTE,
  BATCH_SELL_ROOT_ROUTE,
  BATCH_SELL_SELECT_ROUTE,
} from '../../helpers/constants/routes';
import { BatchSellSelectPage } from './pages/select';
import { BatchSellConfirmPage } from './pages/confirm';
import { BatchSellModalProvider } from './providers/BatchSellModalProvider';

const BatchSellPage = () => {
  const t = useI18nContext();
  const { pathname, state } = useLocation();
  const { navigateToDefaultRoute, navigateToBatchSellSelectPage } =
    useBatchSellNavigation();

  const handleBack = () => {
    const isOnConfirmPage = pathname === BATCH_SELL_CONFIRM_ROUTE;

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

  return (
    <BatchSellModalProvider>
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
                BATCH_SELL_CONFIRM_ROUTE,
                BATCH_SELL_ROOT_ROUTE,
              )}
              element={<BatchSellConfirmPage />}
            />
          </Routes>
        </Content>
      </Page>
    </BatchSellModalProvider>
  );
};

export default BatchSellPage;
