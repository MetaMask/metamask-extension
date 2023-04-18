import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import CustodyConfirmLink from '.';

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    setWaitForConfirmDeepLinkDialog: jest
      .fn()
      .mockReturnValue({ type: 'TYPE' }),
  }),
}));

describe('Custody Confirm Link', () => {
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
          custodianName: 'saturn-dev',
        },
      },
      provider: {
        type: 'test',
      },
      selectedAddress: '0xAddress',
    },
  };

  const store = configureStore()(mockStore);

  it('tries to open new tab with deeplink URL', () => {
    global.platform = { openTab: jest.fn() };
    const { getByRole } = renderWithProvider(<CustodyConfirmLink />, store);
    fireEvent.click(getByRole('button'));
    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'test-url',
    });
  });

  it('should match snapshot', () => {
    const { container } = renderWithProvider(<CustodyConfirmLink />, store);

    expect(container).toMatchSnapshot();
  });
});
