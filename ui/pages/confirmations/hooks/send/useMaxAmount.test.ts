import type { MetaMaskReduxState } from '../../../../store/store';

import { Numeric } from '../../../../../shared/lib/Numeric';
import {
  BITCOIN_ASSET,
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_NATIVE_ASSET,
} from '../../../../../test/data/send/assets';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as SendContext from '../../context/send';
import { useMaxAmount } from './useMaxAmount';
import { useBalance } from './useBalance';
import { useNonEvmMaxAmount } from './useNonEvmMaxAmount';

jest.mock('./useBalance');

jest.mock('./useNonEvmMaxAmount', () => ({
  useNonEvmMaxAmount: jest.fn(),
}));

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

function renderHook() {
  const { result } = renderHookWithProvider(
    useMaxAmount,
    mockState as unknown as MetaMaskReduxState,
  );
  return result.current;
}

const useBalanceMock = jest.mocked(useBalance);
const mockUseNonEvmMaxAmount = jest.mocked(useNonEvmMaxAmount);
const mockGetNonEvmMaxAmount = jest.fn();

function mockSendContext(
  asset: unknown,
  overrides: Partial<SendContext.SendContextType> = {},
) {
  jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
    asset,
    chainId: '0x5',
    from: MOCK_ADDRESS_1,
    ...overrides,
  } as unknown as SendContext.SendContextType);
}

function mockBalance(rawBalance: string, decimals: number) {
  useBalanceMock.mockReturnValue({
    balance: '10.00',
    decimals,
    rawBalanceNumeric: new Numeric(rawBalance, 10),
  });
}

function mockNonEvmMaxAmount(isSupported: boolean) {
  mockUseNonEvmMaxAmount.mockReturnValue({
    getNonEvmMaxAmount: mockGetNonEvmMaxAmount,
    isNonEvmMaxSupported: isSupported,
  });
}

describe('useMaxAmount', () => {
  beforeEach(() => {
    mockNonEvmMaxAmount(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('returns the full balance for native assets', async () => {
    mockSendContext(EVM_NATIVE_ASSET);
    mockBalance('1000000000000000000000', 18);

    expect(await renderHook().getMaxAmount()).toBe('1000');
  });

  it('returns 0 for an empty native balance', async () => {
    mockSendContext(EVM_NATIVE_ASSET);
    mockBalance('0', 18);

    expect(await renderHook().getMaxAmount()).toBe('0');
  });

  it('returns 0 without an asset', async () => {
    mockSendContext(undefined);
    mockBalance('1000000000000000000000', 18);

    expect(await renderHook().getMaxAmount()).toBe('0');
  });

  it('returns the full balance for ERC20 assets', async () => {
    mockSendContext({ ...EVM_ASSET, decimals: 16 });
    mockBalance('485730000000000000000', 16);

    expect(await renderHook().getMaxAmount()).toBe('48573');
  });

  it('reports Max as supported for EVM assets', () => {
    mockSendContext(EVM_NATIVE_ASSET);
    mockBalance('1000000000000000000000', 18);

    expect(renderHook().isMaxAmountSupported).toBe(true);
  });

  it('returns the non-EVM quote when the chain supports it', async () => {
    mockNonEvmMaxAmount(true);
    mockGetNonEvmMaxAmount.mockResolvedValue('0.999');
    mockSendContext(SOLANA_NATIVE_ASSET, {
      chainId: SOLANA_NATIVE_ASSET.chainId,
    });
    mockBalance('1000000000', 9);

    expect(await renderHook().getMaxAmount()).toBe('0.999');
    expect(mockGetNonEvmMaxAmount).toHaveBeenCalled();
  });

  it('falls back to the full balance when the non-EVM chain cannot quote', async () => {
    mockNonEvmMaxAmount(true);
    mockGetNonEvmMaxAmount.mockResolvedValue(undefined);
    mockSendContext(SOLANA_NATIVE_ASSET, {
      chainId: SOLANA_NATIVE_ASSET.chainId,
    });
    mockBalance('1000000000000000000', 18);

    expect(await renderHook().getMaxAmount()).toBe('1');
  });

  it('reports Max as unsupported for a non-EVM chain without a quote', () => {
    mockNonEvmMaxAmount(false);
    mockSendContext(SOLANA_NATIVE_ASSET, {
      chainId: SOLANA_NATIVE_ASSET.chainId,
    });
    mockBalance('1000000000', 9);

    expect(renderHook().isMaxAmountSupported).toBe(false);
  });

  it('reports Max as unsupported for Bitcoin assets', () => {
    mockNonEvmMaxAmount(false);
    mockSendContext(BITCOIN_ASSET, {
      chainId: BITCOIN_ASSET.chainId,
    });
    mockBalance('100000000', 8);

    expect(renderHook().isMaxAmountSupported).toBe(false);
  });

  it('returns the full Bitcoin balance when no Snap quote is routed', async () => {
    mockNonEvmMaxAmount(false);
    mockSendContext(BITCOIN_ASSET, {
      chainId: BITCOIN_ASSET.chainId,
    });
    mockBalance('100000000', 8);

    expect(await renderHook().getMaxAmount()).toBe('1');
    expect(mockGetNonEvmMaxAmount).not.toHaveBeenCalled();
  });
});
