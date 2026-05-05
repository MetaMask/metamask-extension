import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';

import type {
  AmountField,
  PermissionRenderContext,
  SchemaElement,
} from './permission-detail-schema.types';
import {
  PERMISSION_SCHEMAS,
  assertPermissionSchemaEntry,
} from './permission-detail-schemas';
import { MAX_UINT256 } from './permission-constants';

function getJustificationGetValueFromSchema() {
  const entry = PERMISSION_SCHEMAS['native-token-stream'];
  for (const section of entry.sections) {
    for (const element of section.elements) {
      if (element.type === 'justification') {
        return element.getValue;
      }
    }
  }
  throw new Error(
    'Expected native-token-stream schema to include justification',
  );
}

function buildMinimalContext(
  justification: PermissionRenderContext['permission']['justification'],
): PermissionRenderContext {
  return {
    permission: {
      type: 'native-token-stream',
      data: {},
      justification,
    },
    expiry: null,
    chainId: '0x1' as Hex,
    origin: 'https://example.com',
  };
}

function findElementByTestId(
  permissionType: keyof typeof PERMISSION_SCHEMAS,
  testId: string,
): SchemaElement {
  const entry = PERMISSION_SCHEMAS[permissionType];
  for (const section of entry.sections) {
    for (const element of section.elements) {
      if ('testId' in element && element.testId === testId) {
        return element;
      }
    }
  }
  throw new Error(`No schema element with testId ${testId}`);
}

function findElementsByType(
  permissionType: keyof typeof PERMISSION_SCHEMAS,
  type: SchemaElement['type'],
): SchemaElement[] {
  const entry = PERMISSION_SCHEMAS[permissionType];
  const out: SchemaElement[] = [];
  for (const section of entry.sections) {
    for (const element of section.elements) {
      if (element.type === type) {
        out.push(element);
      }
    }
  }
  return out;
}

describe('justification field getValue', () => {
  it('returns the no-justification i18n value when justification is an empty string', () => {
    const getValue = getJustificationGetValueFromSchema();
    expect(getValue(buildMinimalContext(''))).toStrictEqual({
      key: 'gatorNoJustificationProvided',
    });
  });

  it('returns the no-justification i18n value when justification is undefined', () => {
    const getValue = getJustificationGetValueFromSchema();
    expect(getValue(buildMinimalContext(undefined))).toStrictEqual({
      key: 'gatorNoJustificationProvided',
    });
  });

  it('returns the site-provided justification text when non-empty', () => {
    const getValue = getJustificationGetValueFromSchema();
    expect(getValue(buildMinimalContext('Pay subscription'))).toBe(
      'Pay subscription',
    );
  });
});

describe('assertPermissionSchemaEntry', () => {
  it('throws with the permission type in the message when the registry has no entry', () => {
    expect(() =>
      assertPermissionSchemaEntry(
        'unregistered-type',
        PERMISSION_SCHEMAS['unregistered-type'],
      ),
    ).toThrow('Invalid permission type: unregistered-type');
  });

  it('does not throw for a registered type', () => {
    expect(() =>
      assertPermissionSchemaEntry(
        'native-token-stream',
        PERMISSION_SCHEMAS['native-token-stream'],
      ),
    ).not.toThrow();
  });
});

describe('permissionInfoSection field accessors', () => {
  const base: PermissionRenderContext = {
    permission: { type: 'native-token-stream', data: {} },
    expiry: null,
    chainId: '0x1' as Hex,
    origin: 'https://dapp.example',
  };

  it('exposes origin via the origin field', () => {
    const originEl = findElementByTestId(
      'native-token-stream',
      'confirmation-origin',
    );
    expect(originEl.type).toBe('origin');
    if (originEl.type !== 'origin') {
      return;
    }
    expect(originEl.getValue(base)).toBe('https://dapp.example');
  });

  it('hides recipient when `to` is unset and shows it when set', () => {
    const addressEl = findElementByTestId(
      'native-token-stream',
      'confirmation-recipient',
    );
    expect(addressEl.type).toBe('address');
    if (addressEl.type !== 'address') {
      return;
    }
    expect(addressEl.isVisible(base)).toBe(false);
    expect(
      addressEl.isVisible({
        ...base,
        to: '0x0000000000000000000000000000000000000002',
      }),
    ).toBe(true);
    expect(
      addressEl.getValue({
        ...base,
        to: '0x0000000000000000000000000000000000000002',
      }),
    ).toBe('0x0000000000000000000000000000000000000002');
  });

  it('reads redeemerAddresses from context for the redeemer field', () => {
    const redeemerEl = findElementByTestId(
      'native-token-stream',
      'confirmation-redeemer',
    );
    expect(redeemerEl.type).toBe('redeemer');
    if (redeemerEl.type !== 'redeemer') {
      return;
    }
    const addrs = ['0x0000000000000000000000000000000000000003'];
    expect(
      redeemerEl.getValue({ ...base, redeemerAddresses: addrs }),
    ).toStrictEqual(addrs);
    expect(redeemerEl.isVisible({ ...base, redeemerAddresses: addrs })).toBe(
      true,
    );
  });

  it('reads payeeAddresses from context for the payee field', () => {
    const payeeEl = findElementByTestId(
      'native-token-stream',
      'confirmation-payee',
    );
    expect(payeeEl.type).toBe('payee');
    if (payeeEl.type !== 'payee') {
      return;
    }
    const addrs = ['0x0000000000000000000000000000000000000003'];
    expect(
      payeeEl.getValue({ ...base, payeeAddresses: addrs }),
    ).toStrictEqual(addrs);
    expect(payeeEl.isVisible({ ...base, payeeAddresses: addrs })).toBe(true);
  });
});

