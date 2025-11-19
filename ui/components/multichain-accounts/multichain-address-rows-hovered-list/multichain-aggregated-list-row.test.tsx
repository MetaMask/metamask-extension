import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { CopyParams } from '../multichain-address-row/multichain-address-row';
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    if (key === 'networkNameEthereum') {
      return 'Ethereum';
    }
    return key;
  },
}));

const mockStore = configureStore([]);

const TEST_STRINGS = {
  FULL_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678',
  TRUNCATED_ADDRESS: '0x12345...45678',
  ALT_FULL_ADDRESS: '0xabcdef1234567890abcdef1234567890abcdef12',
  ALT_TRUNCATED_ADDRESS: '0xabCDE...DeF12',
  COPY_MESSAGE: 'Copied!',
  EMPTY_STRING: '',
  ETHEREUM_GROUP_NAME: 'Ethereum',
  SOLANA_NETWORK_NAME: 'Solana Mainnet',
} as const;

const TEST_CHAIN_IDS = {
  ETHEREUM: '0x1',
  POLYGON: '0x89',
  ARBITRUM: '0xa4b1',
  FANTOM: '0xfa',
  MOONRIVER: '0x2105',
  OPTIMISM: '0xa',
  UNKNOWN: 'unknown-chain-id',
  HEX_123: '0x123',
  ETHEREUM_CAIP: 'eip155:1',
  POLYGON_CAIP: 'eip155:137',
  ARBITRUM_CAIP: 'eip155:42161',
  SOLANA_CAIP: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
} as const;

const TEST_IDS = {
  MULTICHAIN_ADDRESS_ROW: 'multichain-address-row',
  AVATAR_GROUP: 'avatar-group',
} as const;

const CSS_CLASSES = {
  MULTICHAIN_ADDRESS_ROW: 'multichain-aggregated-address-row',
  CUSTOM_CLASS: 'custom-class',
} as const;

const IMAGE_SOURCES = {
  ETH_LOGO: './images/eth_logo.svg',
  POL_TOKEN: './images/pol-token.svg',
  ARBITRUM: './images/arbitrum.svg',
} as const;

const ALT_TEXTS = {
  NETWORK_LOGO: 'network logo',
} as const;

const createTestProps = (
  overrides = {},
): {
  chainIds: string[];
  address: string;
  copyActionParams: CopyParams;
  className?: string;
} => ({
  chainIds: ['eip155:1', 'eip155:137'],
  address: TEST_STRINGS.FULL_ADDRESS,
  copyActionParams: {
    callback: jest.fn(),
    message: TEST_STRINGS.COPY_MESSAGE,
  },
  ...overrides,
});

