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
import { decodeDelegations } from '@metamask/delegation-core';
import { getDeleGatorEnvironment } from '../../../../../../shared/lib/delegation/environment';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { ReviewGatorPermissionItem } from './review-gator-permission-item';

const store = configureStore({
  ...mockState,
  metamask: {
    ...mockState.metamask,
  },
});

jest.mock(
  '../../../../../selectors/gator-permissions/gator-permissions',
  () => ({
    getPendingRevocations: jest.fn().mockReturnValue([]),
  }),
);

jest.mock('@metamask/delegation-core', () => ({
  decodeDelegations: jest.fn(),
}));

jest.mock('../../../../../../shared/lib/delegation/environment', () => ({
  getDeleGatorEnvironment: jest.fn(),
}));

describe('Permission List Item', () => {
  beforeAll(() => {
    // Set Luxon to use UTC as the default timezone for consistent test results
    Settings.defaultZone = 'utc';
  });

  afterAll(() => {
    // Reset to system default
    Settings.defaultZone = 'system';
  });

  describe('render', () => {
    const mockOnClick = jest.fn();
    const mockNetworkName = 'Ethereum';
    const mockSelectedAccountAddress =
      '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63';
    const mockStartTime = 1736271776; // January 7, 2025;

    describe('NATIVE token permissions', () => {
      const mockExpiryTimestamp = 1767225600; // January 1, 2026
      const expiryHex = mockExpiryTimestamp.toString(16).padStart(32, '0');
      const termsHex = `0x${'0'.repeat(32)}${expiryHex}` as Hex;

      beforeEach(() => {
        // Configure mocks for delegation decoding
        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [
              {
                enforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
                terms: termsHex,
                args: '0x',
              },
            ],
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });
      });

      const mockNativeTokenStreamPermission: StoredGatorPermissionSanitized<
        Signer,
        NativeTokenStreamPermission
      > = {
        permissionResponse: {
          chainId: '0x1',
          address: mockSelectedAccountAddress,
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
          address: mockSelectedAccountAddress,
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

        // Verify expiration date is rendered with correct date (January 1, 2026)
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('01/01/2026');

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);
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

        // Verify expiration date is rendered with correct date (January 1, 2026)
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('01/01/2026');

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);
      });
    });

    describe('ERC20 token permissions', () => {
      /**
       * WBTC, 8 decimal on chain 0x5
       */
      const mockTokenAddress: Hex =
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

      const mockExpiryTimestamp = 1767225600; // January 1, 2026
      const expiryHex = mockExpiryTimestamp.toString(16).padStart(32, '0');
      const termsHex = `0x${'0'.repeat(32)}${expiryHex}` as Hex;

      beforeEach(() => {
        // Configure mocks for delegation decoding
        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [
              {
                enforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
                terms: termsHex,
                args: '0x',
              },
            ],
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });
      });

      const mockErc20TokenPeriodicPermission: StoredGatorPermissionSanitized<
        Signer,
        Erc20TokenPeriodicPermission
      > = {
        permissionResponse: {
          chainId: '0x5',
          address: mockSelectedAccountAddress,
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
          address: mockSelectedAccountAddress,
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

        // Verify expiration date is rendered with correct date (January 1, 2026)
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('01/01/2026');

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

        // Verify expiration date is rendered with correct date (January 1, 2026)
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('01/01/2026');

        // Verify network name is rendered
        const networkName = getByTestId('review-gator-permission-network-name');
        expect(networkName).toHaveTextContent(mockNetworkName);
      });

      it('renders erc20 token permission with unknown token amount correctly', () => {
        // Use a token address that won't be found in the mock state
        // This simulates a scenario where token metadata is not available
        const unknownTokenAddress: Hex =
          '0x0000000000000000000000000000000000000001';

        const mockUnknownTokenStreamPermission: StoredGatorPermissionSanitized<
          Signer,
          Erc20TokenStreamPermission
        > = {
          permissionResponse: {
            chainId: '0x5',
            address: mockSelectedAccountAddress,
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

        // Verify that when token metadata is not found, it shows unknown amount text
        const amountLabel = getByTestId('review-gator-permission-amount-label');
        expect(amountLabel.textContent).toContain('Unknown amount');

        // Expand to see more details
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify initial allowance shows unknown amount
        const initialAllowance = getByTestId(
          'review-gator-permission-initial-allowance',
        );
        expect(initialAllowance.textContent).toContain('Unknown amount');

        // Verify max allowance shows unknown amount
        const maxAllowance = getByTestId(
          'review-gator-permission-max-allowance',
        );
        expect(maxAllowance.textContent).toContain('Unknown amount');

        // Verify stream rate shows unknown amount
        const streamRate = getByTestId('review-gator-permission-stream-rate');
        expect(streamRate.textContent).toContain('Unknown amount');
      });

      it('renders "No expiration" when permission has no expiry', () => {
        // Mock decodeDelegations to return a delegation without TimestampEnforcer
        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [], // No TimestampEnforcer caveat
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermissionWithoutExpiry: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission without expiry',
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
            gatorPermission={mockPermissionWithoutExpiry}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows "No expiration"
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('No expiration');
      });

      it('renders correct expiration date when permission has expiry', () => {
        const customExpiryTimestamp = 1744588800; // April 14, 2025

        // Convert timestamp to hex for the caveat terms (32 bytes total, expiry in last 16 bytes)
        const customExpiryHex = customExpiryTimestamp
          .toString(16)
          .padStart(32, '0');
        const customTermsHex = `0x${'0'.repeat(32)}${customExpiryHex}` as Hex;

        // Mock decodeDelegations to return a delegation with TimestampEnforcer caveat
        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [
              {
                enforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
                terms: customTermsHex,
                args: '0x',
              },
            ],
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermissionWithExpiry: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission with expiry',
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
            gatorPermission={mockPermissionWithExpiry}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows the correct date
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('04/14/2025');
      });

      it('renders "No expiration" when delegation count is zero', () => {
        // Mock decodeDelegations to return empty array
        (decodeDelegations as jest.Mock).mockReturnValue([]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermission: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission',
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
            gatorPermission={mockPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows "No expiration"
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('No expiration');
      });

      it('renders "No expiration" when delegation count is greater than one', () => {
        // Mock decodeDelegations to return multiple delegations
        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [],
            salt: 0n,
            signature: '0x',
          },
          {
            delegate: '0x276059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [],
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermission: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission',
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
            gatorPermission={mockPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows "No expiration"
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('No expiration');
      });

      it('renders "No expiration" when terms have invalid length', () => {
        // Mock decodeDelegations with invalid terms length
        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [
              {
                enforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
                terms: '0x1234' as Hex, // Invalid length (not 64 hex chars)
                args: '0x',
              },
            ],
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermission: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission',
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
            gatorPermission={mockPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows "No expiration"
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('No expiration');
      });

      it('renders "No expiration" when timestamp is zero', () => {
        // All zeros in the terms = timestamp 0
        const zeroTermsHex = `0x${'0'.repeat(64)}` as Hex;

        (decodeDelegations as jest.Mock).mockReturnValue([
          {
            delegate: '0x176059c27095647e995b5db678800f8ce7f581dd',
            authority: '0x0000000000000000000000000000000000000000',
            caveats: [
              {
                enforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
                terms: zeroTermsHex,
                args: '0x',
              },
            ],
            salt: 0n,
            signature: '0x',
          },
        ]);

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermission: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission',
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
            gatorPermission={mockPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows "No expiration"
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('No expiration');
      });

      it('renders "No expiration" when decodeDelegations throws error', () => {
        // Mock decodeDelegations to throw an error
        (decodeDelegations as jest.Mock).mockImplementation(() => {
          throw new Error('Decoding failed');
        });

        (getDeleGatorEnvironment as jest.Mock).mockReturnValue({
          caveatEnforcers: {
            TimestampEnforcer: '0x1046bb45c8d673d4ea75321280db34899413c069',
          },
        });

        const mockPermission: StoredGatorPermissionSanitized<
          Signer,
          NativeTokenPeriodicPermission
        > = {
          permissionResponse: {
            chainId: '0x1',
            address: mockSelectedAccountAddress,
            permission: {
              type: 'native-token-periodic',
              isAdjustmentAllowed: false,
              data: {
                periodAmount: '0x6f05b59d3b20000',
                periodDuration: 604800,
                startTime: mockStartTime,
                justification: 'Test permission',
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
            gatorPermission={mockPermission}
            onRevokeClick={() => mockOnClick()}
          />,
          store,
        );

        // Expand to see expiration date
        const expandButton = container.querySelector('[aria-label="expand"]');
        if (expandButton) {
          fireEvent.click(expandButton);
        }

        // Verify expiration date shows "No expiration"
        const expirationDate = getByTestId(
          'review-gator-permission-expiration-date',
        );
        expect(expirationDate).toBeInTheDocument();
        expect(expirationDate).toHaveTextContent('No expiration');
      });
    });
  });
});
