import React, { useState } from 'react';
import { AlertActionHandlerProvider } from '../../../components/app/alert-system/contexts/alertActionHandler';
import { Page } from '../../../components/multichain/pages/page';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { MMISignatureMismatchBanner } from '../../../components/app/mmi-signature-mismatch-banner';
///: END:ONLY_INCLUDE_IF
import { Footer } from '../components/confirm/footer';
import { Header } from '../components/confirm/header';
import { Info } from '../components/confirm/info';
import { LedgerInfo } from '../components/confirm/ledger-info';
import { Nav } from '../components/confirm/nav';
import { PluggableSection } from '../components/confirm/pluggable-section';
import ScrollToBottom from '../components/confirm/scroll-to-bottom';
import { Title } from '../components/confirm/title';
import setConfirmationAlerts from '../hooks/setConfirmationAlerts';
import setCurrentConfirmation from '../hooks/setCurrentConfirmation';
import syncConfirmPath from '../hooks/syncConfirmPath';
import useConfirmationAlertActions from '../hooks/useConfirmationAlertActions';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();
  setConfirmationAlerts();
  const processAction = useConfirmationAlertActions();
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  return (
    <AlertActionHandlerProvider onProcessAction={processAction}>
      <Page className="confirm_wrapper">
        <Nav />
        <Header
          showAdvancedDetails={showAdvancedDetails}
          setShowAdvancedDetails={setShowAdvancedDetails}
        />
        {
          ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
          <MMISignatureMismatchBanner />
          ///: END:ONLY_INCLUDE_IF
        }
        <ScrollToBottom showAdvancedDetails={showAdvancedDetails}>
          <LedgerInfo />
          <Title />
          <Info showAdvancedDetails={showAdvancedDetails} />
          <PluggableSection />
        </ScrollToBottom>
        <Footer />
      </Page>
    </AlertActionHandlerProvider>
  );
};

export default Confirm;
