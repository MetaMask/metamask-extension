import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ConfirmAddCustodianToken from './confirm-add-custodian-token';

const mockedRemoveAddTokenConnectRequest = jest
  .fn()
  .mockReturnValue({ type: 'TYPE' });

jest.mock('../../../store/institutional/institution-background', () => ({
  mmiActionsFactory: () => ({
    removeAddTokenConnectRequest: mockedRemoveAddTokenConnectRequest,
  }),
}));

describe('Confirm Add Custodian Token', () => {
  const mockStore = {
    metamask: {
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
            service: 'ECA3',
            environment: 'test-environment-environment',
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
              service: 'ECA3',
              environment: 'test-environment',
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
        environment: 'test-environment-environment',
        token: 'testToken',
      });
    });
  });
});
