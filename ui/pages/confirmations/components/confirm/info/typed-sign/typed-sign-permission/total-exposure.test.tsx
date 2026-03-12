import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { computeTotalExposure, TotalExposure } from './total-exposure';

describe('TotalExposure', () => {
  const mockDecodedPermission = {
    expiry: 1234567890 + 86400,
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
    to: '0xCdD6132d1a6efA06bce1A89b0fEa6b08304A3829',
  } as const;

  const getMockStore = () => {
    const state = getMockTypedSignPermissionConfirmState(mockDecodedPermission);
    return configureMockStore([])(state);
  };

  const defaultErc20Props = {
    variant: 'erc20' as const,
    initialAmount: '0x1234' as const,
    maxAmount: '0x5678' as const,
    amountPerSecond: '0x9abc' as const,
    startTime: 1234567890,
    expiry: 1234567890 + 86400,
    tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
    chainId: '0x1' as const,
    decimals: 2,
  };

  const defaultNativeProps = {
    variant: 'native' as const,
    initialAmount: '0x1234' as const,
    maxAmount: '0x5678' as const,
    amountPerSecond: '0x9abc' as const,
    startTime: 1234567890,
    expiry: 1234567890 + 86400,
    symbol: 'ETH',
    decimals: 18,
    imageUrl: 'https://example.com/eth.png',
  };

  describe('computeTotalExposure', () => {
    it('returns min of maxAmount and exposure at expiry when both are set', () => {
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x64', // 100
        amountPerSecond: '0x1', // 1 per second
        startTime: 1000,
        expiry: 1050, // 50 seconds
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(50); // 0 + 50*1 = 50, min(100, 50) = 50
    });

    it('returns maxAmount when exposure at expiry exceeds it', () => {
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x32', // 50
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1100, // 100 seconds -> 100 exposure
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(50);
    });

    it('returns exposure at expiry when only expiry is set', () => {
      const result = computeTotalExposure({
        initialAmount: '0x64', // 100
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1020, // 20 seconds
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(120); // 100 + 20*1
    });

    it('returns maxAmount when only maxAmount is set', () => {
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x64',
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: null,
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(100);
    });

    it('returns null (unlimited) when neither maxAmount nor expiry is set', () => {
      const result = computeTotalExposure({
        initialAmount: '0x64',
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: null,
      });
      expect(result).toBeNull();
    });

    it('returns initial amount only when elapsed seconds is zero or negative', () => {
      const result = computeTotalExposure({
        initialAmount: '0x64', // 100
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1000, // 0 seconds elapsed
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(100);
    });

    it('handles decimal string amounts', () => {
      const result = computeTotalExposure({
        initialAmount: '0',
        maxAmount: '100',
        amountPerSecond: '1',
        startTime: 0,
        expiry: 10,
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(10);
    });

    it('parses hex amounts correctly', () => {
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x100',
        amountPerSecond: '0x2',
        startTime: 0,
        expiry: 10,
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(20); // 0 + 10*2
    });

    it('returns null (unlimited) when maxAmount is max uint256', () => {
      const maxUint256 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: maxUint256,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 2000,
      });
      expect(result).toBeNull();
    });

    it('treats undefined initialAmount as zero for exposure at expiry', () => {
      const result = computeTotalExposure({
        initialAmount: undefined,
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 0,
        expiry: 10, // 10 seconds
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(10); // 0 + 10*1
    });

    it('returns initial only when elapsed is negative (expiry before startTime)', () => {
      const result = computeTotalExposure({
        initialAmount: '0x64', // 100
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 500, // 500 seconds before start
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(100); // streamed = 0 when elapsed <= 0
    });
  });

  describe('TotalExposure component (ERC20 variant)', () => {
    it('renders total exposure label', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultErc20Props} />,
        getMockStore(),
      );
      expect(getByText('Total exposure')).toBeInTheDocument();
    });

    it('renders unlimited when totalExposure is null (no max nor expiry)', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure
          {...defaultErc20Props}
          maxAmount={undefined}
          expiry={null}
        />,
        getMockStore(),
      );
      expect(getByText('Unlimited')).toBeInTheDocument();
    });

    it('renders unlimited when maxAmount is max uint256', () => {
      const maxUint256 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure
          {...defaultErc20Props}
          maxAmount={maxUint256}
          expiry={1234567890 + 86400}
        />,
        getMockStore(),
      );
      expect(getByText('Unlimited')).toBeInTheDocument();
    });

    it('renders token amount row when totalExposure is computed', () => {
      const { container } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultErc20Props} />,
        getMockStore(),
      );
      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Total exposure');
      expect(container.textContent).not.toContain('Unlimited');
    });
  });

  describe('TotalExposure component (native variant)', () => {
    it('renders total exposure label', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultNativeProps} />,
        getMockStore(),
      );
      expect(getByText('Total exposure')).toBeInTheDocument();
    });

    it('renders symbol when totalExposure is computed', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultNativeProps} />,
        getMockStore(),
      );
      expect(getByText('ETH')).toBeInTheDocument();
      expect(getByText('Total exposure')).toBeInTheDocument();
    });

    it('renders unlimited with symbol when totalExposure is null', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure
          {...defaultNativeProps}
          maxAmount={undefined}
          expiry={null}
        />,
        getMockStore(),
      );
      expect(getByText('Unlimited')).toBeInTheDocument();
      expect(getByText('ETH')).toBeInTheDocument();
    });

    it('renders without imageUrl when not provided', () => {
      const { container } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultNativeProps} imageUrl={undefined} />,
        getMockStore(),
      );
      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain('Total exposure');
    });
  });
});
