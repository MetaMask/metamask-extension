import { errorCodes } from '@metamask/rpc-errors';
import { validateWalletPayRequest } from './validate-request';

const FROM = '0x1234567890abcdef1234567890abcdef12345678';
const CHECKSUM_FROM = '0x1234567890AbcdEF1234567890aBcdef12345678';

function expectInvalidParams(params: unknown, field: string) {
  let error: { code?: number; message?: string } | undefined;

  try {
    validateWalletPayRequest(params);
  } catch (caught) {
    error = caught as typeof error;
  }

  expect(error?.code).toBe(errorCodes.rpc.invalidParams);
  expect(error?.message).toContain(field);
}

describe('validateWalletPayRequest', () => {
  it('returns type, from and amount', () => {
    expect(
      validateWalletPayRequest([
        { type: 'perpsDeposit', from: FROM, amount: '10' },
      ]),
    ).toStrictEqual({ type: 'perpsDeposit', from: FROM, amount: '10' });
  });

  it('allows amount to be omitted', () => {
    expect(
      validateWalletPayRequest([{ type: 'perpsDeposit', from: FROM }]),
    ).toStrictEqual({ type: 'perpsDeposit', from: FROM });
  });

  it('accepts a checksummed from address', () => {
    expect(
      validateWalletPayRequest([{ type: 'perpsDeposit', from: CHECKSUM_FROM }])
        .from,
    ).toBe(CHECKSUM_FROM);
  });

  for (const amount of ['10', '0.5', '12.123456', '1000000']) {
    it(`accepts amount ${amount}`, () => {
      expect(
        validateWalletPayRequest([{ type: 'perpsDeposit', from: FROM, amount }])
          .amount,
      ).toBe(amount);
    });
  }

  for (const amount of ['-1', '0', '0.000', '1.1234567', 'abc', '1e3', '']) {
    it(`rejects amount "${amount}"`, () => {
      expectInvalidParams(
        [{ type: 'perpsDeposit', from: FROM, amount }],
        'amount',
      );
    });
  }

  it('rejects a numeric amount', () => {
    expectInvalidParams(
      [{ type: 'perpsDeposit', from: FROM, amount: 10 }],
      'amount',
    );
  });

  it('rejects an unknown field, naming it', () => {
    expectInvalidParams(
      [{ type: 'perpsDeposit', from: FROM, token: 'USDC' }],
      'token',
    );
  });

  it('rejects missing params', () => {
    expectInvalidParams(undefined, 'Expected an array');
  });

  it('rejects an empty array', () => {
    expectInvalidParams([], '0');
  });

  it('rejects more than one element', () => {
    expectInvalidParams(
      [
        { type: 'perpsDeposit', from: FROM },
        { type: 'perpsDeposit', from: FROM },
      ],
      '1',
    );
  });

  it('rejects a missing or empty type', () => {
    expectInvalidParams([{ from: FROM }], 'type');
    expectInvalidParams([{ type: '', from: FROM }], 'type');
  });

  it('rejects a missing or malformed from', () => {
    expectInvalidParams([{ type: 'perpsDeposit' }], 'from');
    expectInvalidParams([{ type: 'perpsDeposit', from: '0x123' }], 'from');
  });
});
