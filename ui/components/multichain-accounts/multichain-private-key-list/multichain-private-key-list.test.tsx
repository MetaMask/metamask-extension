import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountGroupId } from '@metamask/account-api';
import {
  startPasskeyAuthentication,
  cancelPasskeyCeremony,
  isPasskeyCeremonySilentError,
} from '../../../../shared/lib/passkey';
import { TraceName, trace, endTrace } from '../../../../shared/lib/trace';
import { useDispatch } from '../../../store/hooks';
import { MultichainPrivateKeyList } from './multichain-private-key-list';

jest.mock('../../../store/hooks', () => ({
  useDispatch: jest.fn().mockReturnValue((action: unknown) => {
    if (typeof action === 'function') {
      return action(jest.fn(), jest.fn());
    }
    return action;
  }),
}));

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../shared/lib/trace', () => ({
  trace: jest.fn(),
  endTrace: jest.fn(),
  TraceName: {
    ShowAccountPrivateKeyList: 'Show Account Private Key List',
  },
  TraceOperation: {
    AccountUi: 'account.ui',
  },
}));

const mockTrace = trace as jest.MockedFunction<typeof trace>;
const mockEndTrace = endTrace as jest.MockedFunction<typeof endTrace>;

const mockUseI18nContext = jest.fn(() => (key: string) => key);
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockUseI18nContext(),
}));

const mockHandleCopy = jest.fn();
jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [false, mockHandleCopy],
}));

const mockUseIsPasskeyActive = jest.fn().mockReturnValue(false);
const mockUseIsPasskeyIncompatibleInSidepanel = jest
  .fn()
  .mockReturnValue(false);

jest.mock('../../../hooks/usePasskeyAvailability', () => ({
  useIsPasskeyActive: () => mockUseIsPasskeyActive(),
  useIsPasskeyIncompatibleInSidepanel: () =>
    mockUseIsPasskeyIncompatibleInSidepanel(),
}));

jest.mock('../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn().mockReturnValue('popup'),
}));

jest.mock('../../../../shared/lib/passkey', () => ({
  ...jest.requireActual('../../../../shared/lib/passkey'),
  startPasskeyAuthentication: jest.fn(),
  cancelPasskeyCeremony: jest.fn(),
  isPasskeyCeremonySilentError: jest.fn(),
}));

const mockStartPasskeyAuthentication =
  startPasskeyAuthentication as jest.MockedFunction<
    typeof startPasskeyAuthentication
  >;
const mockCancelPasskeyCeremony = cancelPasskeyCeremony as jest.MockedFunction<
  typeof cancelPasskeyCeremony
>;
const mockIsPasskeyCeremonySilentError =
  isPasskeyCeremonySilentError as jest.MockedFunction<
    typeof isPasskeyCeremonySilentError
  >;

const mockPasskeyAuthResponse = {
  id: 'assertion-id',
  type: 'public-key',
};

const mockStore = configureStore([]);

const WALLET_ID_MOCK = 'entropy:01K437Z7EJ0VCMFDE9TQKRV60A';

const GROUP_ID_MOCK = `${WALLET_ID_MOCK}/0`;

const ACCOUNT_ONE_ID_MOCK = 'account-one-id';
const ACCOUNT_TWO_ID_MOCK = 'account-two-id';

const ACCOUNT_ONE_ADDRESS_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const ACCOUNT_TWO_ADDRESS_MOCK = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';

const ACCOUNT_ONE_PRIVATE_KEY_MOCK = 'private-key-mock';

