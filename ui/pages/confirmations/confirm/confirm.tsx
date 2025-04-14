import { ReactNodeLike } from 'prop-types';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { ReactNode } from 'react';

import { Page } from '../../../components/multichain/pages/page';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import AdvancedGasFeePopover from '../components/advanced-gas-fee-popover';
import { BlockaidLoadingIndicator } from '../components/confirm/blockaid-loading-indicator';
import { ConfirmAlerts } from '../components/confirm/confirm-alerts';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { LedgerInfo } from '../components/confirm/ledger-info';
import { SmartTransactionsBannerAlert } from '../components/smart-transactions-banner-alert';
import { PluggableSection } from '../components/confirm/pluggable-section';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import { Title } from '../components/confirm/title';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import EditGasFeePopover from '../components/edit-gas-fee-popover';
import { ConfirmContextProvider, useConfirmContext } from '../context/confirm';
import { ConfirmNav } from '../components/confirm/nav/nav';
import { GasFeeTokenToast } from '../components/confirm/info/shared/gas-fee-token-toast/gas-fee-token-toast';
import { Splash } from '../components/confirm/splash';

const EIP1559TransactionGasModal = () => {
  return (
    <>
      <EditGasFeePopover />
      <AdvancedGasFeePopover />
    </>
  );
};

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

const Confirm = () => (
  <ConfirmContextProvider>
    <TransactionModalContextProvider>
      {/* This context should be removed once we implement the new edit gas fees popovers */}
      <GasFeeContextProviderWrapper>
        <EIP1559TransactionGasModal />
        <ConfirmAlerts>
          <Page className="confirm_wrapper">
            <ConfirmNav />
            <Header />
            <SmartTransactionsBannerAlert marginType="noTop" />
            <ScrollToBottom>
              <BlockaidLoadingIndicator />
              <LedgerInfo />
              <Title />
              <Info />
              <PluggableSection />
            </ScrollToBottom>
            <GasFeeTokenToast />
            <Footer />
            <Splash />
          </Page>
        </ConfirmAlerts>
      </GasFeeContextProviderWrapper>
    </TransactionModalContextProvider>
  </ConfirmContextProvider>
);

export default Confirm;
