import { ComponentType } from 'react';
import { screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
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

type MockStore = {
  metamask: {
    providerConfig: {
      type: string;
    };
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: boolean;
    };
    institutionalFeatures: {
      connectRequests: {
        labels: {
          key: string;
          value: string;
        }[];
        origin: string;
        token: string;
        feature: string;
        service: string;
        environment: string;
        chainId: number;
      }[];
    };
  };
  history: {
    push: string;
    mostRecentOverviewPage: string;
  };
};

// Define ConfirmAddCustodianTokenProps here
type ConfirmAddCustodianTokenProps = Record<string, never>;

describe('Confirm Add Custodian Token', () => {
  const mockStore: MockStore = {
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

  const store = configureMockStore<MockStore>()(mockStore);

  it('tries to connect to custodian with empty token', async () => {
    const customMockedStore: MockStore = {
      ...mockStore,
      metamask: {
        ...mockStore.metamask,
        institutionalFeatures: {
          connectRequests: [
            {
              ...mockStore.metamask.institutionalFeatures.connectRequests[0],
              token: '',
              environment: 'test-environment',
            },
          ],
        },
      },
    };

    const customStore = configureMockStore<MockStore>()(customMockedStore);

    renderWithProvider(
      ConfirmAddCustodianToken as ComponentType<ConfirmAddCustodianTokenProps>,
      customStore,
    );

    const confirmButton = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmButton);

    const errorMessage = screen.getByTestId('connect-custodian-token-error');

    expect(errorMessage).toBeVisible();
  });

  it('clicks the confirm button and shows the test value', async () => {
    renderWithProvider(
      ConfirmAddCustodianToken as ComponentType<ConfirmAddCustodianTokenProps>,
      store,
    );

    const confirmButton = screen.getByTestId('confirm-btn');
    fireEvent.click(confirmButton);

    expect(screen.getByText('Confirm connection to test')).toBeInTheDocument();
  });

  it('shows the error area', () => {
    renderWithProvider(
      ConfirmAddCustodianToken as ComponentType<ConfirmAddCustodianTokenProps>,
      store,
    );

    const confirmButton = screen.getByTestId('confirm-btn');

    fireEvent.click(confirmButton);

    expect(screen.getByTestId('error-message')).toBeVisible();
  });

  it('clicks the cancel button and removes the connect request', async () => {
    renderWithProvider(
      ConfirmAddCustodianToken as ComponentType<ConfirmAddCustodianTokenProps>,
      store,
    );

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