const createMockState = () => ({
  metamask: {
    useBlockie: false,
    networkConfigurationsByChainId: {
      '0x1': {
        chainId: '0x1',
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            url: 'https://mainnet.infura.io/v3',
            type: 'infura',
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
      '0x89': {
        chainId: '0x89',
        name: 'Polygon Mainnet',
        nativeCurrency: 'MATIC',
        rpcEndpoints: [
          {
            networkClientId: 'polygon-mainnet',
            url: 'https://polygon-rpc.com',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
      '0xa4b1': {
        chainId: '0xa4b1',
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'arbitrum-mainnet',
            url: 'https://arb1.arbitrum.io/rpc',
            type: 'custom',
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
    },
    multichainNetworkConfigurationsByChainId: {
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana Mainnet',
        nativeCurrency: 'SOL',
        isEvm: false,
      },
    },
    internalAccounts: {
      accounts: {
        'test-account-1': {
          id: 'test-account-1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          scopes: ['eip155:1', 'eip155:137', 'eip155:42161'],
          metadata: {
            name: 'Test Account 1',
            keyring: { type: 'HD Key Tree' },
            importTime: Date.now(),
            lastSelected: Date.now(),
          },
        },
        'test-account-2': {
          id: 'test-account-2',
          address: 'DfGj1XfVTbfM7VZvqLkVNvDhFb4Nt8xBpGpH5f2r3Dqq',
          scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
          metadata: {
            name: 'Test Account 2',
            keyring: { type: 'Snap' },
            importTime: Date.now(),
            lastSelected: Date.now(),
            snap: {
              enabled: true,
            },
          },
        },
      },
    },
  },
});

describe('MultichainAggregatedAddressListRow', () => {
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    store = mockStore(createMockState());
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with all provided props', () => {
      const props = createTestProps();

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      expect(
        screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW),
      ).toBeInTheDocument();
      expect(
        screen.getByText(TEST_STRINGS.ETHEREUM_GROUP_NAME),
      ).toBeInTheDocument();
      expect(
        screen.getByText(TEST_STRINGS.TRUNCATED_ADDRESS),
      ).toBeInTheDocument();
    });

    it('renders with custom className when provided', () => {
      const props = createTestProps({ className: CSS_CLASSES.CUSTOM_CLASS });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
      expect(row).toHaveClass(CSS_CLASSES.MULTICHAIN_ADDRESS_ROW);
      expect(row).toHaveClass(CSS_CLASSES.CUSTOM_CLASS);
    });

    it('displays avatar group with network images', () => {
      const chainIds = ['eip155:1', 'eip155:137', 'eip155:42161'];
      const props = createTestProps({ chainIds });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
      expect(row).toBeInTheDocument();

      // Verify network avatars are displayed
      // Note: Only networks with valid images will be rendered
      const networkAvatars = screen.queryAllByAltText(ALT_TEXTS.NETWORK_LOGO);

      expect(networkAvatars.length).toBeGreaterThanOrEqual(1);
      expect(networkAvatars.length).toBeLessThanOrEqual(chainIds.length);

      // Verify at least one expected image is present
      const avatarSources = networkAvatars.map((avatar) =>
        avatar.getAttribute('src'),
      );
      const expectedSources = [
        IMAGE_SOURCES.ETH_LOGO,
        IMAGE_SOURCES.POL_TOKEN,
        IMAGE_SOURCES.ARBITRUM,
      ];
      expect(
        avatarSources.some(
          (src) =>
            src &&
            expectedSources.includes(src as (typeof expectedSources)[number]),
        ),
      ).toBe(true);
    });

    it('truncates address correctly', () => {
      const address = TEST_STRINGS.ALT_FULL_ADDRESS;
      const props = createTestProps({ address });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      expect(
        screen.getByText(TEST_STRINGS.ALT_TRUNCATED_ADDRESS),
      ).toBeInTheDocument();
    });
  });

  describe('Copy Functionality', () => {
    it('executes copy callback when row is clicked', () => {
      const mockCallback = jest.fn();
      const props = createTestProps({
        copyActionParams: {
          callback: mockCallback,
          message: TEST_STRINGS.COPY_MESSAGE,
        },
      });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
      fireEvent.click(row);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('shows copy message after clicking row', () => {
      const props = createTestProps();

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);

      // Initially should show the truncated address
      expect(
        screen.getByText(TEST_STRINGS.TRUNCATED_ADDRESS),
      ).toBeInTheDocument();

      // Click row
      fireEvent.click(row);

      // Should show the copy message
      expect(screen.getByText(TEST_STRINGS.COPY_MESSAGE)).toBeInTheDocument();
      expect(props.copyActionParams.callback).toHaveBeenCalled();
    });

    it('reverts icon to copy state after 1 second', async () => {
      const props = createTestProps();

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
      fireEvent.click(row);

      expect(props.copyActionParams.callback).toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(
        screen.getByText(TEST_STRINGS.TRUNCATED_ADDRESS),
      ).toBeInTheDocument();
    });

    it('changes background color to success state when address is copied', () => {
      const props = createTestProps();

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );
      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);

      expect(row).toHaveClass(CSS_CLASSES.MULTICHAIN_ADDRESS_ROW);

      fireEvent.click(row);

      expect(props.copyActionParams.callback).toHaveBeenCalled();
    });

    it('resets state after 1 second', () => {
      const props = createTestProps();

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
      fireEvent.click(row);

      expect(props.copyActionParams.callback).toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      fireEvent.click(row);
      expect(props.copyActionParams.callback).toHaveBeenCalled();
    });
  });

  describe('Group Name Derivation', () => {
    it('displays "Ethereum" for EVM chain IDs', () => {
      const props = createTestProps({
        chainIds: ['eip155:1', 'eip155:137'],
      });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      expect(
        screen.getByText(TEST_STRINGS.ETHEREUM_GROUP_NAME),
      ).toBeInTheDocument();
    });

    it('displays "Ethereum" for CAIP-format EVM chain IDs', () => {
      const props = createTestProps({
        chainIds: ['eip155:1', 'eip155:137'],
      });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      expect(
        screen.getByText(TEST_STRINGS.ETHEREUM_GROUP_NAME),
      ).toBeInTheDocument();
    });

    it('displays network name for non-EVM chain IDs', () => {
      const props = createTestProps({
        chainIds: [TEST_CHAIN_IDS.SOLANA_CAIP],
      });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      expect(
        screen.getByText(TEST_STRINGS.SOLANA_NETWORK_NAME),
      ).toBeInTheDocument();
    });

    it('displays "Ethereum" for mixed EVM and non-EVM chains with at least one EVM chain', () => {
      const props = createTestProps({
        chainIds: [TEST_CHAIN_IDS.ETHEREUM_CAIP, TEST_CHAIN_IDS.SOLANA_CAIP],
      });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      expect(
        screen.getByText(TEST_STRINGS.ETHEREUM_GROUP_NAME),
      ).toBeInTheDocument();
    });
  });
});
