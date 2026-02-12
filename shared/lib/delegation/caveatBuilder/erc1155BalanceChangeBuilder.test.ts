import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { erc1155BalanceChangeBuilder } from './erc1155BalanceChangeBuilder';

const TOKEN_MOCK = '0x1234567890123456789012345678901234567890' as Hex;
const RECIPIENT_MOCK = '0x0987654321098765432109876543210987654321' as Hex;
const TOKEN_ID_MOCK = BigInt(1234567890);
const AMOUNT_MOCK = BigInt(123);
const ENFORCER_MOCK = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;

const ENVIRONMENT_MOCK = {
  caveatEnforcers: {
    ERC1155BalanceChangeEnforcer: ENFORCER_MOCK,
  },
} as unknown as DeleGatorEnvironment;

describe('erc1155BalanceChangeBuilder', () => {
  it('creates caveat if decrease', () => {
    const caveat = erc1155BalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      true,
      TOKEN_MOCK,
      RECIPIENT_MOCK,
      TOKEN_ID_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x011234567890123456789012345678901234567890098765432109876543210987654321098765432100000000000000000000000000000000000000000000000000000000499602d2000000000000000000000000000000000000000000000000000000000000007b"`,
    );
  });

  it('creates caveat if increase', () => {
    const caveat = erc1155BalanceChangeBuilder(
      ENVIRONMENT_MOCK,
      false,
      TOKEN_MOCK,
      RECIPIENT_MOCK,
      TOKEN_ID_MOCK,
      AMOUNT_MOCK,
    );

    expect(caveat.enforcer).toBe(ENFORCER_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toMatchInlineSnapshot(
      `"0x001234567890123456789012345678901234567890098765432109876543210987654321098765432100000000000000000000000000000000000000000000000000000000499602d2000000000000000000000000000000000000000000000000000000000000007b"`,
    );
  });

  it('throws if enforceDecrease is not boolean', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        123 as never,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        TOKEN_ID_MOCK,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid enforceDecrease: must be a boolean');
  });

  it('throws if token not address', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        '0x123' as Hex,
        RECIPIENT_MOCK,
        TOKEN_ID_MOCK,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid token: must be a valid address');
  });

  it('throws if recipient not address', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        '0x123' as Hex,
        TOKEN_ID_MOCK,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid recipient: must be a valid address');
  });

  it('throws if tokenId is negative', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        -1n,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid tokenId: must be a non-negative number');
  });

  it('throws if tokenId is not number', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        'test' as never,
        AMOUNT_MOCK,
      ),
    ).toThrow('Invalid tokenId: must be a non-negative number');
  });

  it('throws if amount is negative', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        TOKEN_ID_MOCK,
        -1n,
      ),
    ).toThrow('Invalid amount: must be a non-negative number');
  });

  it('throws if amount is not number', () => {
    expect(() =>
      erc1155BalanceChangeBuilder(
        ENVIRONMENT_MOCK,
        true,
        TOKEN_MOCK,
        RECIPIENT_MOCK,
        TOKEN_ID_MOCK,
        'test' as never,
      ),
    ).toThrow('Invalid amount: must be a non-negative number');
  });
});
