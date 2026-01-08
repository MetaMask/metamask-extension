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

  const renderAndGetSections = async (
    props: Parameters<typeof Erc20TokenStreamDetails>[0],
  ) => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <Erc20TokenStreamDetails {...props} />,
      getMockStore(),
    );

    await waitFor(() =>
      expect(
        (tokenUtils as jest.Mocked<typeof tokenUtils>).fetchErc20Decimals,
      ).toHaveBeenCalled(),
    );

    const detailsSection = getByTestId('erc20-token-stream-details-section');
    const streamRateSection = getByTestId(
      'erc20-token-stream-stream-rate-section',
    );

    return { detailsSection, streamRateSection } as const;
  };

  describe('basic functionality', () => {
    it('renders with all required props', async () => {
      const { detailsSection, streamRateSection } =
        await renderAndGetSections(defaultProps);

      expect(detailsSection).toBeInTheDocument();
      expect(streamRateSection).toBeInTheDocument();
    });

    it('renders without initial amount', async () => {
      const permissionWithoutInitial = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: undefined,
        },
      };
      const { detailsSection } = await renderAndGetSections({
        ...defaultProps,
        permission: permissionWithoutInitial,
      });

      expect(detailsSection).toBeInTheDocument();
    });

    it('renders without max amount', async () => {
      const permissionWithoutMax = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          maxAmount: undefined,
        },
      };
      const { detailsSection } = await renderAndGetSections({
        ...defaultProps,
        permission: permissionWithoutMax,
      });

      expect(detailsSection).toBeInTheDocument();
    });

    it('renders without expiry', async () => {
      const { detailsSection } = await renderAndGetSections({
        ...defaultProps,
        expiry: null,
      });
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });

    it('displays the allowance once token decimals are resolved', async () => {
      const { detailsSection } = await renderAndGetSections(defaultProps);
      expect(detailsSection).toBeInTheDocument();

      expect(
        detailsSection?.textContent?.includes('46.6'), // 0x1234 / 10^2
      ).toBe(true);
    });

    it('formats the allowance based on the resolved token decimals', async () => {
      (
        tokenUtils as jest.Mocked<typeof tokenUtils>
      ).fetchErc20Decimals.mockResolvedValue(3);

      const { detailsSection } = await renderAndGetSections(defaultProps);

      expect(detailsSection).toBeInTheDocument();

      expect(
        detailsSection?.textContent?.includes('4.66'), // 0x1234 / 10^3
      ).toBe(true);
    });

    it('displays correct test IDs', async () => {
      const { detailsSection, streamRateSection } =
        await renderAndGetSections(defaultProps);
      expect(detailsSection).toBeInTheDocument();
      expect(streamRateSection).toBeInTheDocument();
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
    it('handles very large amounts', async () => {
      const permissionWithLargeAmounts = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: '0xffffffffffffffffffffffffffffffffffffffff',
          maxAmount: '0xffffffffffffffffffffffffffffffffffffffff',
          amountPerSecond: '0xffffffffffffffffffffffffffffffffffffffff',
        },
      } as Erc20TokenStreamPermission;
      const { detailsSection } = await renderAndGetSections({
        ...defaultProps,
        permission: permissionWithLargeAmounts,
      });
      expect(detailsSection).toBeInTheDocument();
    });
  });
});
