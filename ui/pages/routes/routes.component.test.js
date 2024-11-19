import React from 'react';
import configureMockStore from 'redux-mock-store';
import { act, waitFor } from '@testing-library/react';
import thunk from 'redux-thunk';
import { BtcAccountType } from '@metamask/keyring-api';
import { SEND_STAGES } from '../../ducks/send';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { renderWithProvider } from '../../../test/jest';
import mockSendState from '../../../test/data/mock-send-state.json';
import mockState from '../../../test/data/mock-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../hooks/useIsOriginalNativeTokenSymbol';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../app/_locales/en/messages.json';
import Routes from '.';

const middlewares = [thunk];

const mockShowNetworkDropdown = jest.fn();
const mockHideNetworkDropdown = jest.fn();
const mockFetchWithCache = jest.fn();

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    getManifest: () => ({ manifest_version: 2 }),
  },
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  showNetworkDropdown: () => mockShowNetworkDropdown,
  hideNetworkDropdown: () => mockHideNetworkDropdown,
}));

jest.mock('../../ducks/bridge/actions', () => ({
  setBridgeFeatureFlags: () => jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../ducks/send', () => ({
  ...jest.requireActual('../../ducks/send'),
  resetSendState: () => ({ type: 'XXX' }),
  getGasPrice: jest.fn(),
}));

jest.mock('../../ducks/domains', () => ({
  ...jest.requireActual('../../ducks/domains'),
  initializeDomainSlice: () => ({ type: 'XXX' }),
}));

jest.mock('../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock(
  '../../components/app/metamask-template-renderer/safe-component-list',
);

jest.mock(
  '../../../shared/lib/fetch-with-cache',
  () => () => mockFetchWithCache,
);

const render = async (route, state) => {
  const store = configureMockStore(middlewares)({
    ...mockSendState,
    ...state,
  });

  let result;

  await act(
    async () => (result = renderWithProvider(<Routes />, store, route)),
  );

  return result;
};

describe('Routes Component', () => {
  useIsOriginalNativeTokenSymbol.mockImplementation(() => true);

  afterEach(() => {
    mockShowNetworkDropdown.mockClear();
    mockHideNetworkDropdown.mockClear();
  });

  describe('render during send flow', () => {
    it('should render when send transaction is not active', async () => {
      const state = {
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          swapsState: {
            ...mockSendState.metamask.swapsState,
            swapsFeatureIsLive: true,
          },
          pendingApprovals: {},
          approvalFlows: [],
          announcements: {},
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          newPrivacyPolicyToastShownDate: new Date('0'),
          preferences: {
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
          },
        },
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.INACTIVE,
        },
        localeMessages: {
          currentLocale: 'en',
        },
      };
      const { getByTestId } = await render(undefined, state);
      expect(getByTestId('account-menu-icon')).not.toBeDisabled();
    });
  });

  describe('new network popup', () => {
    const mockBtcAccount = createMockInternalAccount({
      address: 'bc1q26a367uz34eg5mufwhlscwdcplu6frtgf00r7a',
      name: 'Btc Account',
      type: BtcAccountType.P2wpkh,
      snapOptions: {
        id: 'mock-btc-snap',
        name: 'mock-btc-snap',
        enabled: true,
      },
    });

    const mockEvmAccount = createMockInternalAccount();

    const mockNewlyAddedNetwork = {
      chainId: CHAIN_IDS.BASE,
      name: 'Base',
      nativeCurrency: 'ETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          type: 'custom',
          url: 'https://base.com',
          networkClientId: CHAIN_IDS.BASE,
        },
      ],
    };

    const renderPopup = async (account) => {
      process.env.IN_TEST = '';
      const state = {
        ...mockSendState,
        metamask: {
          ...mockState.metamask,
          completedOnboarding: true,
          selectedNetworkClientId: mockNewlyAddedNetwork.chainId,
          internalAccounts: {
            accounts: {
              [account.id]: account,
            },
            selectedAccount: account.id,
          },
          usedNetworks: {
            '0x1': true,
            '0x5': true,
            '0x539': true,
            [mockNewlyAddedNetwork.chainId]: false,
          },
          networkConfigurationsByChainId: {
            ...mockState.metamask.networkConfigurationsByChainId,
            [mockNewlyAddedNetwork.chainId]: mockNewlyAddedNetwork,
          },
          networksMetadata: {
            ...mockState.metamask.networksMetadata,
            [mockNewlyAddedNetwork.chainId]: {
              EIPS: {
                1559: true,
              },
              status: 'available',
            },
          },
          tokens: [],
          swapsState: { swapsFeatureIsLive: false },
          announcements: {},
          pendingApprovals: {},
          termsOfUseLastAgreed: new Date('2999-03-25'),
          shouldShowSeedPhraseReminder: false,
          useExternalServices: true,
        },
        send: {
          ...mockSendState.send,
          stage: SEND_STAGES.INACTIVE,
          currentTransactionUUID: null,
          draftTransactions: {},
        },
        appState: {
          ...mockSendState.appState,
          showWhatsNewPopup: false,
          onboardedInThisUISession: false,
        },
      };
      return await render(['/'], state);
    };

    it('displays new EVM network popup for EVM accounts', async () => {
      const { getAllByText, getByTestId } = await renderPopup(mockEvmAccount);

      const networkInfo = getByTestId('new-network-info__bullet-paragraph');

      await waitFor(() => {
        expect(getAllByText(mockNewlyAddedNetwork.name).length).toBeGreaterThan(
          0,
        );
        expect(networkInfo).toBeInTheDocument();
      });
    });

    it('does not display new EVM network popup for non-EVM accounts', async () => {
      const { queryByTestId } = await renderPopup(mockBtcAccount);

      const networkInfo = queryByTestId('new-network-info__bullet-paragraph');
      expect(networkInfo).not.toBeInTheDocument();
    });
  });
});

