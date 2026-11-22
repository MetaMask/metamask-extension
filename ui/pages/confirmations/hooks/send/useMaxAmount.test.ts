import type { MetaMaskReduxState } from '../../../../store/store';

import { Numeric } from '../../../../../shared/lib/Numeric';
import {
  EVM_ASSET,
  EVM_NATIVE_ASSET,
  SOLANA_ASSET,
} from '../../../../../test/data/send/assets';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as SendContext from '../../context/send';
import { useMaxAmount } from './useMaxAmount';
import { useBalance } from './useBalance';

jest.mock('./useBalance');

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

function renderHook() {
  const { result } = renderHookWithProvider(
    useMaxAmount,
    mockState as unknown as MetaMaskReduxState,
  );
  return result.current;
}

const useBalanceMock = jest.mocked(useBalance);

function mockSendContext(asset: unknown) {
  jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
    asset,
    chainId: '0x5',
    from: MOCK_ADDRESS_1,
  } as unknown as SendContext.SendContextType);
}

function mockBalance(rawBalance: string, decimals: number) {
  useBalanceMock.mockReturnValue({
    balance: '10.00',
    decimals,
    rawBalanceNumeric: new Numeric(rawBalance, 10),
  });
}

describe('useMaxAmount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the full balance for native assets', () => {
    mockSendContext(EVM_NATIVE_ASSET);
    mockBalance('1000000000000000000000', 18);

    expect(renderHook().getMaxAmount()).toBe('1000');
  });

  it('returns 0 for an empty native balance', () => {
    mockSendContext(EVM_NATIVE_ASSET);
    mockBalance('0', 18);

    expect(renderHook().getMaxAmount()).toBe('0');
  });

  it('returns 0 without an asset', () => {
    mockSendContext(undefined);
    mockBalance('1000000000000000000000', 18);

    expect(renderHook().getMaxAmount()).toBe('0');
  });

  it('returns the full balance for ERC20 assets', () => {
    mockSendContext({ ...EVM_ASSET, decimals: 16 });
    mockBalance('485730000000000000000', 16);

    expect(renderHook().getMaxAmount()).toBe('48573');
  });

  it('returns the full balance for solana assets', () => {
    mockSendContext(SOLANA_ASSET);
    mockBalance('1007248', 6);

    expect(renderHook().getMaxAmount()).toBe('1.007248');
  });
});
