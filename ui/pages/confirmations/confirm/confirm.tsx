import { ReactNodeLike } from 'prop-types';
import React, { ReactNode } from 'react';

import { Page } from '../../../components/multichain/pages/page';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import { BlockaidLoadingIndicator } from '../components/confirm/blockaid-loading-indicator';
import { ConfirmAlerts } from '../components/confirm/confirm-alerts';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info, InfoSkeleton } from '../components/confirm/info';
import { LedgerInfo } from '../components/confirm/ledger-info';
import { SmartTransactionsBannerAlert } from '../components/smart-transactions-banner-alert';
import { PluggableSection } from '../components/confirm/pluggable-section';
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import { Title, TitleSkeleton } from '../components/confirm/title';
import { ConfirmContextProvider, useConfirmContext } from '../context/confirm';
import { ConfirmNav } from '../components/confirm/nav/nav';
import { GasFeeTokenToast } from '../components/confirm/info/shared/gas-fee-token-toast/gas-fee-token-toast';
import { Splash } from '../components/confirm/splash';
import { DappSwapContextProvider } from '../context/dapp-swap';
import {
  GasFeeModalContextProvider,
  GasFeeModalWrapper,
} from '../context/gas-fee-modal';

const GasFeeContextProviderWrapper: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { currentConfirmation } = useConfirmContext();
  return (
    <GasFeeContextProvider transaction={currentConfirmation}>
      {children as NonNullable<ReactNodeLike>}
    </GasFeeContextProvider>
  );
};

// Early loading check to show skeletons immediately without waiting for heavy hooks
const ConfirmContent = () => {
  const { currentConfirmation } = useConfirmContext();

  if (!currentConfirmation) {
    return (
      <>
        <TitleSkeleton />
        <InfoSkeleton />
      </>
    );
  }

  return (
    <>
      <Title />
      <Info />
      <PluggableSection />
    </>
  );
};

const Confirm: React.FC<{ confirmationId?: string }> = ({ confirmationId }) => (
  <ConfirmContextProvider confirmationId={confirmationId}>
    <DappSwapContextProvider>
      <GasFeeModalContextProvider>
        <TransactionModalContextProvider>
          <GasFeeContextProviderWrapper>
            <ConfirmAlerts>
              <>
                <Page className="confirm_wrapper">
                  <ConfirmNav />
                  <Header />
                  <SmartTransactionsBannerAlert marginType="noTop" />
                  <ScrollToBottom>
                    <BlockaidLoadingIndicator />
                    <LedgerInfo />
                    <ConfirmContent />
                  </ScrollToBottom>
                  <GasFeeTokenToast />
                  <Footer />
                  <Splash />
                </Page>
                <GasFeeModalWrapper />
              </>
            </ConfirmAlerts>
          </GasFeeContextProviderWrapper>
        </TransactionModalContextProvider>
      </GasFeeModalContextProvider>
    </DappSwapContextProvider>
  </ConfirmContextProvider>
);

export default Confirm;
