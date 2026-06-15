import {
  TransactionType,
  TransactionStatus as KeyringTransactionStatus,
} from '@metamask/keyring-api';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import {
  useMultichainTransactionDisplay,
  KEYRING_TRANSACTION_STATUS_KEY,
} from './useMultichainTransactionDisplay';

const SOLANA_CHAIN = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOL_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501' as const;
const USDC_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as const;

function makeAsset(
  assetId: string,
  amount: string,
  unit: string = 'SOL',
  fungible: true = true,
) {
  return {
    type: assetId as `${string}:${string}/${string}:${string}`,
    amount,
    unit,
    fungible,
  };
}

const baseMovement = (assetId: string, amount: string, unit = 'SOL') => ({
  asset: makeAsset(assetId, amount, unit),
  address: 'SomeAddress',
});

function baseTransaction(overrides = {}) {
  return {
    id: 'tx-1',
    chain: SOLANA_CHAIN,
    account: 'account-1',
    type: TransactionType.Send,
    status: KeyringTransactionStatus.Confirmed,
    timestamp: 1_700_000_000,
    from: [baseMovement(SOL_ASSET_ID, '1.5')],
    to: [baseMovement(SOL_ASSET_ID, '1.5')],
    fees: [],
    ...overrides,
  };
}

const mockState = {
  metamask: {
    currentLocale: 'en',
    assetsMetadata: {},
  },
  localeMessages: {
    currentLocale: 'en',
    current: {},
    en: {},
  },
};

describe('KEYRING_TRANSACTION_STATUS_KEY', () => {
  it('maps all KeyringTransactionStatus values', () => {
    expect(
      KEYRING_TRANSACTION_STATUS_KEY[KeyringTransactionStatus.Failed],
    ).toBeDefined();
    expect(
      KEYRING_TRANSACTION_STATUS_KEY[KeyringTransactionStatus.Confirmed],
    ).toBeDefined();
    expect(
      KEYRING_TRANSACTION_STATUS_KEY[KeyringTransactionStatus.Unconfirmed],
    ).toBeDefined();
    expect(
      KEYRING_TRANSACTION_STATUS_KEY[KeyringTransactionStatus.Submitted],
    ).toBeDefined();
  });
});

describe('useMultichainTransactionDisplay', () => {
  it('returns title "sent" and negative from amount for Send type', () => {
    const tx = baseTransaction();
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.title).toBe('Sent');
    expect(result.current.from?.amount).toMatch(/^-/u);
  });

  it('returns positive to amount for non-Send type (Receive)', () => {
    const tx = baseTransaction({ type: TransactionType.Receive });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.title).toBe('Received');
    // to is NOT negative for non-Send
    expect(result.current.to?.amount).not.toMatch(/^-/u);
  });

  it('isRedeposit is true when to is empty and type is Send', () => {
    const tx = baseTransaction({ to: [] });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.isRedeposit).toBe(true);
  });

  it('isRedeposit is false when to has items and type is Send', () => {
    const tx = baseTransaction();
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.isRedeposit).toBe(false);
  });

  it('isRedeposit is false when to is empty but type is not Send', () => {
    const tx = baseTransaction({ type: TransactionType.Receive, to: [] });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.isRedeposit).toBe(false);
  });

  it('uses assetsMetadata symbol when asset unit is empty', () => {
    const stateWithMetadata = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        assetsMetadata: {
          [USDC_ASSET_ID]: {
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            fungible: true,
            iconUrl: '',
          },
        },
      },
    };
    const tx = baseTransaction({
      from: [{ asset: makeAsset(USDC_ASSET_ID, '10', ''), address: 'Addr1' }],
      to: [{ asset: makeAsset(USDC_ASSET_ID, '10', ''), address: 'Addr2' }],
    });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      stateWithMetadata,
    );
    expect(result.current.from?.unit).toBe('USDC');
  });

  it('falls back to empty string when unit and metadata symbol are both missing', () => {
    const tx = baseTransaction({
      from: [{ asset: makeAsset(SOL_ASSET_ID, '1', ''), address: 'Addr1' }],
      to: [{ asset: makeAsset(SOL_ASSET_ID, '1', ''), address: 'Addr2' }],
    });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.from?.unit).toBe('');
  });

  it('skips non-fungible assets in aggregation', () => {
    const tx = baseTransaction({
      from: [
        {
          asset: { ...makeAsset(SOL_ASSET_ID, '2'), fungible: false as never },
          address: 'Addr',
        },
      ],
      to: [],
    });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.from).toBeUndefined();
  });

  it('aggregates multiple movements of the same asset', () => {
    const tx = baseTransaction({
      from: [
        baseMovement(SOL_ASSET_ID, '1.0'),
        baseMovement(SOL_ASSET_ID, '0.5'),
      ],
    });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    // Combined 1.0 + 0.5 = 1.5, displayed as negative
    expect(result.current.from?.amount).toContain('1.5');
  });

  it('includes base and priority fees when present', () => {
    const tx = baseTransaction({
      fees: [
        {
          type: 'base',
          asset: makeAsset(SOL_ASSET_ID, '0.000005'),
          address: '',
        },
        {
          type: 'priority',
          asset: makeAsset(SOL_ASSET_ID, '0.000001'),
          address: '',
        },
      ],
    });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.baseFee).toBeDefined();
    expect(result.current.priorityFee).toBeDefined();
  });

  it('returns Swap title combining from and to units', () => {
    const tx = baseTransaction({
      type: TransactionType.Swap,
      from: [baseMovement(SOL_ASSET_ID, '1', 'SOL')],
      to: [{ asset: makeAsset(USDC_ASSET_ID, '100', 'USDC'), address: 'Addr' }],
    });
    const { result } = renderHookWithProvider(
      () => useMultichainTransactionDisplay(tx as never),
      mockState,
    );
    expect(result.current.title).toContain('SOL');
    expect(result.current.title).toContain('USDC');
  });
});
