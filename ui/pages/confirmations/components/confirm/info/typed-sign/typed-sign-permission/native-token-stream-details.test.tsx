import { NativeTokenStreamPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { NativeTokenStreamDetails } from './native-token-stream-details';

describe('NativeTokenStreamDetails', () => {
  const mockDecodedPermission = {
    expiry: 1234567890 + 86400, // 1 day later
    origin: 'https://metamask.github.io',
    permission: {
      type: 'native-token-stream',
      isAdjustmentAllowed: false,
      data: {
        initialAmount: '0x1234',
        maxAmount: '0x5678',
        amountPerSecond: '0x9abc',
        startTime: 1234567890,
      },
      justification: 'Test justification',
    },
    chainId: '0x1',
    signer: {
      type: 'account',
      data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
    },
  } as const;

  const mockPermission =
    mockDecodedPermission.permission as NativeTokenStreamPermission;

  const defaultProps = {
    permission: mockPermission,
    expiry: mockDecodedPermission.expiry,
    chainId: mockDecodedPermission.chainId,
  };

  const getMockStore = () => {
    const state = getMockTypedSignPermissionConfirmState(mockDecodedPermission);
    return configureMockStore([])(state);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('renders with all required props', () => {
      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails {...defaultProps} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders without initial amount', () => {
      const permissionWithoutInitial = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: undefined,
        },
      };
      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails
          {...defaultProps}
          permission={permissionWithoutInitial}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders without max amount', () => {
      const permissionWithoutMax = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          maxAmount: undefined,
        },
      };
      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails
          {...defaultProps}
          permission={permissionWithoutMax}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders without expiry', () => {
      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails {...defaultProps} expiry={null} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('data display', () => {
    it('displays correct test IDs', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails {...defaultProps} />,
        getMockStore(),
      );

      expect(
        getByTestId('native-token-stream-details-section'),
      ).toBeInTheDocument();
      expect(
        getByTestId('native-token-stream-stream-rate-section'),
      ).toBeInTheDocument();
    });

    it('renders with different amount values', () => {
      const permissionWithDifferentAmounts = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: '0x1000000000000000000', // 1 ETH in wei
          maxAmount: '0x2000000000000000000', // 2 ETH in wei
          amountPerSecond: '0x1000000000000000', // 0.001 ETH per second
        },
      } as NativeTokenStreamPermission;
      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails
          {...defaultProps}
          permission={permissionWithDifferentAmounts}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('amount calculations', () => {
    it('calculates daily amount correctly', () => {
      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails {...defaultProps} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('edge cases', () => {
    it('handles very large amounts', () => {
      const permissionWithLargeAmounts = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: '0xffffffffffffffffffffffffffffffffffffffff',
          maxAmount: '0xffffffffffffffffffffffffffffffffffffffff',
          amountPerSecond: '0xffffffffffffffffffffffffffffffffffffffff',
        },
      } as NativeTokenStreamPermission;

      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails
          {...defaultProps}
          permission={permissionWithLargeAmounts}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('handles zero amounts', () => {
      const permissionWithZeroAmounts = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: '0x0',
          maxAmount: '0x0',
          amountPerSecond: '0x0',
        },
      } as NativeTokenStreamPermission;

      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails
          {...defaultProps}
          permission={permissionWithZeroAmounts}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('handles null initial and max amounts', () => {
      const permissionWithNullAmounts = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: null,
          maxAmount: null,
        },
      } as unknown as NativeTokenStreamPermission;

      const { container } = renderWithConfirmContextProvider(
        <NativeTokenStreamDetails
          {...defaultProps}
          permission={permissionWithNullAmounts}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });
});
