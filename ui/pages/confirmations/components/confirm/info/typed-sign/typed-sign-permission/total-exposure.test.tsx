import React from 'react';
import configureMockStore from 'redux-mock-store';

import { getMockTypedSignPermissionConfirmState } from '../../../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { enLocale as messages } from '../../../../../../../../test/lib/i18n-helpers';
import { computeTotalExposure, TotalExposure } from './total-exposure';

describe('TotalExposure', () => {
  const duration = 86400;
  const mockDecodedPermission = {
    expiry: 1234567890 + duration,
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
    variant: 'erc20',
    initialAmount: '0x1234',
    maxAmount: '0x5678',
    amountPerSecond: '0x9abc',
    startTime: 1234567890,
    expiry: 1234567890 + duration,
    tokenAddress: '0xA0b86a33E6441b8c4C8C0E4A8e4A8e4A8e4A8e4A',
    chainId: '0x1',
    decimals: 2,
  } as const;

  const defaultNativeProps = {
    variant: 'native',
    initialAmount: '0x1234',
    maxAmount: '0x5678',
    amountPerSecond: '0x9abc',
    startTime: 1234567890,
    expiry: 1234567890 + duration,
    symbol: 'ETH',
    decimals: 18,
    imageUrl: 'https://example.com/eth.png',
  } as const;

  describe('computeTotalExposure', () => {
    it('returns maxAmount when less than accrued exposure', () => {
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x32', // 50
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1100, // 100 seconds -> 100 accrued exposure
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(0x32);
    });

    it('returns maxAmount when less than initialAmount + accrued exposure', () => {
      const result = computeTotalExposure({
        initialAmount: '0x32', // 50
        maxAmount: '0x64', // 100
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1100, // 100 seconds -> 100 accrued exposure
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(0x64);
    });

    it('returns initialAmount + accrued exposure when it is less than maxAmount', () => {
      const result = computeTotalExposure({
        initialAmount: '0x14', // 20
        maxAmount: '0x100', // 256
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1100, // 100 seconds -> 100 accrued exposure
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(0x14 + 100);
    });

    it('returns initialAmount + accrued exposure when no maxAmount is set', () => {
      const result = computeTotalExposure({
        initialAmount: '0x64', // 100
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1100, // 100 seconds -> 100 accrued exposure
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(0x64 + 100);
    });

    it('returns maxAmount when no expiry is set', () => {
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: '0x64', // 100
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: null,
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(0x64);
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

    it('returns initial amount only when elapsed seconds is zero', () => {
      const result = computeTotalExposure({
        initialAmount: '0x64', // 100
        maxAmount: undefined,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1000, // 0 seconds elapsed
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(0x64);
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
      expect(result?.toNumber()).toBe(0x2 * 10);
    });

    it('returns null (unlimited) only when maxAmount is max uint256 and expiry is null', () => {
      const maxUint256 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: maxUint256,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: null,
      });
      expect(result).toBeNull();
    });

    it('returns exposure at expiry (not null) when expiry is set even if maxAmount is max uint256', () => {
      const maxUint256 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: maxUint256,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: 1050, // 50 seconds
      });
      expect(result).not.toBeNull();
      expect(result?.toNumber()).toBe(50);
    });

    it('returns null (unlimited) when maxAmount is max uint256 in uppercase hex and expiry is null', () => {
      const maxUint256Upper =
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
      const result = computeTotalExposure({
        initialAmount: '0x0',
        maxAmount: maxUint256Upper,
        amountPerSecond: '0x1',
        startTime: 1000,
        expiry: null,
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
      expect(result?.toNumber()).toBe(10);
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
      expect(result?.toNumber()).toBe(0x64);
    });
  });

  describe('TotalExposure component (ERC20 variant)', () => {
    it('renders total exposure label', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultErc20Props} />,
        getMockStore(),
      );
      expect(
        getByText(messages.confirmFieldTotalExposure.message),
      ).toBeInTheDocument();
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
      expect(getByText(messages.unlimited.message)).toBeInTheDocument();
    });

    it('renders unlimited when maxAmount is max uint256 and expiry is null', () => {
      const maxUint256 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure
          {...defaultErc20Props}
          maxAmount={maxUint256}
          expiry={null}
        />,
        getMockStore(),
      );
      expect(getByText(messages.unlimited.message)).toBeInTheDocument();
    });

    it('renders token amount (not unlimited) when maxAmount is max uint256 but expiry is set', () => {
      const maxUint256 =
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      const { queryByText, container } = renderWithConfirmContextProvider(
        <TotalExposure
          {...defaultErc20Props}
          maxAmount={maxUint256}
          expiry={1234567890 + duration}
        />,
        getMockStore(),
      );
      expect(queryByText(messages.unlimited.message)).not.toBeInTheDocument();
      expect(container.textContent).toContain(
        messages.confirmFieldTotalExposure.message,
      );
    });

    it('renders token amount row when totalExposure is computed', () => {
      const { container } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultErc20Props} />,
        getMockStore(),
      );
      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain(
        messages.confirmFieldTotalExposure.message,
      );
      expect(container.textContent).not.toContain(messages.unlimited.message);
    });
  });

  describe('TotalExposure component (native variant)', () => {
    it('renders total exposure label', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultNativeProps} />,
        getMockStore(),
      );
      expect(
        getByText(messages.confirmFieldTotalExposure.message),
      ).toBeInTheDocument();
    });

    it('renders symbol when totalExposure is computed', () => {
      const { getByText } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultNativeProps} />,
        getMockStore(),
      );
      expect(getByText('ETH')).toBeInTheDocument();
      expect(
        getByText(messages.confirmFieldTotalExposure.message),
      ).toBeInTheDocument();
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
      expect(getByText(messages.unlimited.message)).toBeInTheDocument();
      expect(getByText('ETH')).toBeInTheDocument();
    });

    it('renders without imageUrl when not provided', () => {
      const { container } = renderWithConfirmContextProvider(
        <TotalExposure {...defaultNativeProps} imageUrl={undefined} />,
        getMockStore(),
      );
      expect(container).toBeInTheDocument();
      expect(container.textContent).toContain(
        messages.confirmFieldTotalExposure.message,
      );
    });
  });
});
