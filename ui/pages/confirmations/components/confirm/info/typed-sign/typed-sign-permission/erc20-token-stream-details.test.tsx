import { Erc20TokenStreamPermission } from '@metamask/gator-permissions-controller';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import * as tokenUtils from '../../../../../utils/token';
import { Erc20TokenStreamDetails } from './erc20-token-stream-details';

jest.mock('../../../../../utils/token', () => ({
  ...jest.requireActual('../../../../../utils/token'),
  fetchErc20Decimals: jest.fn().mockResolvedValue(2),
}));

describe('Erc20TokenStreamDetails', () => {
  const mockDecodedPermission = {
    expiry: 1234567890 + 86400, // 1 day later
    origin: 'https://metamask.github.io',
    permission: {
      type: 'erc20-token-stream',
      isAdjustmentAllowed: false,
      data: {
        tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
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
    mockDecodedPermission.permission as Erc20TokenStreamPermission;

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
        <Erc20TokenStreamDetails {...defaultProps} />,
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
        <Erc20TokenStreamDetails
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
        <Erc20TokenStreamDetails
          {...defaultProps}
          permission={permissionWithoutMax}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('renders without expiry', () => {
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenStreamDetails {...defaultProps} expiry={null} />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });

    it('displays the allowance once token decimals are resolved', async () => {
      const { container, getByTestId } = renderWithConfirmContextProvider(
        <Erc20TokenStreamDetails {...defaultProps} />,
        getMockStore(),
      );

      await waitFor(() =>
        expect(
          (tokenUtils as jest.Mocked<typeof tokenUtils>).fetchErc20Decimals,
        ).toHaveBeenCalled(),
      );

      expect(container).toMatchSnapshot();

      const detailsSection = getByTestId('erc20-token-stream-details-section');

      expect(detailsSection).toBeInTheDocument();

      expect(
        detailsSection?.textContent?.includes('46.6'), // 0x1234 / 10^2
      ).toBe(true);
    });

    it('formats the allowance based on the resolved token decimals', async () => {
      (
        tokenUtils as jest.Mocked<typeof tokenUtils>
      ).fetchErc20Decimals.mockResolvedValue(3);

      const { container, getByTestId } = renderWithConfirmContextProvider(
        <Erc20TokenStreamDetails {...defaultProps} />,
        getMockStore(),
      );

      await waitFor(() =>
        expect(
          (tokenUtils as jest.Mocked<typeof tokenUtils>).fetchErc20Decimals,
        ).toHaveBeenCalled(),
      );

      expect(container).toMatchSnapshot();

      const detailsSection = getByTestId('erc20-token-stream-details-section');

      expect(detailsSection).toBeInTheDocument();

      expect(
        detailsSection?.textContent?.includes('4.66'), // 0x1234 / 10^3
      ).toBe(true);
    });

    it('displays correct test IDs', () => {
      const { getByTestId } = renderWithConfirmContextProvider(
        <Erc20TokenStreamDetails {...defaultProps} />,
        getMockStore(),
      );

      expect(
        getByTestId('erc20-token-stream-details-section'),
      ).toBeInTheDocument();
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
          <Erc20TokenStreamDetails
            {...defaultProps}
            permission={permissionWithoutStartTime}
          />,
          getMockStore(),
        ),
      ).toThrow('Start time is required');
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
      } as Erc20TokenStreamPermission;
      const { container } = renderWithConfirmContextProvider(
        <Erc20TokenStreamDetails
          {...defaultProps}
          permission={permissionWithLargeAmounts}
        />,
        getMockStore(),
      );
      expect(container).toMatchSnapshot();
    });
  });
});
