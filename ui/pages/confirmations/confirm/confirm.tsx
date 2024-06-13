import React from 'react';

import { Page } from '../../../components/multichain/pages/page';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { MMISignatureMismatchBanner } from '../../../components/app/mmi-signature-mismatch-banner';
///: END:ONLY_INCLUDE_IF
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import setCurrentConfirmation from '../hooks/setCurrentConfirmation';
import syncConfirmPath from '../hooks/syncConfirmPath';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { LedgerInfo } from '../components/confirm/ledger-info';
import { Nav } from '../components/confirm/nav';
import { Title } from '../components/confirm/title';
import { PluggableSection } from '../components/confirm/pluggable-section';
import { TransactionModalContextProvider } from '../../../contexts/transaction-modal';
import { GasFeeContextProvider } from '../../../contexts/gasFee';
import AdvancedGasFeePopover from '../components/advanced-gas-fee-popover';
import EditGasFeePopover from '../components/edit-gas-fee-popover';
import { ConfirmAlerts } from '../components/confirm/confirm-alerts';

const Confirm = () => {
  const currentConfirmation = setCurrentConfirmation();
  syncConfirmPath();

  return (
    <TransactionModalContextProvider>
      <GasFeeContextProvider transaction={currentConfirmation}>
        <EditGasFeePopover />
        <AdvancedGasFeePopover />
        <ConfirmAlerts>
          <Page className="confirm_wrapper">
            <Nav />
            <Header />
            {
              ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
              <MMISignatureMismatchBanner />
              ///: END:ONLY_INCLUDE_IF
            }
            <ScrollToBottom>
              <LedgerInfo />
              <Title />
              <Info />
              <PluggableSection />
            </ScrollToBottom>
            <Footer />
          </Page>
        </ConfirmAlerts>
      </GasFeeContextProvider>
    </TransactionModalContextProvider>
  );
};

export default Confirm;
