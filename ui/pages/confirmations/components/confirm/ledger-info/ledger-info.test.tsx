import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';

import mockState from '../../../../../../test/data/mock-state.json';
import {
  HardwareTransportStates,
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../../../shared/constants/app';
import * as actionConstants from '../../../../../store/actionConstants';
import { HardwareWalletType } from '../../../../../contexts/hardware-wallets/types';
import * as environmentType from '../../../../../../shared/lib/environment-type';
import { isInE2eTest } from '../../../../../contexts/hardware-wallets/is-in-e2e-test';
import { requestWebHidDevices } from '../../../../../contexts/hardware-wallets/webConnectionUtils';
import {
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { SignatureRequestType } from '../../../types/confirm';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import LedgerInfo from './ledger-info';

jest.mock('../../../../../contexts/hardware-wallets/webConnectionUtils');
jest.mock('../../../../../contexts/hardware-wallets/is-in-e2e-test', () => ({
  isInE2eTest: jest.fn(),
}));

const mockedRequestWebHidDevices = jest.mocked(requestWebHidDevices);
const mockedIsInE2eTest = jest.mocked(isInE2eTest);

/**
 * Builds a store for a Ledger WebHID confirmation that has not connected yet,
 * so the "connect via WebHID" button is rendered.
 *
 * @returns A configured mock store.
 */
const getNotConnectedWebHidState = () =>
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
  );

describe('LedgerInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequestWebHidDevices.mockResolvedValue([]);
    mockedIsInE2eTest.mockReturnValue(false);
  });

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
      getByText(messages.ledgerConnectionInstructionCloseOtherApps.message),
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
      getByText(messages.openFullScreenForLedgerWebHid.message),
    ).toBeInTheDocument();
  });

  describe('connect via WebHID button', () => {
    beforeEach(() => {
      jest
        .spyOn(environmentType, 'getEnvironmentType')
        .mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    });

    it('requests devices and marks the connection as connected when one is granted', async () => {
      const state = getNotConnectedWebHidState();
      const mockStore = configureMockStore([])(state);
      mockedRequestWebHidDevices.mockResolvedValue([
        { vendorId: 0x2c97 } as HIDDevice,
      ]);

      const { getByText } = renderWithConfirmContextProvider(
        <LedgerInfo />,
        mockStore,
      );

      fireEvent.click(
        getByText(messages.clickToConnectLedgerViaWebHID.message),
      );

      await waitFor(() => {
        expect(mockedRequestWebHidDevices).toHaveBeenCalledWith(
          HardwareWalletType.Ledger,
        );
        expect(mockStore.getActions()).toContainEqual({
          type: actionConstants.SET_WEBHID_CONNECTED_STATUS,
          payload: WebHIDConnectedStatuses.connected,
        });
      });
    });

    it('marks the connection as not connected when no device is granted', async () => {
      const state = getNotConnectedWebHidState();
      const mockStore = configureMockStore([])(state);
      mockedRequestWebHidDevices.mockResolvedValue([]);

      const { getByText } = renderWithConfirmContextProvider(
        <LedgerInfo />,
        mockStore,
      );

      fireEvent.click(
        getByText(messages.clickToConnectLedgerViaWebHID.message),
      );

      await waitFor(() => {
        expect(mockStore.getActions()).toContainEqual({
          type: actionConstants.SET_WEBHID_CONNECTED_STATUS,
          payload: WebHIDConnectedStatuses.notConnected,
        });
      });
    });

    it('opens the full screen extension when not already in the full screen view', async () => {
      jest
        .spyOn(environmentType, 'getEnvironmentType')
        .mockReturnValue(ENVIRONMENT_TYPE_POPUP);
      const openExtensionInBrowser = jest.fn();
      global.platform = { openExtensionInBrowser } as never;

      const state = getNotConnectedWebHidState();
      const mockStore = configureMockStore([])(state);

      const { getByText } = renderWithConfirmContextProvider(
        <LedgerInfo />,
        mockStore,
      );

      fireEvent.click(
        getByText(messages.openFullScreenForLedgerWebHid.message),
      );

      expect(openExtensionInBrowser).toHaveBeenCalledWith(null, null, true);
      expect(mockedRequestWebHidDevices).not.toHaveBeenCalled();
    });
  });
});