describe('stream confirmation total exposure fields', () => {
  const streamData = {
    initialAmount: '0x01',
    maxAmount: MAX_UINT256,
    amountPerSecond: '0x01',
    startTime: 1,
  };

  it('throws when streamTotalExposure is missing from context', () => {
    const el = findElementByTestId(
      'native-token-stream',
      'confirmation-total-exposure',
    ) as AmountField;
    const ctx: PermissionRenderContext = {
      permission: { type: 'native-token-stream', data: streamData },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(() => el.getValue(ctx)).toThrow(
      'streamTotalExposure must be set when rendering stream permission fields',
    );
  });

  it('treats null streamTotalExposure as unlimited in the confirmation summary', () => {
    const finite = findElementByTestId(
      'native-token-stream',
      'confirmation-total-exposure',
    ) as AmountField;
    const unlimited = findElementByTestId(
      'native-token-stream',
      'confirmation-total-exposure-unlimited',
    );
    expect(unlimited.type).toBe('text');

    const ctx: PermissionRenderContext = {
      permission: { type: 'native-token-stream', data: streamData },
      expiry: null,
      chainId: '0x1' as Hex,
      streamTotalExposure: null,
    };

    expect(finite.isVisible(ctx)).toBe(false);
    if (unlimited.type !== 'text') {
      return;
    }
    expect(unlimited.isVisible(ctx)).toBe(true);
    expect(unlimited.getValue(ctx)).toStrictEqual({ key: 'unlimited' });
  });

  it('shows finite total exposure when streamTotalExposure is a BigNumber', () => {
    const finite = findElementByTestId(
      'native-token-stream',
      'confirmation-total-exposure',
    ) as AmountField;
    const unlimited = findElementByTestId(
      'native-token-stream',
      'confirmation-total-exposure-unlimited',
    );
    const ctx: PermissionRenderContext = {
      permission: { type: 'native-token-stream', data: streamData },
      expiry: null,
      chainId: '0x1' as Hex,
      streamTotalExposure: new BigNumber(42),
    };
    expect(finite.isVisible(ctx)).toBe(true);
    expect(finite.getValue(ctx).toFixed()).toBe('42');
    if (unlimited.type !== 'text') {
      return;
    }
    expect(unlimited.isVisible(ctx)).toBe(false);
  });

  it('requires streamTotalExposure for ERC20 stream total exposure amount', () => {
    const el = findElementByTestId(
      'erc20-token-stream',
      'confirmation-total-exposure',
    ) as AmountField;
    const ctx: PermissionRenderContext = {
      permission: {
        type: 'erc20-token-stream',
        data: { ...streamData, tokenAddress: MAX_UINT256 },
      },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(() => el.getValue(ctx)).toThrow(
      'streamTotalExposure must be set when rendering stream permission fields',
    );
  });
});

describe('native-token-stream max allowance visibility', () => {
  const baseData = {
    initialAmount: '0x1',
    amountPerSecond: '0x1',
    startTime: 1,
  };

  it('shows the numeric max allowance row unless max is unlimited', () => {
    const maxRow = findElementByTestId(
      'native-token-stream',
      'review-gator-permission-max-allowance',
    ) as AmountField;
    const unlimitedRow = findElementByTestId(
      'native-token-stream',
      'review-gator-permission-max-allowance-unlimited',
    );
    const ctxFinite: PermissionRenderContext = {
      permission: {
        type: 'native-token-stream',
        data: { ...baseData, maxAmount: '0x10' },
      },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(maxRow.isVisible(ctxFinite)).toBe(true);
    if (unlimitedRow.type !== 'text') {
      return;
    }
    expect(unlimitedRow.isVisible(ctxFinite)).toBe(false);

    const ctxUnlimited: PermissionRenderContext = {
      permission: {
        type: 'native-token-stream',
        data: { ...baseData, maxAmount: MAX_UINT256 },
      },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(maxRow.isVisible(ctxUnlimited)).toBe(false);
    expect(unlimitedRow.isVisible(ctxUnlimited)).toBe(true);
  });

  it('hides the initial allowance amount when initialAmount is absent', () => {
    const initialRow = findElementByTestId(
      'native-token-stream',
      'review-gator-permission-initial-allowance',
    ) as AmountField;
    const ctx: PermissionRenderContext = {
      permission: {
        type: 'native-token-stream',
        data: {
          amountPerSecond: '0x1',
          startTime: 1,
          maxAmount: '0xff',
        },
      },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(initialRow.isVisible(ctx)).toBe(false);
  });
});

describe('native-token-periodic review summary fields', () => {
  it('maps daily periodDuration to the daily translation key', () => {
    const freq = findElementByTestId(
      'native-token-periodic',
      'review-gator-permission-frequency-label',
    );
    expect(freq.type).toBe('text');
    if (freq.type !== 'text') {
      return;
    }
    const ctx: PermissionRenderContext = {
      permission: {
        type: 'native-token-periodic',
        data: {
          periodAmount: '0x1',
          periodDuration: 86400,
          startTime: 1,
        },
      },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(freq.getValue(ctx)).toStrictEqual({
      key: 'gatorPermissionDailyFrequency',
    });
  });
});

describe('native-token-stream weekly summary aggregates', () => {
  it('computes streamed amount per weekly period and labels it as weekly', () => {
    const amountEl = findElementByTestId(
      'native-token-stream',
      'review-gator-permission-amount-label',
    ) as AmountField;
    const freqEl = findElementByTestId(
      'native-token-stream',
      'review-gator-permission-frequency-label',
    );
    expect(freqEl.type).toBe('text');
    const ctx: PermissionRenderContext = {
      permission: {
        type: 'native-token-stream',
        data: {
          initialAmount: '0x01',
          maxAmount: '0xff',
          amountPerSecond: '0x01',
          startTime: 1,
        },
      },
      expiry: null,
      chainId: '0x1' as Hex,
    };
    expect(amountEl.getValue(ctx).toFixed()).not.toBe('0');
    if (freqEl.type !== 'text') {
      return;
    }
    expect(freqEl.getValue(ctx)).toStrictEqual({
      key: 'gatorPermissionWeeklyFrequency',
    });
  });
});

describe('erc20-token-revocation summary', () => {
  it('shows an i18n value for revoke-all-tokens summary text', () => {
    const textEl = findElementByTestId(
      'erc20-token-revocation',
      'review-gator-permission-amount-label',
    );
    expect(textEl.type).toBe('text');
    if (textEl.type !== 'text') {
      return;
    }
    expect(textEl.getValue(buildMinimalContext(undefined))).toStrictEqual({
      key: 'allTokens',
    });
  });

  it('includes a standalone network element marker in confirmation info sections', () => {
    expect(
      findElementsByType('erc20-token-revocation', 'network')[0]?.type,
    ).toBe('network');
  });
});

describe('account justification field static accessors', () => {
  it('always returns undefined for account avatar fields used in confirmation markup', () => {
    const accountEl = PERMISSION_SCHEMAS['native-token-stream'].sections
      .flatMap((s) => s.elements)
      .find(
        (e) =>
          e.type === 'account' && e.includeInViews.includes('confirmation'),
      );
    expect(accountEl?.type).toBe('account');
    if (accountEl?.type !== 'account') {
      return;
    }
    expect(accountEl.getValue(buildMinimalContext(undefined))).toBeUndefined();
  });
});

describe('requireStartTime validation', () => {
  it('runs on native-token-periodic schemas', () => {
    const { validate } = PERMISSION_SCHEMAS['native-token-periodic'];
    expect(validate).toBeDefined();
    expect(() =>
      validate?.({ data: { periodAmount: '0x1', periodDuration: 1 } }),
    ).toThrow('Start time is required');
  });

  it('runs on erc20-token-periodic schemas', () => {
    const { validate } = PERMISSION_SCHEMAS['erc20-token-periodic'];
    expect(() =>
      validate?.({
        data: {
          tokenAddress: '0x0000000000000000000000000000000000000001',
          periodAmount: '0x1',
          periodDuration: 1,
          startTime: 1,
        },
      }),
    ).not.toThrow();
  });
});
