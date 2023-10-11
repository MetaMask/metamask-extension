import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ConfirmAddCustodianToken from './confirm-add-custodian-token';

const mockedRemoveAddTokenConnectRequest = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

const mockedSetCustodianConnectRequest = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    removeAddTokenConnectRequest: mockedRemoveAddTokenConnectRequest,
    setCustodianConnectRequest: mockedSetCustodianConnectRequest,
  }),
}));

describe('Confirm Add Custodian Token', () => {
  const mockStore = {
    metamask: {
      providerConfig: {
        type: 'test',
      },
      preferences: {
        useNativeCurrencyAsPrimaryCurrency: true,
      },
      institutionalFeatures: {
        connectRequests: [
          {
            labels: [
              {
                key: 'service',
                value: 'test',
              },
            ],
            origin: 'origin',
            token: 'testToken',
            feature: 'custodian',
            service: 'Jupiter',
            apiUrl: 'https://',
            chainId: 1,
          },
        ],
      },
    },
    history: {
      push: '/',
      mostRecentOverviewPage: '/',
    },
  };

  const store = configureMockStore()(mockStore);

  it('tries to connect to custodian with empty token', async () => {
    const customMockedStore = {
      metamask: {
        providerConfig: {
          type: 'test',
        },
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: true,
        },
        institutionalFeatures: {
          connectRequests: [
            {
              labels: [
                {
                  key: 'service',
                  value: 'test',
                },
              ],
              origin: 'origin',
              token: '',
              feature: 'custodian',
              service: 'Jupiter',
              apiUrl: 'https://',
              chainId: 1,
            },
          ],
        },
      },
      history: {
        push: '/',
        mostRecentOverviewPage: '/',
      },
    };

    const customStore = configureMockStore()(customMockedStore);

    renderWithProvider(<ConfirmAddCustodianToken />, customStore);

    const confirmButton = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmButton);

    const errorMessage = screen.getByTestId('connect-custodian-token-error');

    expect(errorMessage).toBeVisible();
  });

  it('clicks the confirm button and shows the test value', async () => {
    renderWithProvider(<ConfirmAddCustodianToken />, store);

    const confirmButton = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmButton);

    expect(screen.getByText('Confirm connection to test')).toBeInTheDocument();
  });

  it('shows the error area', () => {
    renderWithProvider(<ConfirmAddCustodianToken />, store);

    const confirmButton = screen.getByTestId('confirm-btn');

    fireEvent.click(confirmButton);

    expect(screen.getByTestId('error-message')).toBeVisible();
  });

  it('clicks the cancel button and removes the connect request', async () => {
    renderWithProvider(<ConfirmAddCustodianToken />, store);

    const cancelButton = screen.getByTestId('cancel-btn');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockedRemoveAddTokenConnectRequest).toHaveBeenCalledWith({
        origin: 'origin',
        apiUrl: 'https://',
        token: 'testToken',
      });
    });
  });

  it('clicks the confirm button without chainId and calls setCustodianConnectRequest with custodianName comming from the environment connectRequest', async () => {
    const customMockedStore = {
      metamask: {
        providerConfig: {
          type: 'test',
        },
        preferences: {
          useNativeCurrencyAsPrimaryCurrency: true,
        },
        institutionalFeatures: {
          connectRequests: [
            {
              labels: [
                {
                  key: 'service',
                  value: 'test',
                },
              ],
              origin: 'origin',
              token: '',
              feature: 'custodian',
              service: 'JSONRPC',
              apiUrl: 'https://',
              environment: 'jsonrpc',
            },
          ],
        },
      },
      history: {
        push: '/',
        mostRecentOverviewPage: '/',
      },
    };

    const customStore = configureMockStore()(customMockedStore);

    renderWithProvider(<ConfirmAddCustodianToken />, customStore);

    await waitFor(() => {
      const confirmButton = screen.getByTestId('confirm-btn');
      fireEvent.click(confirmButton);
    });

    expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedSetCustodianConnectRequest).toHaveBeenCalledWith({
        token: '',
        apiUrl: 'https://',
        custodianName: 'jsonrpc',
        custodianType: 'JSONRPC',
      });
    });
  });
});
