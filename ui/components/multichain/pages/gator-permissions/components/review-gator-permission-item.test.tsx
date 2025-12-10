import React from 'react';
import { Hex } from '@metamask/utils';
import {
  StoredGatorPermissionSanitized,
  Signer,
  NativeTokenStreamPermission,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  Erc20TokenPeriodicPermission,
} from '@metamask/gator-permissions-controller';
import { fireEvent } from '@testing-library/react';
import { Settings } from 'luxon';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { ReviewGatorPermissionItem } from './review-gator-permission-item';

const mockAccountAddress = '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';
const mockAccountName = 'Test Gator Account';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        'test-account-id': {
          address: mockAccountAddress,
          id: 'test-account-id',
          metadata: {
            name: mockAccountName,
            importTime: 0,
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [],
          type: 'eip155:eoa',
        },
      },
    },
  },
});

jest.mock(
  '../../../../../selectors/gator-permissions/gator-permissions',
  () => ({
    getPendingRevocations: jest.fn().mockReturnValue([]),
  }),
);

jest.mock(
  '../../../../../hooks/gator-permissions/useGatorPermissionTokenInfo',
  () => ({
    useGatorPermissionTokenInfo: jest
      .fn()
      .mockImplementation((tokenAddress, _chainId, permissionType) => {
        const isNative = permissionType?.includes('native-token');

        if (isNative) {
          return {
            tokenInfo: { symbol: 'ETH', decimals: 18 },
            loading: false,
            error: null,
            source: 'native',
          };
        }

        if (tokenAddress === '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599') {
          return {
            tokenInfo: { symbol: 'WBTC', decimals: 8 },
            loading: false,
            error: null,
            source: 'cache',
          };
        }

        // Return loading state for unknown tokens
        return {
          tokenInfo: { symbol: 'Unknown Token', decimals: 18 },
          loading: true,
          error: null,
          source: null,
        };
      }),
  }),
);

