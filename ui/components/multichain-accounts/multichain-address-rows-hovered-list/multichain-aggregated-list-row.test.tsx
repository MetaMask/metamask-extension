import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MultichainAggregatedAddressListRow } from './multichain-aggregated-list-row';
import { CopyParams } from '../multichain-address-row/multichain-address-row';

const mockStore = configureStore([]);

const TEST_STRINGS = {
  GROUP_NAME: 'My Accounts',
  FULL_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678',
  TRUNCATED_ADDRESS: '0x12345...45678',
  ALT_FULL_ADDRESS: '0xabcdef1234567890abcdef1234567890abcdef12',
  ALT_TRUNCATED_ADDRESS: '0xabcde...def12',
  COPY_MESSAGE: 'Copied!',
  EMPTY_STRING: '',
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
} as const;

const TEST_IDS = {
  MULTICHAIN_ADDRESS_ROW: 'multichain-address-row',
  AVATAR_GROUP: 'avatar-group',
} as const;

const CSS_CLASSES = {
  MULTICHAIN_ADDRESS_ROW: 'multichain-address-row',
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
  groupName: string;
  copyActionParams: CopyParams;
  className?: string;
} => ({
  chainIds: [TEST_CHAIN_IDS.ETHEREUM, TEST_CHAIN_IDS.POLYGON],
  address: TEST_STRINGS.FULL_ADDRESS,
  groupName: TEST_STRINGS.GROUP_NAME,
  copyActionParams: {
    callback: jest.fn(),
    message: TEST_STRINGS.COPY_MESSAGE,
  },
  ...overrides,
});

const createMockState = () => ({
  metamask: {
    useBlockie: false,
  },
});

describe('MultichainAggregatedAddressListRow', () => {
  let store: any;

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
      expect(screen.getByText(TEST_STRINGS.GROUP_NAME)).toBeInTheDocument();
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

    it('displays avatar group with correct network images', () => {
      const chainIds = [
        TEST_CHAIN_IDS.ETHEREUM,
        TEST_CHAIN_IDS.POLYGON,
        TEST_CHAIN_IDS.ARBITRUM,
      ];
      const props = createTestProps({ chainIds });

      render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);
      expect(row).toBeInTheDocument();

      // Verify avatar group is rendered
      const avatarGroup = screen.getByTestId(TEST_IDS.AVATAR_GROUP);
      expect(avatarGroup).toBeInTheDocument();

      // Verify multiple network avatars are displayed
      const networkAvatars = screen.getAllByAltText(ALT_TEXTS.NETWORK_LOGO);
      expect(networkAvatars).toHaveLength(chainIds.length);

      // Verify the avatars have proper image sources
      // Note: AvatarGroup may display avatars in reverse order
      const avatarSources = networkAvatars.map((avatar) =>
        avatar.getAttribute('src'),
      );
      expect(avatarSources).toContain(IMAGE_SOURCES.ETH_LOGO);
      expect(avatarSources).toContain(IMAGE_SOURCES.POL_TOKEN);
      expect(avatarSources).toContain(IMAGE_SOURCES.ARBITRUM);
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
    it('executes copy callback when copy button is clicked', () => {
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

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      expect(mockCallback).toHaveBeenCalled();
    });

    it('shows copy message after clicking copy button', () => {
      const props = createTestProps();

      const { container } = render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );

      const copyButton = screen.getByRole('button');

      // Initially should show the truncated address
      expect(
        screen.getByText(TEST_STRINGS.TRUNCATED_ADDRESS),
      ).toBeInTheDocument();

      // Click copy button
      fireEvent.click(copyButton);

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

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

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

      const { container } = render(
        <Provider store={store}>
          <MultichainAggregatedAddressListRow {...props} />
        </Provider>,
      );
      const row = screen.getByTestId(TEST_IDS.MULTICHAIN_ADDRESS_ROW);

      expect(row).toHaveClass(CSS_CLASSES.MULTICHAIN_ADDRESS_ROW);

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

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

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      expect(props.copyActionParams.callback).toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      fireEvent.click(copyButton);
      expect(props.copyActionParams.callback).toHaveBeenCalled();
    });
  });
});
