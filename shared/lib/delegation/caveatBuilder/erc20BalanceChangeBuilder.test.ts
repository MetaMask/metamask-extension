import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { erc20BalanceChangeBuilder } from './erc20BalanceChangeBuilder';

const TOKEN_MOCK = '0x1234567890123456789012345678901234567890' as Hex;
const RECIPIENT_MOCK = '0x0987654321098765432109876543210987654321' as Hex;
const AMOUNT_MOCK = BigInt(1000);
const ENFORCER_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;

const ENVIRONMENT_MOCK = {
  caveatEnforcers: {
    ERC20BalanceChangeEnforcer: ENFORCER_MOCK,
  },
} as unknown as DeleGatorEnvironment;

describe('erc20BalanceChangeBuilder', () => {
  it('creates caveat if decrease', () => {
    const caveat = erc20BalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      true,
      TOKEN_MOCK,
      RECIPIENT_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x011234567890123456789012345678901234567890098765432109876543210987654321098765432100000000000000000000000000000000000000000000000000000000000003e8"`,
    );
  });

  it('creates caveat if increase', () => {
    const caveat = erc20BalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      false,
      TOKEN_MOCK,
      RECIPIENT_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x001234567890123456789012345678901234567890098765432109876543210987654321098765432100000000000000000000000000000000000000000000000000000000000003e8"`,
    );
  });

  it('throws if enforceDecrease is not boolean', () => {
    expect(() =>
      erc20BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        123 as never,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid enforceDecrease: must be a boolean');
  });

  it('throws if token not address', () => {
    expect(() =>
      erc20BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        '0x123' as Hex,
        RECIPIENT_MOCK,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid token: must be a valid address');
  });

  it('throws if recipient not address', () => {
    expect(() =>
      erc20BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        '0x123' as Hex,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid recipient: must be a valid address');
  });

  it('throws if amount is negative', () => {
    expect(() =>
      erc20BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        -1n,
      ),
    ).toThrow('Invalid amount: must be a non-negative number');
  });

  it('throws if amount is not number', () => {
    expect(() =>
      erc20BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        'test' as never,
      ),
    ).toThrow('Invalid amount: must be a non-negative number');
  });
});
