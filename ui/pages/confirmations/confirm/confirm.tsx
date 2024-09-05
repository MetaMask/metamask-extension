import React, { ReactNode } from 'react';
import { ReactNodeLike } from 'prop-types';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { MMISignatureMismatchBanner } from '../../../components/institutional/signature-mismatch-banner';
///: END:ONLY_INCLUDE_IF
import { Page } from '../../../components/multichain/pages/page';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import AdvancedGasFeePopover from '../components/advanced-gas-fee-popover';
import { BlockaidLoadingIndicator } from '../components/confirm/blockaid-loading-indicator';
import { ConfirmAlerts } from '../components/confirm/confirm-alerts';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { LedgerInfo } from '../components/confirm/ledger-info';
import { Nav } from '../components/confirm/nav';
import { PluggableSection } from '../components/confirm/pluggable-section';
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import { Title } from '../components/confirm/title';
import EditGasFeePopover from '../components/edit-gas-fee-popover';
import { NetworkChangeToast } from '../components/confirm/network-change-toast';
import { ConfirmContextProvider, useConfirmContext } from '../context/confirm';

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
            <Nav />
            <Header />
            <ScrollToBottom>
              {
                ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
                <MMISignatureMismatchBanner />
                ///: END:ONLY_INCLUDE_IF
              }
              <BlockaidLoadingIndicator />
              <LedgerInfo />
              <Title />
              <Info />
              <PluggableSection />
            </ScrollToBottom>
            <Footer />
            <NetworkChangeToast />
          </Page>
        </ConfirmAlerts>
      </GasFeeContextProviderWrapper>
    </TransactionModalContextProvider>
  </ConfirmContextProvider>
);

export default Confirm;
