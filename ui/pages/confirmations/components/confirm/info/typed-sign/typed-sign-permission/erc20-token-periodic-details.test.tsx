import { Erc20TokenPeriodicPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import * as tokenUtils from '../../../../../utils/token';
import { Erc20TokenPeriodicDetails } from './erc20-token-periodic-details';
import { formatPeriodDuration } from './typed-sign-permission-util';

jest.mock('../../../../../utils/token', () => ({
  ...jest.requireActual('../../../../../utils/token'),
  fetchErc20Decimals: jest.fn().mockResolvedValue(2),
}));

// Mock the formatPeriodDuration utility function
jest.mock('./typed-sign-permission-util', () => ({
  formatPeriodDuration: jest.fn().mockReturnValue('Every day'),
}));

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
    props: Parameters<typeof Erc20TokenPeriodicDetails>[0],
  ) => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <Erc20TokenPeriodicDetails {...props} />,
      getMockStore(),
    );

    const detailsSection = getByTestId('erc20-token-periodic-details-section');

    return detailsSection;
  };

  const renderWithDecimalsAndGetDetailsSection = async (
    props: Parameters<typeof Erc20TokenPeriodicDetails>[0],
  ) => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <Erc20TokenPeriodicDetails {...props} />,
      getMockStore(),
    );

    await waitFor(() => {
      expect(
        (tokenUtils as jest.Mocked<typeof tokenUtils>).fetchErc20Decimals,
      ).toHaveBeenCalled();
    });

    const detailsSection = getByTestId('erc20-token-periodic-details-section');

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

    it('displays the allowance once token decimals are resolved', async () => {
      const detailsSection =
        await renderWithDecimalsAndGetDetailsSection(defaultProps);

      expect(detailsSection).toBeInTheDocument();

      expect(
        detailsSection?.textContent?.includes('46.6'), // 0x1234 / 10^2
      ).toBe(true);
    });

    it('formats the allowance based on the resolved token decimals', async () => {
      (
        tokenUtils as jest.Mocked<typeof tokenUtils>
      ).fetchErc20Decimals.mockResolvedValue(3);

      const detailsSection =
        await renderWithDecimalsAndGetDetailsSection(defaultProps);

      expect(detailsSection).toBeInTheDocument();

      expect(
        detailsSection?.textContent?.includes('4.66'), // 0x1234 / 10^3
      ).toBe(true);
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
});
