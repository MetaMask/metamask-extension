import { ApprovalType } from '@metamask/controller-utils';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { integrationTestRender } from '../../lib/render-helpers';
import preview from 'jest-preview';
import { ENVIRONMENT } from '../../../development/build/constants';
import { mockSwapsGasPrices, mockSwapsNetworks, mockSwapsToken, mockSwapsTrades } from '../helpers';
import { mockSwapsAggregatorMetadata, mockSwapsTokens, mockSwapsTopAssets, createMockImplementation } from '../helpers';
import { mockSwapsFeatureFlags } from '../helpers';

import {TOP_ASSETS_API_MOCK_RESULT,
    FEATURE_FLAGS_API_MOCK_RESULT,
    TOKENS_API_MOCK_RESULT,
    AGGREGATOR_METADATA_API_MOCK_RESULT,
    GAS_PRICE_API_MOCK_RESULT,
    TRADES_API_MOCK_RESULT,
    NETWORKS_2_API_MOCK_RESULT,
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

const getMetaMaskStateWithUnapprovedPersonalSign = (accountAddress: string) => {
  return {
    ...mockMetaMaskState,
  };
};

const advancedDetailsMockedRequests = {
    setSwapsTokens: TOKENS_API_MOCK_RESULT,
    getNextNonce: '9',
    decodeTransactionData: {
      data: [
        {
          name: 'mintNFTs',
          params: [
            {
              name: 'numberOfTokens',
              type: 'uint256',
              value: 1,
            },
          ],
        },
      ],
      source: 'Sourcify',
    },
  };

const setupSubmitRequestToBackgroundMocks = (
    mockRequests?: Record<string, unknown>,
  ) => {
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation({
        ...advancedDetailsMockedRequests,
        ...(mockRequests ?? {}),
      }),
    );
  };

describe('Swaps Inauthentic Swap Alert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
      mockSwapsTokens();
      setupSubmitRequestToBackgroundMocks();
    // mockSwapsFeatureFlags();
    // mockSwapsAggregatorMetadata();
    // mockSwapsTopAssets();
    // mockSwapsToken();
    // mockSwapsGasPrices();
    // mockSwapsTrades();
    // mockSwapsNetworks();
  });

  it('displays the alert', async () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;
    const mockedMetaMaskState = getMetaMaskStateWithUnapprovedPersonalSign(
      account.address,
    );

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockedMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });
      await screen.findByText(accountName);

    await act(async () => {
      fireEvent.click(
        await screen.findByTestId('token-overview-button-swap'),
      );
    });

      await act(async () => {
        fireEvent.change(
          await screen.findByTestId('prepare-swap-page-from-token-amount'),
          { target: { value: '2' } },
        );
      });

      await act(async () => {
        fireEvent.click(
            await screen.findByTestId('prepare-swap-page-swap-to'),
        );
      });

      await act(async () => {
        fireEvent.change(
          await screen.findByPlaceholderText('Enter token name or paste address'),
          { target: { value: 'INUINU' } },
        );
      });

      console.log(mockedBackgroundConnection.submitRequestToBackground.mock.calls);
      preview.debug();

    const alert = await screen.findByTestId('swaps-banner-title');
    expect(alert).toBeInTheDocument();
  });
});