describe('Permission List Item', () => {
  beforeAll(() => {
    // Set Luxon to use UTC as the default timezone for consistent test results
    Settings.defaultZone = 'utc';
    // Mock the current time to be far from the test timestamp (more than a day away)
    // This ensures dates are shown without time (MM/dd/yyyy format only)
    Settings.now = () => new Date('2025-01-01T00:00:00Z').getTime();
  });

  afterAll(() => {
    // Reset to system default
    Settings.defaultZone = 'system';
    Settings.now = () => Date.now();
  });

  describe('render', () => {
    const mockOnClick = jest.fn();
    const mockNetworkName = 'Ethereum';
    const mockStartTime = 1736271776; // January 7, 2025;

    describe('NATIVE token permissions', () => {
      const mockNativeTokenStreamPermission: StoredGatorPermissionSanitized<
        Signer,
        NativeTokenStreamPermission
      > = {
        permissionResponse: {
          chainId: '0x1',
          address: mockAccountAddress,
          permission: {
            type: 'native-token-stream',
            isAdjustmentAllowed: false,
            data: {
              maxAmount: '0x22b1c8c1227a0000', // 2.5 ETH (18 decimals)
              initialAmount: '0x6f05b59d3b20000', // 0.5 ETH (18 decimals)
              amountPerSecond: '0x6f05b59d3b20000', // 0.5 ETH/sec (18 decimals)
              startTime: mockStartTime,
              justification:
                'This is a very important request for streaming allowance for some very important thing',
            },
          },
          context: '0x00000000',
          signerMeta: {
            delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
          },
        },
        siteOrigin: 'http://localhost:8000',
      };

      const mockNativeTokenPeriodicPermission: StoredGatorPermissionSanitized<
        Signer,
        NativeTokenPeriodicPermission
      > = {
        permissionResponse: {
          chainId: '0x1',
          address: mockAccountAddress,
          permission: {
            type: 'native-token-periodic',
            isAdjustmentAllowed: false,
            data: {
              periodAmount: '0x6f05b59d3b20000', // 0.5 ETH per week (18 decimals)
              periodDuration: 604800, // 1 week in seconds
              startTime: mockStartTime,
              justification:
                'This is a very important request for periodic allowance',
            },
          },
          context: '0x00000000',
          signerMeta: {
            delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
          },
        },
        siteOrigin: 'http://localhost:8000',
      };

      it('renders native token stream permission correctly', () => {
        const { container, getByTestId } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockNativeTokenStreamPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );
        expect(container).toMatchSnapshot();

        expect(getByTestId('review-gator-permission-item')).toBeInTheDocument();

        // Verify the streaming amount per week
        // 0x6f05b59d3b20000 = 0.5 ETH per second
        // 0.5 ETH/sec * 604,800 seconds/week = 302,400 ETH/week
        const amountLabel = getByTestId('review-gator-permission-amount-label');
        expect(amountLabel).toHaveTextContent('302400 ETH');

        // Verify frequency label
        const frequencyLabel = getByTestId(
          'review-gator-permission-frequency-label',
        );
        expect(frequencyLabel).toBeInTheDocument();

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify initial allowance: 0x6f05b59d3b20000 = 0.5 ETH
        const initialAllowance = getByTestId(
          'review-gator-permission-initial-allowance',
        );
        expect(initialAllowance).toHaveTextContent('0.5 ETH');

        // Verify max allowance: 0x22b1c8c1227a0000 = 2.5 ETH
        const maxAllowance = getByTestId(
          'review-gator-permission-max-allowance',
        );
        expect(maxAllowance).toHaveTextContent('2.5 ETH');

        // Verify stream rate: 0x6f05b59d3b20000 = 0.5 ETH/sec
        const streamRate = getByTestId('review-gator-permission-stream-rate');
        expect(streamRate).toHaveTextContent('0.5 ETH/sec');

        // Verify start date is rendered
        const startDate = getByTestId('review-gator-permission-start-date');
        expect(startDate).toBeInTheDocument();
        expect(startDate).toHaveTextContent('01/07/2025');

        // Verify expiration date is rendered
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);

        // Verify justification is rendered
        const justification = getByTestId(
          'review-gator-permission-justification',
        );
        expect(justification).toBeInTheDocument();
        expect(justification).toHaveTextContent(
          'This is a very important request for streaming allowance for some very important thing',
        );
      });

      it('renders account name and copy button with visual feedback', () => {
        const { getByTestId, getByLabelText } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockNativeTokenStreamPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Verify account name is displayed initially
        const accountText = getByTestId('review-gator-permission-account-name');
        expect(accountText).toBeInTheDocument();
        expect(accountText).toHaveTextContent(mockAccountName);

        // Verify copy button is present (CopyIcon uses aria-label="copy-button")
        const copyButton = getByLabelText('copy-button');
        expect(copyButton).toBeInTheDocument();

        // Click copy button to test functionality
        fireEvent.click(copyButton);

        // After clicking, the account name should remain the same
        expect(accountText).toHaveTextContent(mockAccountName);
      });

      it('renders native token periodic permission correctly', () => {
        const { container, getByTestId } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockNativeTokenPeriodicPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );
        expect(container).toMatchSnapshot();

        expect(getByTestId('review-gator-permission-item')).toBeInTheDocument();

        // Verify the periodic amount
        // 0x6f05b59d3b20000 = 0.5 ETH per period (weekly)
        const amountLabel = getByTestId('review-gator-permission-amount-label');
        expect(amountLabel).toHaveTextContent('0.5 ETH');

        // Verify frequency label shows weekly
        const frequencyLabel = getByTestId(
          'review-gator-permission-frequency-label',
        );
        expect(frequencyLabel).toBeInTheDocument();
        expect(frequencyLabel).toHaveTextContent('Weekly');

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify start date is rendered
        const startDate = getByTestId('review-gator-permission-start-date');
        expect(startDate).toBeInTheDocument();
        expect(startDate).toHaveTextContent('01/07/2025');

        // Verify expiration date is rendered
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);

        // Verify justification is rendered
        const justification = getByTestId(
          'review-gator-permission-justification',
        );
        expect(justification).toBeInTheDocument();
        expect(justification).toHaveTextContent(
          'This is a very important request for periodic allowance',
        );
      });

      it('renders start date with time when timestamp is within a day', () => {
        // Mock current time to be within a day of the start time
        // mockStartTime is 1736271776 (January 7, 2025 ~22:09 UTC)
        // Set current time to January 7, 2025 12:00 UTC (within 24 hours)
        const originalNow = Settings.now;
        Settings.now = () => new Date('2025-01-07T12:00:00Z').getTime();

        const { container, getByTestId } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockNativeTokenStreamPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify start date is rendered with time
        const startDate = getByTestId('review-gator-permission-start-date');
        expect(startDate).toBeInTheDocument();
        // Should show time since it's within a day: MM/dd/yyyy HH:mm
        expect(startDate.textContent).toMatch(/01\/07\/2025 \d{2}:\d{2}/u);

        // Restore original now function
        Settings.now = originalNow;
      });
    });

    describe('ERC20 token permissions', () => {
      /**
       * WBTC, 8 decimal on chain 0x5
       */
      const mockTokenAddress: Hex =
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

      const mockErc20TokenPeriodicPermission: StoredGatorPermissionSanitized<
        Signer,
        Erc20TokenPeriodicPermission
      > = {
        permissionResponse: {
          chainId: '0x5',
          address: mockAccountAddress,
          permission: {
            type: 'erc20-token-periodic',
            isAdjustmentAllowed: false,
            data: {
              tokenAddress: mockTokenAddress, // WBTC with 8 decimals
              periodAmount: '0x2faf080', // 0.5 WBTC per week (8 decimals)
              periodDuration: 604800, // 1 week in seconds
              startTime: mockStartTime,
              justification:
                'This is a very important request for ERC20 periodic allowance',
            },
          },
          context: '0x00000000',
          signerMeta: {
            delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
          },
        },
        siteOrigin: 'http://localhost:8000',
      };

      const mockErc20TokenStreamPermission: StoredGatorPermissionSanitized<
        Signer,
        Erc20TokenStreamPermission
      > = {
        permissionResponse: {
          chainId: '0x5',
          address: mockAccountAddress,
          permission: {
            type: 'erc20-token-stream',
            isAdjustmentAllowed: false,
            data: {
              tokenAddress: mockTokenAddress, // WBTC with 8 decimals
              maxAmount: '0xee6b280', // 2.5 WBTC (8 decimals)
              initialAmount: '0x2faf080', // 0.5 WBTC (8 decimals)
              amountPerSecond: '0x2faf080', // 0.5 WBTC/sec (8 decimals)
              startTime: mockStartTime,
              justification:
                'This is a very important request for ERC20 streaming allowance',
            },
          },
          context: '0x00000000',
          signerMeta: {
            delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
          },
        },
        siteOrigin: 'http://localhost:8000',
      };

      it('renders erc20 token stream permission correctly', () => {
        const { container, getByTestId } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockErc20TokenStreamPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );
        expect(container).toMatchSnapshot();

        expect(getByTestId('review-gator-permission-item')).toBeInTheDocument();

        // Verify the streaming amount per week for ERC20 token (WBTC with 8 decimals)
        // 0x2faf080 = 50,000,000 = 0.5 WBTC per second (8 decimals)
        // 0.5 WBTC/sec * 604,800 seconds/week = 302,400 WBTC/week
        const amountLabel = getByTestId('review-gator-permission-amount-label');
        expect(amountLabel).toHaveTextContent('302400');

        // Verify frequency label
        const frequencyLabel = getByTestId(
          'review-gator-permission-frequency-label',
        );
        expect(frequencyLabel).toBeInTheDocument();

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify initial allowance: 0x2faf080 = 0.5 WBTC (8 decimals)
        const initialAllowance = getByTestId(
          'review-gator-permission-initial-allowance',
        );
        expect(initialAllowance).toHaveTextContent('0.5 WBTC');

        // Verify max allowance: 0xee6b280 = 2.5 WBTC (8 decimals)
        const maxAllowance = getByTestId(
          'review-gator-permission-max-allowance',
        );
        expect(maxAllowance).toHaveTextContent('2.5 WBTC');

        // Verify stream rate: 0x2faf080 = 0.5 WBTC/sec (8 decimals)
        const streamRate = getByTestId('review-gator-permission-stream-rate');
        expect(streamRate).toHaveTextContent('0.5 WBTC/sec');

        // Verify start date is rendered
        const startDate = getByTestId('review-gator-permission-start-date');
        expect(startDate).toBeInTheDocument();
        expect(startDate).toHaveTextContent('01/07/2025');

        // Verify expiration date is rendered
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);
      });

      it('renders erc20 token periodic permission correctly', () => {
        const { container, getByTestId } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockErc20TokenPeriodicPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );
        expect(container).toMatchSnapshot();

        expect(getByTestId('review-gator-permission-item')).toBeInTheDocument();

        // Verify the periodic amount for ERC20 token (WBTC with 8 decimals)
        // 0x2faf080 = 50,000,000 = 0.5 WBTC per week (8 decimals)
        const amountLabel = getByTestId('review-gator-permission-amount-label');
        expect(amountLabel).toHaveTextContent('0.5');

        // Verify frequency label shows weekly
        const frequencyLabel = getByTestId(
          'review-gator-permission-frequency-label',
        );
        expect(frequencyLabel).toBeInTheDocument();
        expect(frequencyLabel).toHaveTextContent('Weekly');

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify start date is rendered
        const startDate = getByTestId('review-gator-permission-start-date');
        expect(startDate).toBeInTheDocument();
        expect(startDate).toHaveTextContent('01/07/2025');

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);
      });

      it('renders erc20 token permission with loading state for unknown token', () => {
        // Use a token address that won't be found in the mock state
        // This simulates a scenario where token metadata is still loading
        const unknownTokenAddress: Hex =
          '0x0000000000000000000000000000000000000001';

        const mockUnknownTokenStreamPermission: StoredGatorPermissionSanitized<
          Signer,
          Erc20TokenStreamPermission
        > = {
          permissionResponse: {
            chainId: '0x5',
            address: mockAccountAddress,
            permission: {
              type: 'erc20-token-stream',
              isAdjustmentAllowed: false,
              data: {
                tokenAddress: unknownTokenAddress, // Unknown token
                maxAmount: '0xee6b280',
                initialAmount: '0x2faf080',
                amountPerSecond: '0x2faf080',
                startTime: mockStartTime,
                justification: 'Test unknown token',
              },
            },
            context: '0x00000000',
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        };

        const { container, getByTestId } = renderWithProvider(
          <ReviewGatorPermissionItem
            networkName={mockNetworkName}
            gatorPermission={mockUnknownTokenStreamPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        expect(container).toMatchSnapshot();

        expect(getByTestId('review-gator-permission-item')).toBeInTheDocument();

        // Verify that when token metadata is loading, it shows a skeleton
        const skeletons = container.querySelectorAll('.mm-skeleton');
        expect(skeletons.length).toBeGreaterThan(0);

        // The amount label should still be in the DOM but wrapped by skeleton
        const amountLabel = getByTestId('review-gator-permission-amount-label');
        expect(amountLabel).toBeInTheDocument();

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // When loading, these fields should still exist but wrapped in skeletons
        const initialAllowance = getByTestId(
          'review-gator-permission-initial-allowance',
        );
        expect(initialAllowance).toBeInTheDocument();

        const maxAllowance = getByTestId(
          'review-gator-permission-max-allowance',
        );
        expect(maxAllowance).toBeInTheDocument();

        const streamRate = getByTestId('review-gator-permission-stream-rate');
        expect(streamRate).toBeInTheDocument();

        // Verify that more skeletons are present after expanding
        const expandedSkeletons = container.querySelectorAll('.mm-skeleton');
        expect(expandedSkeletons.length).toBeGreaterThan(skeletons.length);
      });
    });
  });
});
