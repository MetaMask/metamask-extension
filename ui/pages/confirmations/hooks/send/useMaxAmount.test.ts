import { InternalAccount } from '@metamask/keyring-internal-api';
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
import * as MultichainSnaps from '../../utils/multichain-snaps';
import { useMaxAmount } from './useMaxAmount';
import { useBalance } from './useBalance';

jest.mock('./useBalance');

const MOCK_ADDRESS_1 = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const TRON_ASSET = {
  assetId: 'tron:728126428/slip44:195',
  chainId: 'tron:728126428',
  decimals: 6,
  name: 'Tron',
  symbol: 'TRX',
  isNative: true,
};

const MOCK_TRON_ACCOUNT = {
  id: 'tron-account-id',
  address: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
  metadata: { snap: { id: 'npm:@metamask/tron-wallet-snap', enabled: true } },
} as unknown as InternalAccount;

function renderHook() {
  const { result } = renderHookWithProvider(
    useMaxAmount,
    mockState as unknown as MetaMaskReduxState,
  );
  return result.current;
}

const useBalanceMock = jest.mocked(useBalance);

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

describe('useMaxAmount', () => {
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

  it('returns the full balance for solana assets', async () => {
    mockSendContext(SOLANA_ASSET);
    mockBalance('1007248', 6);

    expect(await renderHook().getMaxAmount()).toBe('1.007248');
  });

  it('returns the Snap maximum for Tron assets', async () => {
    const getMaxMock = jest
      .spyOn(MultichainSnaps, 'getMaxSendableAmountMultichain')
      .mockResolvedValue({ amount: '4.972392' });
    mockSendContext(TRON_ASSET, {
      chainId: TRON_ASSET.chainId,
      fromAccount: MOCK_TRON_ACCOUNT,
      toResolved: 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq',
    });
    mockBalance('6072392', 6);

    expect(await renderHook().getMaxAmount()).toBe('4.972392');
    expect(getMaxMock).toHaveBeenCalledWith(MOCK_TRON_ACCOUNT, {
      accountId: MOCK_TRON_ACCOUNT.id,
      assetId: TRON_ASSET.assetId,
      toAddress: 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq',
    });
  });

  it('falls back to the full balance when the Tron Snap cannot quote a maximum', async () => {
    jest
      .spyOn(MultichainSnaps, 'getMaxSendableAmountMultichain')
      .mockRejectedValue(new Error('Method not found'));
    mockSendContext(TRON_ASSET, {
      chainId: TRON_ASSET.chainId,
      fromAccount: MOCK_TRON_ACCOUNT,
    });
    mockBalance('6072392', 6);

    expect(await renderHook().getMaxAmount()).toBe('6.072392');
  });
});
