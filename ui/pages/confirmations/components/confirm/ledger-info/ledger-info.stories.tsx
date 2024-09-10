import React from 'react';
import { Provider } from 'react-redux';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import { getMockPersonalSignConfirmStateForRequest } from '../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import configureStore from '../../../../../store/store';
import { ConfirmContextProvider } from '../../../context/confirm';
import { SignatureRequestType } from '../../../types/confirm';

import LedgerInfo from './ledger-info';

const store = configureStore(
  getMockPersonalSignConfirmStateForRequest(
    {
      ...unapprovedPersonalSignMsg,
      msgParams: {
        ...unapprovedPersonalSignMsg.msgParams,
        from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
      },
    } as SignatureRequestType,
    {
      metamask: {
        ledgerTransportType: LedgerTransportTypes.webhid,
      },
      appState: {
        ...mockState.appState,
        ledgerWebHidConnectedStatus: WebHIDConnectedStatuses.notConnected,
      },
    },
  ),
);

const Story = {
  title: 'Confirmations/Components/Confirm/LedgerInfo',
  component: LedgerInfo,
  decorators: [
    (story: any) => (
      <Provider store={store}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </Provider>
    ),
  ],
};

export default Story;

export const DefaultStory = () => <LedgerInfo />;

DefaultStory.storyName = 'Default';
