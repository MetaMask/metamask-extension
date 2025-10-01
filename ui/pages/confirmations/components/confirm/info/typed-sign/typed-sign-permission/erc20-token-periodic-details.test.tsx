import { Erc20TokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { Erc20TokenPeriodicDetails } from './erc20-token-periodic-details';

describe('Erc20TokenPeriodicDetails', () => {
  const mockDecodedPermission = {
    expiry: 1234567890 + 86400, // 1 day later
    origin: 'https://metamask.github.io',
    permission: {
      type: 'erc20-token-periodic',
      isAdjustmentAllowed: false,
      data: {
        tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
        periodAmount: '0x1234',
        periodDuration: 86400, // 1 day in seconds
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
    mockDecodedPermission.permission as Erc20TokenPeriodicPermission;

  const defaultProps = {
    permission: mockPermission,
    decimals: 18,
    expiry: mockDecodedPermission.expiry,
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
        <Erc20TokenPeriodicDetails {...defaultProps} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders without expiry', () => {
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails {...defaultProps} expiry={null} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders with undefined decimals (shows skeleton)', () => {
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails {...defaultProps} decimals={undefined} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('error handling', () => {
    it('throws error when start time is missing', () => {
      const permissionWithoutStartTime = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          startTime: undefined,
        },
      };

      expect(() =>
        renderWithConfirmContextProvider(
          <Erc20TokenPeriodicDetails
            {...defaultProps}
            permission={permissionWithoutStartTime}
          />,
          getMockStore(),
        ),
      ).toThrow('Start time is required');
    });
  });

  describe('data display', () => {
    it('displays correct test ID', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails {...defaultProps} />,
        getMockStore(),
      );

      expect(
        getByTestId('erc20-token-periodic-details-section'),
      ).toBeInTheDocument();
    });

    it('renders with different decimal values', () => {
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails {...defaultProps} decimals={6} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders with zero decimals', () => {
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails {...defaultProps} decimals={0} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('period duration variations', () => {
    it('renders with weekly period duration', () => {
      const permissionWithWeeklyPeriod = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodDuration: 604800, // 1 week in seconds
        },
      };

      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails
          {...defaultProps}
          permission={permissionWithWeeklyPeriod}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders with hourly period duration', () => {
      const permissionWithHourlyPeriod = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodDuration: 3600, // 1 hour in seconds
        },
      };

      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails
          {...defaultProps}
          permission={permissionWithHourlyPeriod}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('edge cases', () => {
    it('handles very large period amount', () => {
      const permissionWithLargeAmount = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodAmount: '0xffffffffffffffffffffffffffffffffffffffff',
        },
      } as Erc20TokenPeriodicPermission;
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenPeriodicDetails
          {...defaultProps}
          permission={permissionWithLargeAmount}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('handles zero period duration', () => {
      const permissionWithZeroDuration = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodDuration: 0,
        },
      } as Erc20TokenPeriodicPermission;

      expect(() =>
        renderWithConfirmContextProvider(
          <Erc20TokenPeriodicDetails
            {...defaultProps}
            permission={permissionWithZeroDuration}
          />,
          getMockStore(),
        ),
      ).toThrow('Cannot format period duration of 0 seconds');
    });
  });
});
