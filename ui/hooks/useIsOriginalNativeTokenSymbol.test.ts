import { waitFor } from '@testing-library/react';
import { Hex } from '@metamask/utils';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers';
import * as SelectorsModule from '../selectors/selectors';
import * as MultichainSelectorsModule from '../selectors/multichain';
import * as IsOriginalNativeTokenSymbolModule from '../helpers/utils/isOriginalNativeTokenSymbol';
import { useIsOriginalNativeTokenSymbol } from './useIsOriginalNativeTokenSymbol'; // Adjust the import path accordingly

const arrangeMocks = () => {
  // Mock Selectors
  const mockGetMultichainIsEVM = jest
    .spyOn(MultichainSelectorsModule, 'getMultichainIsEvm')
    .mockReturnValue(true);

  const mockUseSafeChainsListValidationSelector = jest
    .spyOn(SelectorsModule, 'useSafeChainsListValidationSelector')
    .mockReturnValue(true);

  const createMockProviderConfig = () =>
    ({
      ticker: 'ETH',
    }) as MultichainSelectorsModule.MultichainNetwork['network'];
  const mockGetMultichainCurrentNetwork = jest
    .spyOn(MultichainSelectorsModule, 'getMultichainCurrentNetwork')
    .mockReturnValue(createMockProviderConfig());

  // Mock Fetch Call
  const mockIsOriginalNativeTokenSymbol = jest
    .spyOn(IsOriginalNativeTokenSymbolModule, 'isOriginalNativeTokenSymbol')
    .mockResolvedValue(true);

  return {
    mockGetMultichainIsEVM,
    mockUseSafeChainsListValidationSelector,
    createMockProviderConfig,
    mockGetMultichainCurrentNetwork,
    mockIsOriginalNativeTokenSymbol,
  };
};

const arrangeParams = () => ({
  chainId: '0x1' as Hex,
  ticker: 'ETH',
  type: 'mainnet',
  rpcUrl: '',
});

type Mocks = ReturnType<typeof arrangeMocks>;
type Params = ReturnType<typeof arrangeParams>;
const arrangeActHook = (overrides?: (mocks: Mocks, params: Params) => void) => {
  const mocks = arrangeMocks();
  const params = arrangeParams();
  overrides?.(mocks, params);

  const hook = renderHookWithProviderTyped(
    () =>
      useIsOriginalNativeTokenSymbol(
        params.chainId,
        params.ticker,
        params.type,
        params.rpcUrl,
      ),
    {},
  );

  return { hook, mocks };
};

describe('useIsOriginalNativeTokenSymbol', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the correct value when the native symbol matches the ticker', async () => {
    const { hook, mocks } = arrangeActHook();

    await waitFor(() => {
      expect(mocks.mockIsOriginalNativeTokenSymbol).toHaveBeenCalled();
      expect(hook.result.current).toBe(true);
    });
  });

  it('should return the correct value when the native symbol does not match the ticker', async () => {
    const { hook, mocks } = arrangeActHook((m, params) => {
      m.mockIsOriginalNativeTokenSymbol.mockResolvedValue(false);
      params.chainId = '0x13a';
      params.ticker = 'FIL';
    });

    await waitFor(() => {
      expect(mocks.mockIsOriginalNativeTokenSymbol).toHaveBeenCalled();
      expect(hook.result.current).toBe(false);
    });
  });

  it('should return false if fails to fetch chainlist and evaluate if is original native token', async () => {
    const { hook, mocks } = arrangeActHook((m) => {
      m.mockIsOriginalNativeTokenSymbol.mockRejectedValue(
        new Error('TEST ERROR'),
      );
    });

    await waitFor(() => {
      expect(mocks.mockIsOriginalNativeTokenSymbol).toHaveBeenCalled();
      expect(hook.result.current).toBe(false);
    });
  });

  it('should return true if non-evm symbol matches', async () => {
    const { hook, mocks } = arrangeActHook((m, params) => {
      m.mockGetMultichainIsEVM.mockReturnValue(false);
      m.mockGetMultichainCurrentNetwork.mockReturnValue({
        ...m.createMockProviderConfig(),
        ticker: 'SOL',
      });
      params.ticker = 'SOL';
    });

    await waitFor(() => {
      expect(mocks.mockIsOriginalNativeTokenSymbol).not.toHaveBeenCalled();
      expect(hook.result.current).toBe(true);
    });
  });

  it('should default to true for local dev networks', async () => {
    const { hook, mocks } = arrangeActHook((_mocks, params) => {
      params.rpcUrl = 'https://localhost:1337';
    });

    await waitFor(() => {
      expect(mocks.mockIsOriginalNativeTokenSymbol).not.toHaveBeenCalled();
      expect(hook.result.current).toBe(true);
    });
  });
});
