import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import ConfirmAddCustodianToken from './confirm-add-custodian-token';

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
        complianceProjectId: '',
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

  it('opens confirm add custodian token with correct token', () => {
    renderWithProvider(<ConfirmAddCustodianToken />, store);

    const tokenContainer = screen.getByText('...testToken');
    expect(tokenContainer).toBeInTheDocument();
  });

  it('shows the custodian on cancel click', () => {
    renderWithProvider(<ConfirmAddCustodianToken />, store);

    const cancelButton = screen.getByTestId('cancel-btn');

    fireEvent.click(cancelButton);

    expect(screen.getByText('Custodian')).toBeInTheDocument();
  });

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
          complianceProjectId: '',
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

    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('shows the error area', () => {
    renderWithProvider(<ConfirmAddCustodianToken />, store);

    const confirmButton = screen.getByTestId('confirm-btn');

    fireEvent.click(confirmButton);

    expect(screen.getByTestId('error-message')).toBeVisible();
  });
});
