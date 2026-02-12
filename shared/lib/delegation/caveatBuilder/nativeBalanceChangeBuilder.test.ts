import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { nativeBalanceChangeBuilder } from './nativeBalanceChangeBuilder';

const RECIPIENT_MOCK = '0x0987654321098765432109876543210987654321' as Hex;
const AMOUNT_MOCK = BigInt(1000);
const ENFORCER_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;

const ENVIRONMENT_MOCK = {
  caveatEnforcers: {
    NativeBalanceChangeEnforcer: ENFORCER_MOCK,
  },
} as unknown as DeleGatorEnvironment;

describe('nativeBalanceChangeBuilder', () => {
  it('creates caveat if decrease', () => {
    const caveat = nativeBalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      true,
      RECIPIENT_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x01098765432109876543210987654321098765432100000000000000000000000000000000000000000000000000000000000003e8"`,
    );
  });

  it('creates caveat if increase', () => {
    const caveat = nativeBalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      false,
      RECIPIENT_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x00098765432109876543210987654321098765432100000000000000000000000000000000000000000000000000000000000003e8"`,
    );
  });

  it('throws if enforceDecrease is not boolean', () => {
    expect(() =>
      nativeBalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        123 as never,
        RECIPIENT_MOCK,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid enforceDecrease: must be a boolean');
  });

  it('throws if recipient not address', () => {
    expect(() =>
      nativeBalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        '0x123' as Hex,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid recipient: must be a valid address');
  });

  it('throws if amount is negative', () => {
    expect(() =>
      nativeBalanceChangeBuilder(ENVIRONMENT_MOCK, true, RECIPIENT_MOCK, -1n),
    ).toThrow('Invalid amount: must be a non-negative number');
  });

  it('throws if amount is not number', () => {
    expect(() =>
      nativeBalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        RECIPIENT_MOCK,
        'test' as never,
      ),
    ).toThrow('Invalid amount: must be a non-negative number');
  });
});
