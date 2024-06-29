import React from 'react';

import { AlertActionHandlerProvider } from '../../../components/app/alert-system/contexts/alertActionHandler';
import { BlockaidLoadingIndicator } from '../components/confirm/blockaid-loading-indicator';
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { MMISignatureMismatchBanner } from '../../../components/app/mmi-signature-mismatch-banner';
///: END:ONLY_INCLUDE_IF
import { Nav } from '../components/confirm/nav';
import { Title } from '../components/confirm/title';
import { Page } from '../../../components/multichain/pages/page';
import setCurrentConfirmation from '../hooks/setCurrentConfirmation';
import syncConfirmPath from '../hooks/syncConfirmPath';
import { LedgerInfo } from '../components/confirm/ledger-info';
import setConfirmationAlerts from '../hooks/setConfirmationAlerts';
import useConfirmationAlertActions from '../hooks/useConfirmationAlertActions';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();
  setConfirmationAlerts();
  const processAction = useConfirmationAlertActions();

  return (
    <AlertActionHandlerProvider onProcessAction={processAction}>
      <Page className="confirm_wrapper">
        <Nav />
        <Header />
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          <MMISignatureMismatchBanner />
          ///: END:ONLY_INCLUDE_IF
        }
        <ScrollToBottom>
          <BlockaidLoadingIndicator />
          <LedgerInfo />
          <Title />
          <Info />
        </ScrollToBottom>
        <Footer />
      </Page>
    </AlertActionHandlerProvider>
  );
};

export default Confirm;
