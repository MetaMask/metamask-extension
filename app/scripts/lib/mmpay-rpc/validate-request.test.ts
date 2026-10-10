import { errorCodes } from '@metamask/rpc-errors';
import { validateMmPayRpcRequest } from './validate-request';

const FROM = '0x1234567890123456789012345678901234567890';

function expectInvalidParams(params: unknown, field: string) {
  let error: { code?: number; message?: string } | undefined;

  try {
    validateMmPayRpcRequest(params);
  } catch (caught) {
    error = caught as typeof error;
  }

  expect(error?.code).toBe(errorCodes.rpc.invalidParams);
  expect(error?.message).toContain(`"${field}"`);
}

describe('validateMmPayRpcRequest', () => {
  it('returns type, from and payParams', () => {
    expect(
      validateMmPayRpcRequest([
        { type: 'perpsDeposit', from: FROM, payParams: { amount: '10' } },
      ]),
    ).toStrictEqual({
      type: 'perpsDeposit',
      from: FROM,
      payParams: { amount: '10' },
    });
  });

  it('allows payParams to be omitted', () => {
    expect(
      validateMmPayRpcRequest([{ type: 'perpsDeposit', from: FROM }]),
    ).toStrictEqual({ type: 'perpsDeposit', from: FROM, payParams: undefined });
  });

  it('does not validate payParams', () => {
    expect(
      validateMmPayRpcRequest([
        { type: 'perpsDeposit', from: FROM, payParams: 'anything' },
      ]).payParams,
    ).toBe('anything');
  });

  it('rejects missing params', () => {
    expectInvalidParams(undefined, 'params');
  });

  it('rejects params that are not an array', () => {
    expectInvalidParams({ type: 'perpsDeposit', from: FROM }, 'params');
  });

  it('rejects an empty array', () => {
    expectInvalidParams([], 'params');
  });

  it('rejects more than one element', () => {
    expectInvalidParams(
      [
        { type: 'perpsDeposit', from: FROM },
        { type: 'perpsDeposit', from: FROM },
      ],
      'params',
    );
  });

  it('rejects a non-object element', () => {
    expectInvalidParams(['perpsDeposit'], 'params[0]');
    expectInvalidParams([null], 'params[0]');
    expectInvalidParams([[]], 'params[0]');
  });

  it('rejects a missing type', () => {
    expectInvalidParams([{ from: FROM }], 'type');
  });

  it('rejects an empty type', () => {
    expectInvalidParams([{ type: '', from: FROM }], 'type');
  });

  it('rejects a non-string type', () => {
    expectInvalidParams([{ type: 1, from: FROM }], 'type');
  });

  it('rejects a missing from', () => {
    expectInvalidParams([{ type: 'perpsDeposit' }], 'from');
  });

  it('rejects a malformed from', () => {
    expectInvalidParams([{ type: 'perpsDeposit', from: '0x123' }], 'from');
    expectInvalidParams([{ type: 'perpsDeposit', from: 'abc' }], 'from');
  });

  it('checks type before from', () => {
    expectInvalidParams([{}], 'type');
  });
});
