import React from 'react';

import { AlertActionHandlerProvider } from '../../../components/app/alert-system/contexts/alertActionHandler';
import { Page } from '../../../components/multichain/pages/page';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { MMISignatureMismatchBanner } from '../../../components/app/mmi-signature-mismatch-banner';
///: END:ONLY_INCLUDE_IF
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import setCurrentConfirmation from '../hooks/setCurrentConfirmation';
import syncConfirmPath from '../hooks/syncConfirmPath';
import setConfirmationAlerts from '../hooks/setConfirmationAlerts';
import useConfirmationAlertActions from '../hooks/useConfirmationAlertActions';
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { LedgerInfo } from '../components/confirm/ledger-info';
import { Nav } from '../components/confirm/nav';
import { Title } from '../components/confirm/title';
import { PluggableSection } from '../components/confirm/pluggable-section';

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
          <LedgerInfo />
          <Title />
          <Info />
          <PluggableSection />
        </ScrollToBottom>
        <Footer />
      </Page>
    </AlertActionHandlerProvider>
  );
};

export default Confirm;
