import { TransactionType } from '@metamask/transaction-controller';
import {
  HYPERLIQUID_DEPOSIT_BRIDGE_ADDRESS,
  HYPERLIQUID_DEPOSIT_CHAIN_ID,
  HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
  HYPERLIQUID_DEPOSIT_GAS_LIMIT,
  HYPERLIQUID_DEPOSIT_SIDE_PANEL_ROUTE_MESSAGE,
  HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
  createHyperliquidDepositTransactionParams,
  isHyperliquidDepositConfirmation,
  isHyperliquidDepositSidePanelRouteMessage,
  parseUsdcAmountToAtomicUnits,
} from './hyperliquid-deposit-transaction';

describe('parseUsdcAmountToAtomicUnits', () => {
  it('parses USDC amounts into 6-decimal atomic units', () => {
    expect(parseUsdcAmountToAtomicUnits('100')).toBe(100_000_000n);
    expect(parseUsdcAmountToAtomicUnits('100.123456')).toBe(100_123_456n);
  });

  it('rejects amounts below the Hyperliquid minimum', () => {
    expect(() => parseUsdcAmountToAtomicUnits('4.999999')).toThrow(
      'Hyperliquid deposits must be at least 5 USDC.',
    );
  });

  it('rejects invalid precision', () => {
    expect(() => parseUsdcAmountToAtomicUnits('100.1234567')).toThrow(
      'Enter a valid USDC amount with up to 6 decimals.',
    );
  });
});

describe('isHyperliquidDepositConfirmation', () => {
  it('returns true for marked perps deposit transactions', () => {
    expect(
      isHyperliquidDepositConfirmation({
        requestId: HYPERLIQUID_DEPOSIT_CONFIRMATION_REQUEST_ID,
        type: TransactionType.perpsDeposit,
      }),
    ).toBe(true);
  });

  it('returns false for normal perps deposit transactions', () => {
    expect(
      isHyperliquidDepositConfirmation({
        type: TransactionType.perpsDeposit,
      }),
    ).toBe(false);
  });
});

describe('isHyperliquidDepositSidePanelRouteMessage', () => {
  it('returns true for Hyperliquid side panel route messages', () => {
    expect(
      isHyperliquidDepositSidePanelRouteMessage({
        type: HYPERLIQUID_DEPOSIT_SIDE_PANEL_ROUTE_MESSAGE,
        payload: {
          triggerId: 'trigger-1',
          tabId: 123,
        },
      }),
    ).toBe(true);
  });

  it('returns false for malformed route messages', () => {
    expect(
      isHyperliquidDepositSidePanelRouteMessage({
        type: HYPERLIQUID_DEPOSIT_SIDE_PANEL_ROUTE_MESSAGE,
        payload: {},
      }),
    ).toBe(false);
  });
});

describe('createHyperliquidDepositTransactionParams', () => {
  it('creates an Arbitrum USDC transfer to the Hyperliquid bridge', () => {
    const transactionParams = createHyperliquidDepositTransactionParams({
      amount: '100',
      from: '0x1234567890123456789012345678901234567890',
    });

    expect(HYPERLIQUID_DEPOSIT_CHAIN_ID).toBe('0xa4b1');
    expect(transactionParams).toStrictEqual({
      from: '0x1234567890123456789012345678901234567890',
      to: HYPERLIQUID_DEPOSIT_USDC_ADDRESS,
      value: '0x0',
      gas: HYPERLIQUID_DEPOSIT_GAS_LIMIT,
      data:
        '0xa9059cbb' +
        `000000000000000000000000${HYPERLIQUID_DEPOSIT_BRIDGE_ADDRESS.slice(
          2,
        ).toLowerCase()}` +
        '0000000000000000000000000000000000000000000000000000000005f5e100',
    });
  });
});
