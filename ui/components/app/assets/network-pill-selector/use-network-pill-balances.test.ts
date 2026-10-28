import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { useNetworkPillBalances } from './use-network-pill-balances';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

const ETHEREUM = {
  chainId: 'eip155:1',
  isEvm: true,
} as unknown as MultichainNetworkConfiguration;
const SOLANA = {
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  isEvm: false,
} as unknown as MultichainNetworkConfiguration;

describe('useNetworkPillBalances', () => {
  it('calculates each network and the total with the selected account group balance', () => {
    const getBalance = jest.fn((map: Record<string, unknown>) => ({
      totalBalanceInUserCurrency: Object.keys(map).length * 10,
      userCurrency: 'usd',
    }));
    jest.mocked(useSelector).mockReturnValue(getBalance);

    const { result } = renderHook(() =>
      useNetworkPillBalances([ETHEREUM, SOLANA]),
    );

    expect(getBalance).toHaveBeenCalledWith({ eip155: { '0x1': true } });
    expect(getBalance).toHaveBeenCalledWith({
      solana: { [SOLANA.chainId]: true },
    });
    expect(getBalance).toHaveBeenCalledWith({
      eip155: { '0x1': true },
      solana: { [SOLANA.chainId]: true },
    });
    expect(result.current).toStrictEqual({
      balanceByChainId: { 'eip155:1': 10, [SOLANA.chainId]: 10 },
      total: 20,
      currency: 'usd',
    });
  });

  it('returns zero balances when there is no selected account group', () => {
    jest.mocked(useSelector).mockReturnValue(() => null);

    const { result } = renderHook(() => useNetworkPillBalances([ETHEREUM]));

    expect(result.current).toStrictEqual({
      balanceByChainId: { 'eip155:1': 0 },
      total: 0,
      currency: undefined,
    });
  });
});
