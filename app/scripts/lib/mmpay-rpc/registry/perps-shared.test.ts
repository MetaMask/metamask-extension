import { errorCodes } from '@metamask/rpc-errors';
import type { MmPayRpcMessenger } from '../types';
import {
  assertPerpsEligible,
  toUsdcAmountRaw,
  validatePerpsPayParams,
} from './perps-shared';

jest.mock('@metamask/perps-controller', () => ({
  ...jest.requireActual(
    '@metamask/perps-controller/constants/hyperLiquidConfig',
  ),
  ...jest.requireActual('@metamask/perps-controller/utils/transferData'),
}));

function expectInvalidParams(payParams: unknown, field: string) {
  let error: { code?: number; message?: string } | undefined;

  try {
    validatePerpsPayParams(payParams);
  } catch (caught) {
    error = caught as typeof error;
  }

  expect(error?.code).toBe(errorCodes.rpc.invalidParams);
  expect(error?.message).toContain(`"${field}"`);
}

function createMessenger(eligibility: boolean[]) {
  const states = [...eligibility];
  const call = jest.fn((action: string) =>
    action === 'PerpsController:getState'
      ? { isEligible: states.length > 1 ? states.shift() : states[0] }
      : undefined,
  );

  return { messenger: { call } as unknown as MmPayRpcMessenger, call };
}

describe('validatePerpsPayParams', () => {
  it('accepts missing payParams', () => {
    expect(validatePerpsPayParams(undefined)).toStrictEqual({});
  });

  it('accepts an empty object', () => {
    expect(validatePerpsPayParams({})).toStrictEqual({});
  });

  for (const amount of ['10', '0.5', '12.123456', '1000000']) {
    it(`accepts amount ${amount}`, () => {
      expect(validatePerpsPayParams({ amount })).toStrictEqual({ amount });
    });
  }

  for (const amount of ['-1', '0', '0.000000', '1.1234567', 'abc', '1e3', '']) {
    it(`rejects amount "${amount}"`, () => {
      expectInvalidParams({ amount }, 'payParams.amount');
    });
  }

  it('rejects a numeric amount', () => {
    expectInvalidParams({ amount: 10 }, 'payParams.amount');
  });

  it('rejects an unknown key, naming it', () => {
    expectInvalidParams({ amount: '1', token: 'USDC' }, 'payParams.token');
  });

  for (const payParams of [null, 'x', 1, ['10']]) {
    it(`rejects non-object payParams ${JSON.stringify(payParams)}`, () => {
      expectInvalidParams(payParams, 'payParams');
    });
  }
});

describe('toUsdcAmountRaw', () => {
  it('returns 0x0 without an amount', () => {
    expect(toUsdcAmountRaw(undefined)).toBe('0x0');
  });

  it('converts to 6-decimal base units', () => {
    expect(toUsdcAmountRaw('10')).toBe('0x989680');
    expect(toUsdcAmountRaw('0.5')).toBe('0x7a120');
    expect(toUsdcAmountRaw('12.123456')).toBe('0xb8fd40');
  });
});

describe('assertPerpsEligible', () => {
  it('passes without refreshing when already eligible', async () => {
    const { messenger, call } = createMessenger([true]);

    await assertPerpsEligible(messenger);

    expect(call).not.toHaveBeenCalledWith('PerpsController:refreshEligibility');
  });

  it('passes when a refresh shows the user is eligible', async () => {
    const { messenger, call } = createMessenger([false, true]);

    await assertPerpsEligible(messenger);

    expect(call).toHaveBeenCalledWith('PerpsController:refreshEligibility');
  });

  it('throws the geo-block error when still not eligible after a refresh', async () => {
    const { messenger } = createMessenger([false, false]);

    await expect(assertPerpsEligible(messenger)).rejects.toMatchObject({
      code: errorCodes.rpc.methodNotSupported,
      data: { reason: 'perpsNotEligible' },
    });
  });
});
