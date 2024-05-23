import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import configureStore from '../../../../../store/store';

import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';

import LedgerInfo from './ledger-info';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    ledgerTransportType: LedgerTransportTypes.webhid,
  },
  confirm: {
    currentConfirmation: {
      ...unapprovedPersonalSignMsg,
      msgParams: {
        ...unapprovedPersonalSignMsg.msgParams,
        from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
      },
    },
  },
  appState: {
    ...mockState.appState,
    ledgerWebHidConnectedStatus: WebHIDConnectedStatuses.notConnected,
  },
});

const Story = {
  title: 'Confirmations/Components/Confirm/LedgerInfo',
  component: LedgerInfo,
  decorators: [(story: any) => <Provider store={store}>{story()}</Provider>],
};

export default Story;

export const DefaultStory = () => <LedgerInfo />;

DefaultStory.storyName = 'Default';