const INTERNAL_ACCOUNTS_MOCK: Record<string, InternalAccount> = {
  [ACCOUNT_ONE_ID_MOCK]: {
    id: ACCOUNT_ONE_ID_MOCK,
    address: ACCOUNT_ONE_ADDRESS_MOCK,
    metadata: {
      name: 'Ethereum Account',
      importTime: Date.now(),
      keyring: { type: 'HD Key Tree' },
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: ['eip155:0'],
  },
  [ACCOUNT_TWO_ID_MOCK]: {
    id: ACCOUNT_TWO_ID_MOCK,
    address: ACCOUNT_TWO_ADDRESS_MOCK,
    metadata: {
      name: 'Solana Account',
      importTime: Date.now(),
      keyring: { type: 'Snap Keyring' },
    },
    options: {},
    methods: [],
    type: 'solana:data-account',
    scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
  },
};

const ACCOUNT_TREE_MOCK = {
  wallets: {
    [WALLET_ID_MOCK]: {
      type: 'entropy',
      id: WALLET_ID_MOCK,
      metadata: {},
      groups: {
        [GROUP_ID_MOCK]: {
          type: 'multichain-account',
          id: GROUP_ID_MOCK,
          metadata: {},
          accounts: [ACCOUNT_ONE_ID_MOCK, ACCOUNT_TWO_ID_MOCK],
        },
      },
    },
  },
};

const createMockState = () => ({
  metamask: {
    completedOnboarding: true,
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: [ACCOUNT_ONE_ADDRESS_MOCK],
        metadata: { id: 'entropy-source-id' },
      },
    ],
    internalAccounts: {
      accounts: INTERNAL_ACCOUNTS_MOCK,
      selectedAccount: ACCOUNT_ONE_ID_MOCK,
    },
    accountTree: ACCOUNT_TREE_MOCK,
    // EVM network configurations
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://etherscan.io'],
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon Mainnet',
        nativeCurrency: 'MATIC',
        rpcEndpoints: [
          {
            networkClientId: 'polygon-mainnet',
            url: 'https://polygon-mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://polygonscan.com'],
      },
      '0xa4b1': {
        chainId: '0xa4b1',
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'arbitrum-mainnet',
            url: 'https://arbitrum-mainnet.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://arbiscan.io'],
      },
      '0xaa36a7': {
        chainId: '0xaa36a7',
        name: 'Sepolia',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'sepolia',
            url: 'https://sepolia.infura.io/v3/',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
    },
    // Multichain network configurations (includes non-EVM)
    multichainNetworkConfigurationsByChainId: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
        isEvm: false,
        nativeCurrency: 'SOL',
      },
    },
    // Current provider config for EVM
    providerConfig: {
      chainId: '0x1',
      type: 'mainnet',
      nickname: 'Ethereum',
    },
    // Multichain controller state
    isEvmSelected: true,
    selectedMultichainNetworkChainId: 'eip155:1',
    networksWithTransactionActivity: {},
    // Feature flags for multichain support
    featureFlags: {
      bitcoinSupportEnabled: false,
      solanaSupportEnabled: true,
      solanaTestnetSupportEnabled: false,
    },
    enabledNetworks: {
      eip155: {
        '0x1': true,
        '0x89': true,
        '0xa4b1': true,
        '0xaa36a7': true,
      },
      solana: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      },
    },
  },
});

const mockGoBack = jest.fn();

const mockVerifyPassword = jest.fn().mockImplementation((pwd: string) => {
  if (pwd === 'correctpassword') {
    return Promise.resolve();
  }
  return Promise.reject(new Error('Invalid password'));
});

const mockExportAccounts = jest
  .fn()
  .mockImplementation((_pwd: string, _addresses: string[]) => {
    return Promise.resolve([ACCOUNT_ONE_PRIVATE_KEY_MOCK]);
  });

const mockExportAccountsWithPasskey = jest
  .fn()
  .mockImplementation(
    (_authenticationResponse: unknown, _addresses: string[]) => {
      return Promise.resolve([ACCOUNT_ONE_PRIVATE_KEY_MOCK]);
    },
  );

const mockGeneratePasskeyAuthenticationOptions = jest
  .fn()
  .mockResolvedValue({ challenge: 'challenge' });

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: jest.fn().mockReturnValue((action: unknown) => action),
  };
});

