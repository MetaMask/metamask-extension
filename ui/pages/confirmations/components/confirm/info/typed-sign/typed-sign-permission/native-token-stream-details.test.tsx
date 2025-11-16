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

  const renderAndGetSections = (
    props: Parameters<typeof NativeTokenStreamDetails>[0],
  ) => {
    const { getByTestId } = renderWithConfirmContextProvider(
      <NativeTokenStreamDetails {...props} />,
      getMockStore(),
    );

    const detailsSection = getByTestId('native-token-stream-details-section');
    const streamRateSection = getByTestId(
      'native-token-stream-stream-rate-section',
    );

    return { detailsSection, streamRateSection };
  };

  describe('basic functionality', () => {
    it('renders with all required props', () => {
      const { detailsSection, streamRateSection } =
        renderAndGetSections(defaultProps);

      expect(detailsSection).toBeInTheDocument();
      expect(streamRateSection).toBeInTheDocument();
    });

    it('renders without initial amount', () => {
      const permissionWithoutInitial = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: undefined,
        },
      };
      const { detailsSection } = renderAndGetSections({
        ...defaultProps,
        permission: permissionWithoutInitial,
      });
      expect(detailsSection).toBeInTheDocument();
    });

    it('renders without max amount', () => {
      const permissionWithoutMax = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          maxAmount: undefined,
        },
      };
      const { detailsSection } = renderAndGetSections({
        ...defaultProps,
        permission: permissionWithoutMax,
      });
      expect(detailsSection).toBeInTheDocument();
    });

    it('renders without expiry', () => {
      const { detailsSection } = renderAndGetSections({
        ...defaultProps,
        expiry: null,
      });
      expect(detailsSection).toBeInTheDocument();
      expect(detailsSection?.textContent?.includes('Expiration')).toBe(false);
    });
  });

  describe('data display', () => {
    it('displays correct test IDs', () => {
      const { detailsSection, streamRateSection } =
        renderAndGetSections(defaultProps);

      expect(detailsSection).toBeInTheDocument();
      expect(streamRateSection).toBeInTheDocument();
    });

    it('renders with different amount values', () => {
      const permissionWithDifferentAmounts = {
        ...mockPermission,
        data: {
          ...mockPermission.data,
          initialAmount: '0x246DDF97976680000', // 42 Eth
          maxAmount: '0x3A4965BF58A40000', // 4.2 ETH
          amountPerSecond: '0x5D423C655AA0000', // 0.42 ETH per second
        },
      } as NativeTokenStreamPermission;

      const { detailsSection, streamRateSection } = renderAndGetSections({
        ...defaultProps,
        permission: permissionWithDifferentAmounts,
      });

      expect(detailsSection).toBeInTheDocument();
      expect(streamRateSection).toBeInTheDocument();
      // basic sanity checks for formatted amounts
      expect(detailsSection?.textContent?.includes('42')).toBe(true);
      expect(detailsSection?.textContent?.includes('4.2')).toBe(true);
      expect(streamRateSection?.textContent?.includes('0.42')).toBe(true);
    });
  });

  describe('amount calculations', () => {
    it('calculates daily amount correctly', () => {
      const { streamRateSection } = renderAndGetSections(defaultProps);

      expect(streamRateSection).toBeInTheDocument();
      // Verify the presence of the per-day row label content
      expect(
        streamRateSection?.textContent?.includes('Available per day'),
      ).toBe(true);
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
      const { detailsSection } = renderAndGetSections({
        ...defaultProps,
        permission: permissionWithLargeAmounts,
      });
      expect(detailsSection).toBeInTheDocument();
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
      const { detailsSection } = renderAndGetSections({
        ...defaultProps,
        permission: permissionWithZeroAmounts,
      });
      expect(detailsSection).toBeInTheDocument();
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
      const { detailsSection } = renderAndGetSections({
        ...defaultProps,
        permission: permissionWithNullAmounts,
      });
      expect(detailsSection).toBeInTheDocument();
    });
  });
});
