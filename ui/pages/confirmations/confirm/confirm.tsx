import React, { Suspense } from 'react';

import { Page } from '../../../components/multichain/pages/page/page';
import LoadingScreen from '../../../components/ui/loading-screen/loading-screen.component';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import BlockaidLoadingIndicator from '../components/confirm/blockaid-loading-indicator/blockaid-loading-indicator';
import ConfirmAlerts from '../components/confirm/confirm-alerts/confirm-alerts';
import Footer from '../components/confirm/footer/footer';
import Header from '../components/confirm/header/header';
import Info from '../components/confirm/info/info';
import { SmartTransactionsBannerAlert } from '../components/smart-transactions-banner-alert/smart-transactions-banner-alert';
import PluggableSection from '../components/confirm/pluggable-section/pluggable-section';
import ScrollToBottom from '../components/confirm/scroll-to-bottom/scroll-to-bottom';
import Title from '../components/confirm/title/title';
import { ConfirmContextProvider } from '../context/confirm';
import { ConfirmNav } from '../components/confirm/nav/nav';
import { GasFeeTokenToast } from '../components/confirm/info/shared/gas-fee-token-toast/gas-fee-token-toast';
import { DappSwapContextProvider } from '../context/dapp-swap';
import {
  GasFeeModalContextProvider,
  GasFeeModalWrapper,
} from '../context/gas-fee-modal';
import { useHideToasts } from '../../../hooks/useHideToasts';

const Confirm = ({ confirmationId }: { confirmationId?: string }) => {
  useHideToasts();

  return (
    <ConfirmContextProvider confirmationId={confirmationId}>
      <DappSwapContextProvider>
        <GasFeeModalContextProvider>
          <TransactionModalContextProvider>
            <ConfirmAlerts>
              {/* Keep the approval controls hidden until the details load. */}
              <Suspense fallback={<LoadingScreen />}>
                <Page
                  className="confirm_wrapper"
                  data-testid="parent-selector-confirmation-page"
                >
                  <ConfirmNav />
                  <Header />
                  <SmartTransactionsBannerAlert marginType="noTop" />
                  <ScrollToBottom>
                    <BlockaidLoadingIndicator />
                    <Title />
                    <Info />
                    <PluggableSection />
                  </ScrollToBottom>
                  <GasFeeTokenToast />
                  <Footer />
                </Page>
                <GasFeeModalWrapper />
              </Suspense>
            </ConfirmAlerts>
          </TransactionModalContextProvider>
        </GasFeeModalContextProvider>
      </DappSwapContextProvider>
    </ConfirmContextProvider>
  );
};

export default Confirm;