jest.mock('../../../store/actions', () => ({
  verifyPassword: (_pwd: string) => {
    return mockVerifyPassword(_pwd);
  },
  exportAccounts: (_pwd: string, _addresses: string[]) => {
    return mockExportAccounts(_pwd, _addresses);
  },
  exportAccountsWithPasskey: (
    authenticationResponse: unknown,
    addresses: string[],
  ) => {
    return mockExportAccountsWithPasskey(authenticationResponse, addresses);
  },
  generatePasskeyAuthenticationOptions: () =>
    mockGeneratePasskeyAuthenticationOptions(),
}));

const renderComponent = (groupId: AccountGroupId = GROUP_ID_MOCK) => {
  const store = mockStore(createMockState());
  return render(
    <Provider store={store}>
      <MultichainPrivateKeyList groupId={groupId} goBack={mockGoBack} />
    </Provider>,
  );
};

describe('MultichainPrivateKeyList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseI18nContext.mockReturnValue((key: string) => key);
    mockUseIsPasskeyActive.mockReturnValue(false);
    mockUseIsPasskeyIncompatibleInSidepanel.mockReturnValue(false);
    mockStartPasskeyAuthentication.mockResolvedValue(
      mockPasskeyAuthResponse as never,
    );
    mockIsPasskeyCeremonySilentError.mockReturnValue(false);
  });

  it('renders with password input', () => {
    renderComponent();

    expect(
      screen.getByTestId('multichain-private-key-password-input'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
  });

  it('fires trace and endTrace around successful reveal', async () => {
    renderComponent();

    const passwordInput = await screen.findByPlaceholderText('password');
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });

    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await screen.findByTestId('multichain-private-keyring-list');
    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.ShowAccountPrivateKeyList,
      }),
    );
    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.ShowAccountPrivateKeyList,
      }),
    );
  });

  describe('passkey reveal', () => {
    beforeEach(() => {
      mockUseIsPasskeyActive.mockReturnValue(true);
      mockUseIsPasskeyIncompatibleInSidepanel.mockReturnValue(false);
    });

    it('verifies via passkey and reveals private keys without a password', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockExportAccountsWithPasskey).toHaveBeenCalledWith(
          mockPasskeyAuthResponse,
          [ACCOUNT_ONE_ADDRESS_MOCK],
        );
      });
      expect(mockExportAccounts).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId('multichain-private-key-password-input'),
      ).not.toBeInTheDocument();
      expect(mockTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: TraceName.ShowAccountPrivateKeyList,
        }),
      );
      expect(mockEndTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: TraceName.ShowAccountPrivateKeyList,
        }),
      );
    });

    it('falls back to the password prompt when the passkey ceremony is cancelled', async () => {
      mockStartPasskeyAuthentication.mockRejectedValue(new Error('cancelled'));
      mockIsPasskeyCeremonySilentError.mockReturnValue(true);

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('multichain-private-key-password-input'),
        ).toBeInTheDocument();
      });
      expect(mockExportAccountsWithPasskey).not.toHaveBeenCalled();
    });

    it('falls back to the password prompt when "Use password" is clicked', async () => {
      mockStartPasskeyAuthentication.mockReturnValue(
        new Promise(() => {
          // never resolves
        }),
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('export-private-keys-verify-passkey-use-password'),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId('export-private-keys-verify-passkey-use-password'),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('multichain-private-key-password-input'),
        ).toBeInTheDocument();
      });
      expect(mockCancelPasskeyCeremony).toHaveBeenCalled();
    });

    it('falls back to the password prompt when passkey export fails', async () => {
      mockExportAccountsWithPasskey.mockRejectedValueOnce(
        new Error('export failed'),
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByTestId('multichain-private-key-password-input'),
        ).toBeInTheDocument();
      });
      expect(mockEndTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          name: TraceName.ShowAccountPrivateKeyList,
        }),
      );
    });

    it('uses the password prompt when passkey is incompatible in the side panel', () => {
      mockUseIsPasskeyIncompatibleInSidepanel.mockReturnValue(true);

      renderComponent();

      expect(
        screen.getByTestId('multichain-private-key-password-input'),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('export-private-keys-passkey-verifying'),
      ).not.toBeInTheDocument();
      expect(mockStartPasskeyAuthentication).not.toHaveBeenCalled();
    });
  });
});
