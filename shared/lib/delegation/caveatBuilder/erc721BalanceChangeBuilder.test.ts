import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { erc721BalanceChangeBuilder } from './erc721BalanceChangeBuilder';

const TOKEN_MOCK = '0x1234567890123456789012345678901234567890' as Hex;
const RECIPIENT_MOCK = '0x0987654321098765432109876543210987654321' as Hex;
const AMOUNT_MOCK = BigInt(1);
const ENFORCER_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;

const ENVIRONMENT_MOCK = {
  caveatEnforcers: {
    ERC721BalanceChangeEnforcer: ENFORCER_MOCK,
  },
} as unknown as DeleGatorEnvironment;

describe('erc721BalanceChangeBuilder', () => {
  it('creates caveat if decrease', () => {
    const caveat = erc721BalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      true,
      TOKEN_MOCK,
      RECIPIENT_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x01123456789012345678901234567890123456789009876543210987654321098765432109876543210000000000000000000000000000000000000000000000000000000000000001"`,
    );
  });

  it('creates caveat if increase', () => {
    const caveat = erc721BalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      false,
      TOKEN_MOCK,
      RECIPIENT_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x00123456789012345678901234567890123456789009876543210987654321098765432109876543210000000000000000000000000000000000000000000000000000000000000001"`,
    );
  });

  it('throws if enforceDecrease is not boolean', () => {
    expect(() =>
      erc721BalanceChangeBuilder(
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
      erc721BalanceChangeBuilder(
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
      erc721BalanceChangeBuilder(
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
      erc721BalanceChangeBuilder(
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
      erc721BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        'test' as never,
      ),
    ).toThrow('Invalid amount: must be a non-negative number');
  });
});
