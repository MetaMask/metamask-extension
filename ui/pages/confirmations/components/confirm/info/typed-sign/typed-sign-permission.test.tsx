import { DecodedPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import TypedSignPermissionInfo from './typed-sign-permission';

jest.mock(
  '../../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

describe('TypedSignPermissionInfo', () => {
  describe('permission section fields', () => {
    const permission = {
      expiry: 123456789,
      origin: 'https://metamask.github.io',
      permission: {
        type: 'native-token-stream',
        data: {
          initialAmount: '0x1234',
          maxAmount: '0x1234',
          amountPerSecond: '0x1234',
          startTime: 123456789,
        },
        justification: 'The reason for the permission',
      },
      chainId: '0x1',
      signer: {
        type: 'account',
        data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
      },
    } as const;

    it('renders the Recipient field with the delegate address', () => {
      const state = getMockTypedSignPermissionConfirmState(
        permission as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId, getByText } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );

      const permissionSection = getByTestId('confirmation_permission-section');
      expect(permissionSection).toBeInTheDocument();
      expect(getByText('Recipient')).toBeInTheDocument();
    });
  });

  describe('invalid permission type', () => {
    it('throws an error when an invalid permission type is provided', () => {
      const state = getMockTypedSignPermissionConfirmState({
        permission: { type: 'invalid' },
      } as unknown as DecodedPermission);

      const mockStore = configureMockStore([])(state);
      expect(() =>
        renderWithConfirmContextProvider(
          <TypedSignPermissionInfo />,
          mockStore,
        ),
      ).toThrow('Invalid permission type');
    });

    it('throws an error when decodedPermission is not defined', () => {
      const state = getMockTypedSignPermissionConfirmState();
      Object.values(
        state.metamask.unapprovedTypedMessages,
      )[0].decodedPermission = undefined;

      const mockStore = configureMockStore([])(state);
      expect(() =>
        renderWithConfirmContextProvider(
          <TypedSignPermissionInfo />,
          mockStore,
        ),
      ).toThrow('Decoded permission is undefined');
    });
  });

  describe('native-token-periodic', () => {
    const permission = {
      expiry: 123456789,
      origin: 'https://metamask.github.io',
      permission: {
        type: 'native-token-periodic',
        data: {
          periodAmount: '0x1234',
          periodDuration: 86400, // 1 day in seconds
          startTime: 123456789,
        },
        justification: 'The reason for the permission',
      },
      chainId: '0x1',
      signer: {
        type: 'account',
        data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
      },
    } as const;

    it('renders native token periodic permission details correctly', () => {
      const state = getMockTypedSignPermissionConfirmState(
        permission as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('native-token-periodic-details-section'),
      ).toBeInTheDocument();
    });

    it('throws an error when start time is missing', () => {
      const permissionWithoutStartTime = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            startTime: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutStartTime as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      expect(() =>
        renderWithConfirmContextProvider(
          <TypedSignPermissionInfo />,
          mockStore,
        ),
      ).toThrow('Start time is required');
    });

    it('renders native token periodic permission without expiry', () => {
      const permissionWithoutExpiry = {
        ...permission,
        expiry: null,
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutExpiry as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      const detailsSection = getByTestId(
        'native-token-periodic-details-section',
      );
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });
  });

  describe('native-token-stream', () => {
    const permission = {
      expiry: 123456789,
      origin: 'https://metamask.github.io',
      permission: {
        type: 'native-token-stream',
        data: {
          initialAmount: '0x1234',
          maxAmount: '0x1234',
          amountPerSecond: '0x1234',
          startTime: 123456789,
        },
        justification: 'The reason for the permission',
      },
      chainId: '0x1',
      signer: {
        type: 'account',
        data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
      },
    } as const;

    it('renders native token stream permission details correctly', () => {
      const state = getMockTypedSignPermissionConfirmState(
        permission as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
      expect(
        getByTestId('native-token-stream-stream-rate-section'),
      ).toBeInTheDocument();
    });

    it('throws an error when start time is missing', () => {
      const permissionWithoutStartTime = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            startTime: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutStartTime as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      expect(() =>
        renderWithConfirmContextProvider(
          <TypedSignPermissionInfo />,
          mockStore,
        ),
      ).toThrow('Start time is required');
    });

    it('renders native token stream permission without initial amount', () => {
      const permissionWithoutInitialAmount = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            initialAmount: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutInitialAmount as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('renders native token stream permission without max amount', () => {
      const permissionWithoutMaxAmount = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            maxAmount: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutMaxAmount as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('renders native token stream permission without expiry', () => {
      const permissionWithoutExpiry = {
        ...permission,
        expiry: null,
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutExpiry as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      const detailsSection = getByTestId('native-token-stream-details-section');
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });
  });

  describe('erc20-token-periodic', () => {
    const permission = {
      expiry: 123456789,
      origin: 'https://metamask.github.io',
      permission: {
        type: 'erc20-token-periodic',
        data: {
          tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
          periodAmount: '0x1234',
          periodDuration: 604800, // 1 week in seconds
          startTime: 123456789,
        },
        justification: 'The reason for the permission',
      },
      chainId: '0x1',
      signer: {
        type: 'account',
        data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
      },
    } as const;

    it('renders ERC20 token periodic permission details correctly', () => {
      const state = getMockTypedSignPermissionConfirmState(
        permission as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('erc20-token-periodic-details-section'),
      ).toBeInTheDocument();
    });

    it('throws an error when start time is missing', () => {
      const permissionWithoutStartTime = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            startTime: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutStartTime as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      expect(() =>
        renderWithConfirmContextProvider(
          <TypedSignPermissionInfo />,
          mockStore,
        ),
      ).toThrow('Start time is required');
    });

    it('renders ERC20 token periodic permission without expiry', () => {
      const permissionWithoutExpiry = {
        ...permission,
        expiry: null,
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutExpiry as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      const detailsSection = getByTestId(
        'erc20-token-periodic-details-section',
      );
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });
  });

  describe('erc20-token-stream', () => {
    const permission = {
      expiry: 123456789,
      origin: 'https://metamask.github.io',
      permission: {
        type: 'erc20-token-stream',
        data: {
          tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
          initialAmount: '0x1234',
          maxAmount: '0x1234',
          amountPerSecond: '0x1234',
          startTime: 123456789,
        },
        justification: 'The reason for the permission',
      },
      chainId: '0x1',
      signer: {
        type: 'account',
        data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
      },
    } as const;

    it('renders ERC20 token stream permission details correctly', () => {
      const state = getMockTypedSignPermissionConfirmState(
        permission as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('erc20-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('throws an error when start time is missing', () => {
      const permissionWithoutStartTime = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            startTime: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutStartTime as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      expect(() =>
        renderWithConfirmContextProvider(
          <TypedSignPermissionInfo />,
          mockStore,
        ),
      ).toThrow('Start time is required');
    });

    it('renders ERC20 token stream permission without initial amount', () => {
      const permissionWithoutInitialAmount = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            initialAmount: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutInitialAmount as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('erc20-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('renders ERC20 token stream permission without max amount', () => {
      const permissionWithoutMaxAmount = {
        ...permission,
        permission: {
          ...permission.permission,
          data: {
            ...permission.permission.data,
            maxAmount: undefined,
          },
        },
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutMaxAmount as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      expect(
        getByTestId('erc20-token-stream-details-section'),
      ).toBeInTheDocument();
    });

    it('renders ERC20 token stream permission without expiry', () => {
      const permissionWithoutExpiry = {
        ...permission,
        expiry: null,
      };
      const state = getMockTypedSignPermissionConfirmState(
        permissionWithoutExpiry as DecodedPermission,
      );
      const mockStore = configureMockStore([])(state);
      const { getByTestId } = renderWithConfirmContextProvider(
        <TypedSignPermissionInfo />,
        mockStore,
      );
      const detailsSection = getByTestId('erc20-token-stream-details-section');
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });
  });
});
