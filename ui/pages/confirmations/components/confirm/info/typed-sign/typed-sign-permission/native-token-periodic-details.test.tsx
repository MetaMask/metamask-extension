import { NativeTokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';

import { NativeTokenPeriodicDetails } from './native-token-periodic-details';
import { formatPeriodDuration } from './typed-sign-permission-util';

// Mock the formatPeriodDuration utility function
jest.mock('./typed-sign-permission-util', () => ({
  formatPeriodDuration: jest.fn().mockReturnValue('Every day'),
}));

describe('NativeTokenPeriodicDetails', () => {
  const mockDecodedPermission = {
    expiry: 1234567890 + 86400, // 1 day later
    origin: 'https://metamask.github.io',
    permission: {
      type: 'native-token-periodic',
      isAdjustmentAllowed: false,
      data: {
        periodAmount: '0x1234',
        periodDuration: 86400, // 1 day in seconds
        startTime: 1234567890,
      },
    },
    chainId: '0x1',
    signer: {
      type: 'account',
      data: { address: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829' },
    },
  } as const;

  const mockPermission =
    mockDecodedPermission.permission as NativeTokenPeriodicPermission;

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

  const renderAndGetDetailsSection = (
    props: Parameters<typeof NativeTokenPeriodicDetails>[0],
  ) => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <NativeTokenPeriodicDetails {...props} />,
      getMockStore(),
    );

    const detailsSection = getByTestId('native-token-periodic-details-section');

    return detailsSection;
  };

  describe('basic functionality', () => {
    it('renders with all required props', () => {
      const detailsSection = renderAndGetDetailsSection(defaultProps);

      expect(detailsSection).toBeInTheDocument();
    });

    it('renders without expiry', () => {
      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        expiry: null,
      });

      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
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
          <NativeTokenPeriodicDetails
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
      const detailsSection = renderAndGetDetailsSection(defaultProps);

      expect(detailsSection).toBeInTheDocument();
    });

    it('renders with different period amount values', () => {
      const permissionWithDifferentAmount = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodAmount: '0x1000000000000000000', // 1 ETH in wei
        },
      } as NativeTokenPeriodicPermission;

      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithDifferentAmount,
      });

      expect(detailsSection).toBeInTheDocument();
      // period label comes from mocked formatter
      expect(detailsSection?.textContent?.includes('Every day')).toBe(true);
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

      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithWeeklyPeriod,
      });
      expect(detailsSection).toBeInTheDocument();
      expect(formatPeriodDuration).toHaveBeenCalledWith(
        expect.any(Function),
        604800,
      );
      expect(detailsSection?.textContent?.includes('Every day')).toBe(true);
    });

    it('renders with hourly period duration', () => {
      const permissionWithHourlyPeriod = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodDuration: 3600, // 1 hour in seconds
        },
      };

      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithHourlyPeriod,
      });
      expect(detailsSection).toBeInTheDocument();
      expect(formatPeriodDuration).toHaveBeenCalledWith(
        expect.any(Function),
        3600,
      );
      expect(detailsSection?.textContent?.includes('Every day')).toBe(true);
    });

    it('renders with complex period duration', () => {
      const permissionWithComplexPeriod = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodDuration: 950400, // 1 week, 4 days, 1 hour in seconds
        },
      };

      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithComplexPeriod,
      });
      expect(detailsSection).toBeInTheDocument();
      expect(formatPeriodDuration).toHaveBeenCalledWith(
        expect.any(Function),
        950400,
      );
      expect(detailsSection?.textContent?.includes('Every day')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty string period amount', () => {
      const permissionWithEmptyAmount = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodAmount: '0x0',
        },
      } as const;
      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithEmptyAmount,
      });
      expect(detailsSection).toBeInTheDocument();
    });

    it('handles very large period amount', () => {
      const permissionWithLargeAmount = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodAmount: '0xffffffffffffffffffffffffffffffffffffffff',
        },
      } as const;
      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithLargeAmount,
      });
      expect(detailsSection).toBeInTheDocument();
    });

    it('handles zero period amount', () => {
      const permissionWithZeroAmount = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          periodAmount: '0x0',
        },
      } as const;
      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        permission: permissionWithZeroAmount,
      });
      expect(detailsSection).toBeInTheDocument();
    });

    it('handles null start time', () => {
      const permissionWithNullStartTime = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          startTime: null,
        },
      };

      expect(() =>
        renderWithConfirmContextProvider(
          <NativeTokenPeriodicDetails
            {...defaultProps}
            permission={permissionWithNullStartTime}
          />,
          getMockStore(),
        ),
      ).toThrow('Start time is required');
    });
  });

  describe('conditional rendering', () => {
    it('renders start time when present', () => {
      const detailsSection = renderAndGetDetailsSection(defaultProps);
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Start date')).toBe(true);
    });

    it('renders expiry when present', () => {
      const detailsSection = renderAndGetDetailsSection(defaultProps);
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(true);
    });

    it('does not render expiry when null', () => {
      const detailsSection = renderAndGetDetailsSection({
        ...defaultProps,
        expiry: null,
      });
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });
  });
});
