import React from 'react';
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
///: BEGIN:ONLY_INCLUDE_IF(blockaid)
import { BlockaidAlert } from '../components/confirm/blockaid-alert';
///: END:ONLY_INCLUDE_IF
import { LedgerInfo } from '../components/confirm/ledger-info';

const Confirm = () => {
  setCurrentConfirmation();
  syncConfirmPath();

  return (
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
        {
          // todo: section below is to be removed once new alerts implementation is there
          ///: BEGIN:ONLY_INCLUDE_IF(blockaid)
          <BlockaidAlert marginTop={4} />
          ///: END:ONLY_INCLUDE_IF
        }
        <Title />
        <Info />
      </ScrollToBottom>
      <Footer />
    </Page>
  );
};

export default Confirm;
