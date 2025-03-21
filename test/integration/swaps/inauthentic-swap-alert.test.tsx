import { act, fireEvent, screen } from '@testing-library/react';
import preview from 'jest-preview';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { integrationTestRender } from '../../lib/render-helpers';
import {
  mockSwapsGasPrices,
  mockSwapsNetworks,
  mockSwapsToken,
  mockSwapsTrades,
  mockSwapsAggregatorMetadata,
  mockSwapsTokens,
  mockSwapsTopAssets,
  createMockImplementation,
  mockSwapsFeatureFlags,
} from '../helpers';

import {
  FEATURE_FLAGS_API_MOCK_RESULT,
  TOKENS_API_MOCK_RESULT,
} from '../../data/mock-data';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedBackgroundRequests = {
  setSwapsTokens: TOKENS_API_MOCK_RESULT,
  setSwapsFeatureFlags: FEATURE_FLAGS_API_MOCK_RESULT,
  fetchSmartTransactionsLiveness: true,
  getTransactions: [],
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...mockedBackgroundRequests,
      ...(mockRequests ?? {}),
    }),
  );
};

describe('Swaps Alert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSwapsTokens();
    setupSubmitRequestToBackgroundMocks();
    mockSwapsFeatureFlags();
    mockSwapsAggregatorMetadata();
    mockSwapsTopAssets();
    mockSwapsToken();
    mockSwapsGasPrices();
    mockSwapsTrades();
    mockSwapsNetworks();
  });

  it('displays the potentially inauthentic token alert', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });
    await screen.findByText(accountName);

    await act(async () => {
      fireEvent.click(await screen.findByTestId('token-overview-button-swap'));
    });
    // console.log(
    //   mockedBackgroundConnection.submitRequestToBackground.mock.calls,
    // );

    await act(async () => {
      fireEvent.change(
        await screen.findByTestId('prepare-swap-page-from-token-amount'),
        { target: { value: '2' } },
      );
    });

    await act(async () => {
      fireEvent.click(await screen.findByTestId('prepare-swap-page-swap-to'));
    });

    await act(async () => {
      fireEvent.click(await screen.findByText('INUINU'));
    });

    preview.debug();

    const alert = await screen.findByTestId('swaps-banner-title');
    expect(alert).toBeInTheDocument();

    expect(
      await screen.findByText('Potentially inauthentic token'),
    ).toBeInTheDocument();
  });
});