describe('toast display', () => {
  const mockAccount = createMockInternalAccount();
  const mockAccount2 = createMockInternalAccount({
    name: 'Account 2',
    address: '0x1234567890123456789012345678901234567890',
    id: '481d4435-23da-499a-8c18-fcebbb1eaf03',
  });
  const mockNonEvmAccount = createMockInternalAccount({
    name: 'Snap Account 1',
    type: BtcAccountType.P2wpkh,
    id: '4174eb0c-0a73-4213-b807-a2e5a5c4ebfd',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
  });
  const mockOrigin = 'https://metamask.github.io';

  const getToastDisplayTestState = (date) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      announcements: {},
      approvalFlows: [],
      completedOnboarding: true,
      usedNetworks: [],
      pendingApprovals: {},
      pendingApprovalCount: 0,
      swapsState: { swapsFeatureIsLive: true },
      newPrivacyPolicyToastShownDate: date,
    },
  });

  const getToastConnectAccountDisplayTestState = (selectedAccountId) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      announcements: {},
      approvalFlows: [],
      completedOnboarding: true,
      usedNetworks: [],
      pendingApprovals: {},
      pendingApprovalCount: 0,
      swapsState: { swapsFeatureIsLive: true },
      newPrivacyPolicyToastShownDate: new Date(0),
      newPrivacyPolicyToastClickedOrClosed: true,
      surveyLinkLastClickedOrClosed: true,
      showPrivacyPolicyToast: false,
      showSurveyToast: false,
      showAutoNetworkSwitchToast: false,
      showNftEnablementToast: false,
      alertEnabledness: {
        unconnectedAccount: true,
      },
      termsOfUseLastAgreed: new Date(0).getTime(),
      internalAccounts: {
        accounts: {
          [mockAccount.id]: mockAccount,
          [mockNonEvmAccount.id]: mockNonEvmAccount,
          [mockAccount2.id]: mockAccount2,
        },
        selectedAccount: selectedAccountId ?? mockAccount.id,
      },
      subjects: {
        [mockOrigin]: {
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [mockAccount.address],
                },
              ],
              date: 1719910288437,
              invoker: 'https://metamask.github.io',
              parentCapability: 'eth_accounts',
            },
          },
        },
      },
    },
    activeTab: {
      id: 2143026027,
      title: 'E2E Test Dapp',
      origin: mockOrigin,
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
  });

  it('renders toastContainer on default route', async () => {
    await render([DEFAULT_ROUTE], getToastDisplayTestState(new Date('9999')));
    const toastContainer = document.querySelector('.toasts-container');
    expect(toastContainer).toBeInTheDocument();
  });

  it('does not render toastContainer on confirmation route', async () => {
    await render(
      [CONFIRMATION_V_NEXT_ROUTE],
      getToastDisplayTestState(new Date(0)),
    );
    const toastContainer = document.querySelector('.toasts-container');
    expect(toastContainer).not.toBeInTheDocument();
  });

  it('does not render toastContainer if the account is connected', async () => {
    const { queryByTestId } = await render(
      [DEFAULT_ROUTE],
      getToastConnectAccountDisplayTestState(mockNonEvmAccount.id),
    );
    const toastContainer = queryByTestId('connect-account-toast');
    expect(toastContainer).not.toBeInTheDocument();
  });

  it('does not render toastContainer if the unconnected account is non-EVM', async () => {
    const { queryByTestId } = await render(
      [DEFAULT_ROUTE],
      getToastConnectAccountDisplayTestState(mockNonEvmAccount.id),
    );
    const toastContainer = queryByTestId('connect-account-toast');
    expect(toastContainer).not.toBeInTheDocument();
  });

  it('does render toastContainer if the unconnected selected account is EVM', async () => {
    const { getByTestId } = await render(
      [DEFAULT_ROUTE],
      getToastConnectAccountDisplayTestState(mockAccount2.id),
    );
    const toastContainer = getByTestId('connect-account-toast');
    expect(toastContainer).toBeInTheDocument();
  });
});
