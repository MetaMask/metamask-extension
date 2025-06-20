import React from 'react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  HardwareTransportStates,
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import {
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { SignatureRequestType } from '../../../types/confirm';
import LedgerInfo from './ledger-info';

describe('LedgerInfo', () => {
  it('renders correctly if account is ledger account', () => {
    const state = getMockPersonalSignConfirmStateForRequest({
      ...unapprovedPersonalSignMsg,
      msgParams: {
        ...unapprovedPersonalSignMsg.msgParams,
        from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
      },
    } as SignatureRequestType);

    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <LedgerInfo />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('return null for non-ledger account', () => {
    const state = getMockPersonalSignConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithConfirmContextProvider(
      <LedgerInfo />,
      mockStore,
    );
    expect(container).toMatchInlineSnapshot(`<div />`);
  });

  it('display button to close other apps and reload if ledger device opening fails', () => {
    const state = getMockPersonalSignConfirmStateForRequest(
      {
        ...unapprovedPersonalSignMsg,
        msgParams: {
          ...unapprovedPersonalSignMsg.msgParams,
          from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        },
      } as SignatureRequestType,
      {
        metamask: {},
        appState: {
          ...mockState.appState,
          ledgerTransportStatus: HardwareTransportStates.deviceOpenFailure,
        },
      },
    );

    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <LedgerInfo />,
      mockStore,
    );
    expect(
      getByText(
        'Close any other software connected to your device and then click here to refresh.',
      ),
    ).toBeInTheDocument();
  });

  it('display button to connect ledger if not already connected', () => {
    const state = getMockPersonalSignConfirmStateForRequest(
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
    );

    const mockStore = configureMockStore([])(state);
    const { getByText } = renderWithConfirmContextProvider(
      <LedgerInfo />,
      mockStore,
    );
    expect(
      getByText('Go to full screen to connect your Ledger.'),
    ).toBeInTheDocument();
  });
});
