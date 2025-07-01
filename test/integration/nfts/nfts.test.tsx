import { act, screen, waitFor } from '@testing-library/react';
import nock from 'nock';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { integrationTestRender } from '../../lib/render-helpers';
import mockMetaMaskState from '../data/integration-init-state.json';
import {
  clickElementById,
  createMockImplementation,
  waitForElementById,
  waitForElementByText,
  waitForElementByTextToNotBePresent,
} from '../helpers';

const isGlobalNetworkSelectorRemoved = process.env.REMOVE_GNS === 'true';

jest.setTimeout(20_000);

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...(mockRequests ?? {}),
    }),
  );
};

describe('NFTs list', () => {
  beforeEach(() => {
    process.env.PORTFOLIO_VIEW = 'true';
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('displays the nfts list for popular networks and tracks the event', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const accountName = account.metadata.name;

    const withMetamaskConnectedToMainnet = {
      ...mockMetaMaskState,
      selectedNetworkClientId: 'testNetworkConfigurationId',
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
          '0x89': true,
          '0x5': true,
          '0xaa36a7': true,
        },
      },
      participateInMetaMetrics: true,
      dataCollectionForMarketing: false,
    };

    await act(async () => {
      await integrationTestRender({
        preloadedState: withMetamaskConnectedToMainnet,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await screen.findByText(accountName);

    await clickElementById('account-overview__nfts-tab');

    if (!isGlobalNetworkSelectorRemoved) {
      await waitForElementById('sort-by-networks');
    }
    await waitForElementByText('Test Dapp NFTs #1');
    await waitForElementByText('Punk #4');
    await waitForElementByText('Punk #3');
    await waitForElementByText('Punk #2');
    await waitForElementByText('MUNK #1 Mainnet');
    await waitForElementByText('MUNK #1 Chain 137');
    await waitForElementByText('MUNK #1 Chain 5');

    let nftScreenOpenedMetricsEvent;

    await waitFor(() => {
      nftScreenOpenedMetricsEvent =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) =>
            call[0] === 'trackMetaMetricsEvent' &&
            call[1]?.[0].category === MetaMetricsEventCategory.Home,
        );

      expect(nftScreenOpenedMetricsEvent?.[0]).toBe('trackMetaMetricsEvent');

      expect(nftScreenOpenedMetricsEvent?.[1]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: MetaMetricsEventCategory.Home,
            event: MetaMetricsEventName.NftScreenOpened,
          }),
        ]),
      );
    });
  });

  it('filters the nfts list for the current network', async () => {
    const account =
      mockMetaMaskState.internalAccounts.accounts[
        mockMetaMaskState.internalAccounts
          .selectedAccount as keyof typeof mockMetaMaskState.internalAccounts.accounts
      ];

    const withMetamaskConnectedToMainnet = {
      ...mockMetaMaskState,
      selectedNetworkClientId: 'testNetworkConfigurationId',
      preferences: {
        ...mockMetaMaskState.preferences,
        tokenNetworkFilter: {
          '0x1': true,
        },
      },
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
        },
      },
    };

    const accountName = account.metadata.name;

    await act(async () => {
      await integrationTestRender({
        preloadedState: withMetamaskConnectedToMainnet,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    await screen.findByText(accountName);

    await clickElementById('account-overview__nfts-tab');

    if (!isGlobalNetworkSelectorRemoved) {
      await waitForElementById('sort-by-networks');
      await clickElementById('sort-by-networks');
      await clickElementById('network-filter-current__button');
    }

    await waitForElementByText('MUNK #1 Mainnet');
    await waitForElementByTextToNotBePresent('MUNK #1 Chain 137');
    await waitForElementByTextToNotBePresent('MUNK #1 Chain 5');
    await waitForElementByTextToNotBePresent('Test Dapp NFTs #1');
    await waitForElementByTextToNotBePresent('Punk #4');
    await waitForElementByTextToNotBePresent('Punk #3');
    await waitForElementByTextToNotBePresent('Punk #2');
  });

  it('disables the filter list for the test networks', async () => {
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

    await clickElementById('account-overview__nfts-tab');

    if (isGlobalNetworkSelectorRemoved) {
      await waitFor(() => {
        expect(screen.getByTestId('sort-by-networks')).toBeEnabled();
      });
    } else {
      await waitFor(() => {
        expect(screen.getByTestId('sort-by-networks')).toBeDisabled();
      });
    }
  });
});
