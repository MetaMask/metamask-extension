import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DappConnectionControlBar } from './dapp-connection-control-bar';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockRemovePermissionsFor = jest.fn(
  (_subjects: Record<string, string[]>) => () => Promise.resolve(),
);
const mockHidePermittedNetworkToast = jest.fn(() => ({
  type: 'SHOW_PERMITTED_NETWORK_TOAST_CLOSE',
}));
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  removePermissionsFor: (subjects: Record<string, string[]>) =>
    mockRemovePermissionsFor(subjects),
  hidePermittedNetworkToast: () => mockHidePermittedNetworkToast(),
}));

const ACCOUNT_1_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const ACCOUNT_1_ID = 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3';
const ACCOUNT_2_ADDRESS = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';
const ACCOUNT_2_ID = '784225f4-d30b-4e77-a900-c8bbce735b88';
const GROUP_1_ID = 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0';
const LEDGER_GROUP_ID =
  'keyring:Ledger Hardware/0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const DAPP_ORIGIN = 'https://metamask.github.io';

const sharedMetamaskOverrides = {
  completedOnboarding: true,
  domains: {
    [DAPP_ORIGIN]: 'sepolia-test-client',
  },
  networkConfigurationsByChainId: {
    ...mockState.metamask.networkConfigurationsByChainId,
    '0xaa36a7': {
      chainId: '0xaa36a7',
      name: 'Sepolia',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          type: 'custom',
          url: 'https://sepolia.test',
          networkClientId: 'sepolia-test-client',
        },
      ],
      defaultRpcEndpointIndex: 0,
    },
  },
  selectedMultichainNetworkChainId: 'eip155:11155111',
  isEvmSelected: true,
  selectedNetworkClientId: 'sepolia-test-client',
  multichainNetworkConfigurationsByChainId: {
    ...mockState.metamask.multichainNetworkConfigurationsByChainId,
    'eip155:11155111': {
      chainId: 'eip155:11155111',
      name: 'Sepolia',
      nativeCurrency: 'ETH',
      isEvm: true,
    },
  },
  subjectMetadata: {
    ...mockState.metamask.subjectMetadata,
    [DAPP_ORIGIN]: {
      name: 'E2E Test Dapp',
      iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
      subjectType: 'website',
      origin: DAPP_ORIGIN,
    },
  },
};

const activeTab = {
  id: 113,
  title: 'E2E Test Dapp',
  origin: DAPP_ORIGIN,
  protocol: 'https:',
  url: 'https://metamask.github.io/test-dapp/',
};

const makeCaip25Permission = (accounts: string[]) => ({
  'endowment:caip25': {
    parentCapability: 'endowment:caip25',
    caveats: [
      {
        type: 'authorizedScopes',
        value: {
          requiredScopes: {},
          optionalScopes: {
            'eip155:0': { accounts },
          },
          isMultichainOrigin: false,
        },
      },
    ],
  },
});

const connectedMockState = {
  metamask: {
    ...mockState.metamask,
    ...sharedMetamaskOverrides,
    accountTree: {
      ...mockState.metamask.accountTree,
      selectedAccountGroup: GROUP_1_ID,
    },
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        [ACCOUNT_1_ID]: {
          ...mockState.metamask.internalAccounts.accounts[ACCOUNT_1_ID],
          metadata: {
            ...mockState.metamask.internalAccounts.accounts[ACCOUNT_1_ID]
              .metadata,
            lastSelected: 1000,
          },
        },
      },
      selectedAccount: ACCOUNT_1_ID,
    },
    subjects: {
      [DAPP_ORIGIN]: {
        permissions: makeCaip25Permission([`eip155:0:${ACCOUNT_1_ADDRESS}`]),
      },
    },
  },
  activeTab,
};

const disconnectedMockState = {
  metamask: {
    ...mockState.metamask,
    ...sharedMetamaskOverrides,
    subjects: {},
  },
  activeTab,
};

