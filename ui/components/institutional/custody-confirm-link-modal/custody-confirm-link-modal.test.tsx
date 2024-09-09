import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { KeyringTypes } from '@metamask/keyring-controller';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import { hideModal } from '../../../store/actions';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import CustodyConfirmLink from '.';

const mockedSetWaitForConfirmDeepLinkDialog = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });
jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    setWaitForConfirmDeepLinkDialog: mockedSetWaitForConfirmDeepLinkDialog,
  }),
}));

jest.mock('../../../store/actions', () => ({
  hideModal: jest.fn().mockReturnValue({ type: 'TYPE' }),
}));

const mockedCustodianName = 'saturn-dev';

describe('Custody Confirm Link', () => {
  const mockInternalAccount = createMockInternalAccount({
    keyringType: KeyringTypes.hd,
    address: '0xAddress',
    name: 'testCustody - Saturn',
  });
  const mockStore = {
    ...testData,
    appState: {
      ...testData.appState,
      modal: {
        modalState: {
          props: {
            link: {
              url: 'test-url',
              ethereum: {
                accounts: [{}],
              },
              text: '',
              action: '',
            },
          },
        },
      },
    },
    metamask: {
      ...testData.metamask,
      internalAccounts: {
        accounts: {
          [mockInternalAccount.id]: mockInternalAccount,
        },
        selectedAccount: mockInternalAccount.id,
      },
      mmiConfiguration: {
        custodians: [
          {
            refreshTokenUrl:
              'https://saturn-custody.dev.metamask-institutional.io/oauth/token',
            name: 'saturn-dev',
            displayName: 'Saturn Custody',
            enabled: true,
            mmiApiUrl: 'https://api.dev.metamask-institutional.io/v1',
            websocketApiUrl:
              'wss://websocket.dev.metamask-institutional.io/v1/ws',
            apiBaseUrl:
              'https://saturn-custody.dev.metamask-institutional.io/eth',
            iconUrl:
              'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
            isNoteToTraderSupported: true,
          },
        ],
      },
      custodyAccountDetails: {
        '0xAddress': {
          address: '0xAddress',
          details: 'details',
          custodyType: 'testCustody - Saturn',
          custodianName: mockedCustodianName,
        },
      },
    },
  };

  let store = configureStore()(mockStore);

  it('tries to open new tab with deeplink URL', () => {
    global.platform = { openTab: jest.fn(), closeCurrentWindow: jest.fn() };
    const { getByTestId } = renderWithProvider(<CustodyConfirmLink />, store);
    fireEvent.click(getByTestId('custody-confirm-link__btn'));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'test-url',
    });
    expect(mockedSetWaitForConfirmDeepLinkDialog).toHaveBeenCalledWith(false);
    expect(hideModal).toHaveBeenCalledTimes(1);
  });

  it('shows custodian name when iconUrl is undefined', () => {
    const customMockStore = {
      ...mockStore,
      metamask: {
        ...testData.metamask,
        ...mockStore.metamask,
        mmiConfiguration: {
          custodians: [
            {
              refreshTokenUrl:
                'https://saturn-custody.dev.metamask-institutional.io/oauth/token',
              name: 'saturn-dev',
              displayName: 'Saturn Custody',
              enabled: true,
              mmiApiUrl: 'https://api.dev.metamask-institutional.io/v1',
              websocketApiUrl:
                'wss://websocket.dev.metamask-institutional.io/v1/ws',
              apiBaseUrl:
                'https://saturn-custody.dev.metamask-institutional.io/eth',
              iconUrl: null,
              isNoteToTraderSupported: true,
            },
          ],
        },
      },
    };

    store = configureStore()(customMockStore);

    const { getByText } = renderWithProvider(<CustodyConfirmLink />, store);

    expect(getByText(mockedCustodianName)).toBeVisible();
  });

  it('shows text that comes from modal state if defined', () => {
    const mockModalStateText = 'test modal state text';
    const customMockStore = {
      ...mockStore,
      appState: {
        ...testData.appState,
        modal: {
          modalState: {
            props: {
              link: {
                url: 'test-url',
                ethereum: {
                  accounts: [{}],
                },
                text: mockModalStateText,
                action: '',
              },
            },
          },
        },
      },
    };

    store = configureStore()(customMockStore);

    const { getByText } = renderWithProvider(<CustodyConfirmLink />, store);

    expect(getByText(mockModalStateText)).toBeVisible();
  });

  it('shows action text that comes from modal state if defined', () => {
    const mockModalStateActionText = 'test modal state action text';
    const customMockStore = {
      ...mockStore,
      appState: {
        ...testData.appState,
        modal: {
          modalState: {
            props: {
              link: {
                url: 'test-url',
                ethereum: {
                  accounts: [{}],
                },
                text: '',
                action: mockModalStateActionText,
              },
            },
          },
        },
      },
    };

    store = configureStore()(customMockStore);

    const { getByText } = renderWithProvider(<CustodyConfirmLink />, store);

    expect(getByText(mockModalStateActionText)).toBeVisible();
  });
});
