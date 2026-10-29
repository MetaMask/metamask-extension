import { act, renderHook } from '@testing-library/react';
import type { Hex } from '@metamask/utils';
import { getTokenStandardAndDetailsByChain } from '../../../../store/actions';
import { useAddToken } from '../tokens/useAddToken';
import { useImportPayToken } from './useImportPayToken';

jest.mock('../tokens/useAddToken');
jest.mock('../../../../store/actions', () => ({
  getTokenStandardAndDetailsByChain: jest.fn(),
}));

const TOKEN_ADDRESS_MOCK = '0x9999999999999999999999999999999999999999' as Hex;
const CHAIN_ID_MOCK = '0x3' as Hex;

describe('useImportPayToken', () => {
  const useAddTokenMock = jest.mocked(useAddToken);
  const getTokenStandardAndDetailsByChainMock = jest.mocked(
    getTokenStandardAndDetailsByChain,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    getTokenStandardAndDetailsByChainMock.mockResolvedValue({
      decimals: '6',
      symbol: 'USDC',
    } as never);
  });

  it('adds the token with metadata resolved from the details lookup', async () => {
    renderHook(() =>
      useImportPayToken({
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getTokenStandardAndDetailsByChainMock).toHaveBeenCalledWith(
      TOKEN_ADDRESS_MOCK,
      undefined,
      undefined,
      CHAIN_ID_MOCK,
    );
    expect(useAddTokenMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID_MOCK,
      decimals: 6,
      symbol: 'USDC',
      tokenAddress: TOKEN_ADDRESS_MOCK,
    });
  });

  it('falls back to a generic symbol when the lookup omits it', async () => {
    getTokenStandardAndDetailsByChainMock.mockResolvedValue({
      decimals: '18',
    } as never);

    renderHook(() =>
      useImportPayToken({
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(useAddTokenMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID_MOCK,
      decimals: 18,
      symbol: 'Token',
      tokenAddress: TOKEN_ADDRESS_MOCK,
    });
  });

  it('does not provide metadata when the decimals cannot be resolved', async () => {
    getTokenStandardAndDetailsByChainMock.mockResolvedValue({} as never);

    renderHook(() =>
      useImportPayToken({
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(useAddTokenMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID_MOCK,
      decimals: undefined,
      symbol: undefined,
      tokenAddress: TOKEN_ADDRESS_MOCK,
    });
  });

  it('does not resolve metadata when disabled', async () => {
    renderHook(() =>
      useImportPayToken({
        address: TOKEN_ADDRESS_MOCK,
        chainId: CHAIN_ID_MOCK,
        enabled: false,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(getTokenStandardAndDetailsByChainMock).not.toHaveBeenCalled();
    expect(useAddTokenMock).toHaveBeenLastCalledWith({
      chainId: CHAIN_ID_MOCK,
      decimals: undefined,
      symbol: undefined,
      tokenAddress: TOKEN_ADDRESS_MOCK,
    });
  });

  it('does not resolve metadata when the token is not specified', async () => {
    renderHook(() => useImportPayToken({}));

    await act(async () => {
      await Promise.resolve();
    });

    expect(getTokenStandardAndDetailsByChainMock).not.toHaveBeenCalled();
  });
});