describe('DappConnectionControlBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when connected to a dapp', () => {
    const renderConnected = () => {
      const store = configureStore(connectedMockState);
      return renderWithProvider(<DappConnectionControlBar />, store);
    };

    it('renders the control bar', () => {
      const { getByTestId } = renderConnected();
      expect(getByTestId('dapp-connection-control-bar')).toBeInTheDocument();
    });

    it('displays the site origin', () => {
      const { getByText } = renderConnected();
      expect(getByText('metamask.github.io')).toBeInTheDocument();
    });

    it('displays the dapp favicon', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__favicon'),
      ).toBeInTheDocument();
    });

    it('displays the green connection dot on the favicon', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__connection-dot'),
      ).toBeInTheDocument();
    });

    it('displays the network button', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__network-button'),
      ).toBeInTheDocument();
    });

    it('displays the permissions button', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__permissions-button'),
      ).toBeInTheDocument();
    });

    it('displays the disconnect button', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__disconnect-button'),
      ).toBeInTheDocument();
    });

    it('navigates to permissions page when permissions button is clicked', () => {
      const { getByTestId } = renderConnected();
      fireEvent.click(
        getByTestId('dapp-connection-control-bar__permissions-button'),
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/review-permissions?origin=https%3A%2F%2Fmetamask.github.io',
      );
    });

    it('opens disconnect modal when disconnect button is clicked', () => {
      const { getByTestId } = renderConnected();
      fireEvent.click(
        getByTestId('dapp-connection-control-bar__disconnect-button'),
      );
      expect(getByTestId('disconnect-all-modal')).toBeInTheDocument();
    });

    it('displays the account label', () => {
      const { getByTestId } = renderConnected();
      const accountEl = getByTestId(
        'dapp-connection-control-bar__account-name',
      );
      expect(accountEl).toBeInTheDocument();
      expect(accountEl.textContent).toContain('Account 1');
    });

    it('dispatches removePermissionsFor when disconnect is confirmed', async () => {
      const { getByTestId, queryByTestId } = renderConnected();
      fireEvent.click(
        getByTestId('dapp-connection-control-bar__disconnect-button'),
      );
      fireEvent.click(getByTestId('disconnect-all'));
      await waitFor(() => {
        expect(mockRemovePermissionsFor).toHaveBeenCalledWith({
          [DAPP_ORIGIN]: ['endowment:caip25'],
        });
        expect(mockHidePermittedNetworkToast).toHaveBeenCalled();
        expect(queryByTestId('disconnect-all-modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('when an unconnected account group is selected', () => {
    it('falls back to the most recently selected connected account', () => {
      const state = {
        metamask: {
          ...mockState.metamask,
          ...sharedMetamaskOverrides,
          accountTree: {
            ...mockState.metamask.accountTree,
            selectedAccountGroup: LEDGER_GROUP_ID,
          },
          internalAccounts: {
            ...mockState.metamask.internalAccounts,
            accounts: {
              ...mockState.metamask.internalAccounts.accounts,
              [ACCOUNT_1_ID]: {
                ...mockState.metamask.internalAccounts.accounts[ACCOUNT_1_ID],
                metadata: {
                  ...mockState.metamask.internalAccounts.accounts[ACCOUNT_1_ID]
                    .metadata,
                  lastSelected: 2000,
                },
              },
              [ACCOUNT_2_ID]: {
                ...mockState.metamask.internalAccounts.accounts[ACCOUNT_2_ID],
                metadata: {
                  ...mockState.metamask.internalAccounts.accounts[ACCOUNT_2_ID]
                    .metadata,
                  lastSelected: 1000,
                },
              },
            },
            selectedAccount: ACCOUNT_2_ID,
          },
          subjects: {
            [DAPP_ORIGIN]: {
              permissions: makeCaip25Permission([
                `eip155:0:${ACCOUNT_1_ADDRESS}`,
                `eip155:0:${ACCOUNT_2_ADDRESS}`,
              ]),
            },
          },
        },
        activeTab,
      };
      const store = configureStore(state);
      const { getByTestId } = renderWithProvider(
        <DappConnectionControlBar />,
        store,
      );
      const accountEl = getByTestId(
        'dapp-connection-control-bar__account-name',
      );
      expect(accountEl.textContent).toContain('Account 1');
    });
  });

  describe('when not connected to a dapp', () => {
    it('does not render the control bar', () => {
      const store = configureStore(disconnectedMockState);
      const { queryByTestId } = renderWithProvider(
        <DappConnectionControlBar />,
        store,
      );
      expect(
        queryByTestId('dapp-connection-control-bar'),
      ).not.toBeInTheDocument();
    });

    it('does not render when activeTabOrigin is empty', () => {
      const state = {
        metamask: {
          ...mockState.metamask,
          ...sharedMetamaskOverrides,
          subjects: {
            [DAPP_ORIGIN]: {
              permissions: makeCaip25Permission([
                `eip155:0:${ACCOUNT_1_ADDRESS}`,
              ]),
            },
          },
        },
        activeTab: { ...activeTab, origin: '' },
      };
      const store = configureStore(state);
      const { queryByTestId } = renderWithProvider(
        <DappConnectionControlBar />,
        store,
      );
      expect(
        queryByTestId('dapp-connection-control-bar'),
      ).not.toBeInTheDocument();
    });
  });
});
