import React from 'react';

import { Page } from '../../../components/multichain/pages/page';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import { BlockaidLoadingIndicator } from '../components/confirm/blockaid-loading-indicator';
import { ConfirmAlerts } from '../components/confirm/confirm-alerts';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { SmartTransactionsBannerAlert } from '../components/smart-transactions-banner-alert';
import { PluggableSection } from '../components/confirm/pluggable-section';
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import { Title } from '../components/confirm/title';
import { ConfirmContextProvider } from '../context/confirm';
import { ConfirmNav } from '../components/confirm/nav/nav';
import { GasFeeTokenToast } from '../components/confirm/info/shared/gas-fee-token-toast/gas-fee-token-toast';
import { DappSwapContextProvider } from '../context/dapp-swap';
import {
  GasFeeModalContextProvider,
  GasFeeModalWrapper,
} from '../context/gas-fee-modal';
import { useHideToasts } from '../../../hooks/useHideToasts';

const Confirm: React.FC<{ confirmationId?: string }> = ({ confirmationId }) => {
  useHideToasts();

  return (
    <ConfirmContextProvider confirmationId={confirmationId}>
      <DappSwapContextProvider>
        <GasFeeModalContextProvider>
          <TransactionModalContextProvider>
            <ConfirmAlerts>
              <>
                <Page className="confirm_wrapper">
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
              </>
            </ConfirmAlerts>
          </TransactionModalContextProvider>
        </GasFeeModalContextProvider>
      </DappSwapContextProvider>
    </ConfirmContextProvider>
  );
};

export default Confirm;
