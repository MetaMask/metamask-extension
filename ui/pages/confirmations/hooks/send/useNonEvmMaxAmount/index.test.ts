import { renderHook } from '@testing-library/react';
import { InternalAccount } from '@metamask/keyring-internal-api';

import { Numeric } from '../../../../../../shared/lib/Numeric';
import { SOLANA_NATIVE_ASSET } from '../../../../../../test/data/send/assets';
import * as SendContext from '../../../context/send';
import { useBalance } from '../useBalance';
import { getTronMaxSendableAmount } from './getTronMaxSendableAmount';
import { useNonEvmMaxAmount } from '.';

jest.mock('../../../context/send', () => ({
  useSendContext: jest.fn(),
}));

jest.mock('../useBalance', () => ({
  useBalance: jest.fn(),
}));

jest.mock('./getTronMaxSendableAmount', () => ({
  getTronMaxSendableAmount: jest.fn(),
}));

const TRON_ACCOUNT = {
  id: 'tron-account-id',
  address: 'TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3',
} as unknown as InternalAccount;

const TRON_ASSET = {
  assetId: 'tron:728126428/slip44:195',
  chainId: 'tron:728126428',
  decimals: 6,
  isNative: true,
  symbol: 'TRX',
};

const BITCOIN_ASSET = {
  assetId: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
  chainId: 'bip122:000000000019d6689c085ae165831e93',
  decimals: 8,
  isNative: true,
  symbol: 'BTC',
};

const TO_ADDRESS = 'TK3xRFq22eEiATz6kfamDeAAQrPdfdGPeq';

const mockUseSendContext = jest.mocked(SendContext.useSendContext);
const mockUseBalance = jest.mocked(useBalance);
const mockGetTronMaxSendableAmount = jest.mocked(getTronMaxSendableAmount);

const setContext = (overrides: Partial<SendContext.SendContextType>) => {
  mockUseSendContext.mockReturnValue({
    asset: TRON_ASSET,
    fromAccount: TRON_ACCOUNT,
    ...overrides,
  } as unknown as SendContext.SendContextType);
};

const setBalance = (rawBalance: string) => {
  mockUseBalance.mockReturnValue({
    balance: '6.072392',
    decimals: 6,
    rawBalanceNumeric: new Numeric(rawBalance, 10),
  });
};

const renderNonEvmMaxAmount = () => renderHook(() => useNonEvmMaxAmount());

describe('useNonEvmMaxAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTronMaxSendableAmount.mockResolvedValue('4.972392');
  });

  it('routes a Tron asset to the Tron getter', async () => {
    setContext({ toResolved: TO_ADDRESS });
    setBalance('6072392');

    const { result } = renderNonEvmMaxAmount();

    expect(result.current.isNonEvmMaxSupported).toBe(true);
    await expect(result.current.getNonEvmMaxAmount()).resolves.toBe('4.972392');

    const request = mockGetTronMaxSendableAmount.mock.calls[0][0];
    expect(request.fromAccount).toBe(TRON_ACCOUNT);
    expect(request.assetId).toBe(TRON_ASSET.assetId);
    expect(request.toAddress).toBe(TO_ADDRESS);
    expect(request.balance.decimals).toBe(6);
    expect(request.balance.isNative).toBe(true);
    expect(request.balance.rawBalanceNumeric.toString()).toBe('6072392');
  });

  it('has no quote without a sender', async () => {
    setContext({ fromAccount: undefined });
    setBalance('6072392');

    const { result } = renderNonEvmMaxAmount();

    await expect(result.current.getNonEvmMaxAmount()).resolves.toBeUndefined();
    expect(mockGetTronMaxSendableAmount).not.toHaveBeenCalled();
  });

  it('has no quote without an asset id', async () => {
    setContext({ asset: { ...TRON_ASSET, assetId: undefined } });
    setBalance('6072392');

    const { result } = renderNonEvmMaxAmount();

    await expect(result.current.getNonEvmMaxAmount()).resolves.toBeUndefined();
    expect(mockGetTronMaxSendableAmount).not.toHaveBeenCalled();
  });

  it('has no quote for a network without a getter', async () => {
    setContext({
      asset: SOLANA_NATIVE_ASSET,
      chainId: SOLANA_NATIVE_ASSET.chainId,
    });
    setBalance('1000000000');

    const { result } = renderNonEvmMaxAmount();

    expect(result.current.isNonEvmMaxSupported).toBe(false);
    await expect(result.current.getNonEvmMaxAmount()).resolves.toBeUndefined();
    expect(mockGetTronMaxSendableAmount).not.toHaveBeenCalled();
  });

  // The Bitcoin Snap quotes a maximum, but Bitcoin is deliberately left out of
  // the registry so Max keeps hiding the fee behind the confirmation screen.
  it('has no quote for a Bitcoin asset', async () => {
    setContext({
      asset: BITCOIN_ASSET,
      chainId: BITCOIN_ASSET.chainId,
      toResolved: 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf',
    });
    setBalance('100000000');

    const { result } = renderNonEvmMaxAmount();

    expect(result.current.isNonEvmMaxSupported).toBe(false);
    await expect(result.current.getNonEvmMaxAmount()).resolves.toBeUndefined();
    expect(mockGetTronMaxSendableAmount).not.toHaveBeenCalled();
  });
});
