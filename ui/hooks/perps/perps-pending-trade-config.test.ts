import type { OrderFormState } from '../../components/app/perps/order-entry/order-entry.types';
import {
  PERPS_PENDING_TRADE_CONFIG_TTL_MS,
  isPendingTradeConfigFresh,
  pendingDraftFromFormState,
} from './perps-pending-trade-config';

const formState = (
  overrides: Partial<OrderFormState> = {},
): OrderFormState => ({
  asset: 'BTC',
  direction: 'long',
  closePercent: 100,
  amount: '1,000',
  leverage: 10,
  balancePercent: 20,
  takeProfitPrice: '50000',
  stopLossPrice: '40000',
  limitPrice: '45000',
  type: 'limit',
  autoCloseEnabled: true,
  ...overrides,
});

describe('isPendingTradeConfigFresh', () => {
  it('returns true inside the restore window', () => {
    expect(
      isPendingTradeConfigFresh(
        1_000,
        1_000 + PERPS_PENDING_TRADE_CONFIG_TTL_MS,
      ),
    ).toBe(true);
  });

  it('returns false after the restore window', () => {
    expect(
      isPendingTradeConfigFresh(
        1_000,
        1_000 + PERPS_PENDING_TRADE_CONFIG_TTL_MS + 1,
      ),
    ).toBe(false);
  });

  it('returns false for a non-finite timestamp', () => {
    expect(isPendingTradeConfigFresh(Number.NaN)).toBe(false);
  });
});

describe('pendingDraftFromFormState', () => {
  it('strips grouping separators from amount and keeps TP/SL when auto-close is on', () => {
    expect(pendingDraftFromFormState(formState())).toStrictEqual({
      amount: '1000',
      leverage: 10,
      takeProfitPrice: '50000',
      stopLossPrice: '40000',
      limitPrice: '45000',
      orderType: 'limit',
      direction: 'long',
    });
  });

  it('omits TP/SL when auto-close is off', () => {
    expect(
      pendingDraftFromFormState(
        formState({ autoCloseEnabled: false, type: 'market', limitPrice: '' }),
      ),
    ).toStrictEqual({
      amount: '1000',
      leverage: 10,
      takeProfitPrice: undefined,
      stopLossPrice: undefined,
      limitPrice: undefined,
      orderType: 'market',
      direction: 'long',
    });
  });

  it('omits a zero amount', () => {
    expect(
      pendingDraftFromFormState(formState({ amount: '0', type: 'market' }))
        .amount,
    ).toBeUndefined();
  });
});
