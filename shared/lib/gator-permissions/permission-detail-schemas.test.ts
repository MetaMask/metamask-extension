import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';

import type {
  PermissionRenderContext,
  SchemaElement,
} from './permission-detail-schema.types';
import {
  PERMISSION_SCHEMAS,
  assertPermissionSchemaEntry,
} from './permission-detail-schemas';
import { MAX_UINT256 } from './permission-constants';

type ElementOfType<TType extends SchemaElement['type']> = Extract<
  SchemaElement,
  { type: TType }
>;

function getJustificationGetValueFromSchema() {
  return findElementOfType(
    'native-token-stream',
    'review-gator-permission-justification',
    'justification',
  ).getValue;
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
  for (const section of PERMISSION_SCHEMAS[permissionType].sections) {
    for (const element of section.elements) {
      if ('testId' in element && element.testId === testId) {
        return element;
      }
    }
  }
  throw new Error(`No schema element with testId ${testId}`);
}

function findElementOfType<TType extends SchemaElement['type']>(
  permissionType: keyof typeof PERMISSION_SCHEMAS,
  testId: string,
  type: TType,
): ElementOfType<TType> {
  const element = findElementByTestId(permissionType, testId);
  if (element.type !== type) {
    throw new Error(`Expected ${testId} to be ${type}`);
  }
  return element as ElementOfType<TType>;
}

function ctx(
  type = 'native-token-stream',
  data: Record<string, unknown> = {},
  extras: Partial<PermissionRenderContext> = {},
): PermissionRenderContext {
  return {
    permission: { type, data },
    expiry: null,
    chainId: '0x1' as Hex,
    origin: 'https://dapp.example',
    ...extras,
  };
}

describe('justification field getValue', () => {
  it('returns the no-justification i18n value when justification is an empty string', () => {
    expect(
      getJustificationGetValueFromSchema()(buildMinimalContext('')),
    ).toStrictEqual({
      key: 'gatorNoJustificationProvided',
    });
  });

  it('returns the no-justification i18n value when justification is undefined', () => {
    expect(
      getJustificationGetValueFromSchema()(buildMinimalContext(undefined)),
    ).toStrictEqual({ key: 'gatorNoJustificationProvided' });
  });

  it('returns the site-provided justification text when non-empty', () => {
    expect(
      getJustificationGetValueFromSchema()(
        buildMinimalContext('Pay subscription'),
      ),
    ).toBe('Pay subscription');
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
  const base = ctx(undefined, undefined, { origin: 'https://dapp.example' });

  it('exposes origin and recipient values', () => {
    const recipient = '0x0000000000000000000000000000000000000002';
    const originEl = findElementOfType(
      'native-token-stream',
      'confirmation-origin',
      'origin',
    );
    const recipientEl = findElementOfType(
      'native-token-stream',
      'confirmation-recipient',
      'address',
    );

    expect(originEl.getValue(base)).toBe('https://dapp.example');
    expect(recipientEl.isVisible(base)).toBe(false);
    expect(recipientEl.isVisible({ ...base, to: recipient })).toBe(true);
    expect(recipientEl.getValue({ ...base, to: recipient })).toBe(recipient);
  });

  it('reads redeemer and payee addresses from context', () => {
    const addresses = ['0x0000000000000000000000000000000000000003'];

    for (const [testId, field] of [
      ['confirmation-redeemer', 'redeemerAddresses'],
      ['confirmation-payee', 'payeeAddresses'],
    ] as const) {
      const element = findElementOfType(
        'native-token-stream',
        testId,
        'rule-address',
      );
      const context = { ...base, [field]: addresses };
      expect(element.getValue(context)).toStrictEqual(addresses);
      expect(element.isVisible(context)).toBe(true);
    }
  });
});

describe('stream confirmation total exposure fields', () => {
  const streamData = {
    initialAmount: '0x01',
    maxAmount: MAX_UINT256,
    amountPerSecond: '0x01',
    startTime: 1,
  };
  const finite = findElementOfType(
    'native-token-stream',
    'confirmation-total-exposure',
    'amount',
  );
  const unlimited = findElementOfType(
    'native-token-stream',
    'confirmation-total-exposure-unlimited',
    'text',
  );

  it('requires streamTotalExposure for stream total exposure amount fields', () => {
    for (const [permissionType, data] of [
      ['native-token-stream', streamData],
      ['erc20-token-stream', { ...streamData, tokenAddress: MAX_UINT256 }],
    ] as const) {
      const element = findElementOfType(
        permissionType,
        'confirmation-total-exposure',
        'amount',
      );
      expect(() => element.getValue(ctx(permissionType, data))).toThrow(
        'streamTotalExposure must be set when rendering stream permission fields',
      );
    }
  });

  it('shows unlimited or finite total exposure based on streamTotalExposure', () => {
    const unlimitedCtx = ctx('native-token-stream', streamData, {
      streamTotalExposure: null,
    });
    const finiteCtx = ctx('native-token-stream', streamData, {
      streamTotalExposure: new BigNumber(42),
    });

    expect(finite.isVisible(unlimitedCtx)).toBe(false);
    expect(unlimited.isVisible(unlimitedCtx)).toBe(true);
    expect(unlimited.getValue(unlimitedCtx)).toStrictEqual({
      key: 'unlimited',
    });
    expect(finite.isVisible(finiteCtx)).toBe(true);
    expect(finite.getValue(finiteCtx).toFixed()).toBe('42');
    expect(unlimited.isVisible(finiteCtx)).toBe(false);
  });
});

describe('native-token-stream review fields', () => {
  const baseData = {
    initialAmount: '0x1',
    amountPerSecond: '0x1',
    startTime: 1,
  };

  it('toggles max and initial allowance rows from permission data', () => {
    const maxRow = findElementOfType(
      'native-token-stream',
      'review-gator-permission-max-allowance',
      'amount',
    );
    const unlimitedRow = findElementOfType(
      'native-token-stream',
      'review-gator-permission-max-allowance-unlimited',
      'text',
    );
    const initialRow = findElementOfType(
      'native-token-stream',
      'review-gator-permission-initial-allowance',
      'amount',
    );
    const finiteCtx = ctx('native-token-stream', {
      ...baseData,
      maxAmount: '0x10',
    });
    const unlimitedCtx = ctx('native-token-stream', {
      ...baseData,
      maxAmount: MAX_UINT256,
    });
    const noInitialCtx = ctx('native-token-stream', {
      amountPerSecond: '0x1',
      startTime: 1,
      maxAmount: '0xff',
    });

    expect(maxRow.isVisible(finiteCtx)).toBe(true);
    expect(unlimitedRow.isVisible(finiteCtx)).toBe(false);
    expect(maxRow.isVisible(unlimitedCtx)).toBe(false);
    expect(unlimitedRow.isVisible(unlimitedCtx)).toBe(true);
    expect(initialRow.isVisible(noInitialCtx)).toBe(false);
  });

  it('computes weekly summary amount and frequency', () => {
    const amountEl = findElementOfType(
      'native-token-stream',
      'review-gator-permission-amount-label',
      'amount',
    );
    const freqEl = findElementOfType(
      'native-token-stream',
      'review-gator-permission-frequency-label',
      'text',
    );
    const context = ctx('native-token-stream', {
      ...baseData,
      maxAmount: '0xff',
    });

    expect(amountEl.getValue(context).toFixed()).not.toBe('0');
    expect(freqEl.getValue(context)).toStrictEqual({
      key: 'gatorPermissionWeeklyFrequency',
    });
  });
});

describe('other schema fields', () => {
  it('maps native periodic and ERC20 revocation summary text', () => {
    const frequency = findElementOfType(
      'native-token-periodic',
      'review-gator-permission-frequency-label',
      'text',
    );
    const revokeAll = findElementOfType(
      'erc20-token-revocation',
      'review-gator-permission-amount-label',
      'text',
    );

    expect(
      frequency.getValue(
        ctx('native-token-periodic', {
          periodAmount: '0x1',
          periodDuration: 86400,
          startTime: 1,
        }),
      ),
    ).toStrictEqual({ key: 'gatorPermissionDailyFrequency' });
    expect(revokeAll.getValue(buildMinimalContext(undefined))).toStrictEqual({
      key: 'allTokens',
    });
  });

  it('includes confirmation-only account and standalone network elements', () => {
    const accountEl = PERMISSION_SCHEMAS['native-token-stream'].sections
      .flatMap((section) => section.elements)
      .find(
        (element) =>
          element.type === 'account' &&
          element.includeInViews.includes('confirmation'),
      );
    const hasNetwork = PERMISSION_SCHEMAS[
      'erc20-token-revocation'
    ].sections.some((section) =>
      section.elements.some((element) => element.type === 'network'),
    );

    expect(accountEl?.type).toBe('account');
    expect(accountEl?.getValue(buildMinimalContext(undefined))).toBeUndefined();
    expect(hasNetwork).toBe(true);
  });
});

describe('requireStartTime validation', () => {
  it('validates required startTime for periodic schemas', () => {
    expect(() =>
      PERMISSION_SCHEMAS['native-token-periodic'].validate?.({
        data: { periodAmount: '0x1', periodDuration: 1 },
      }),
    ).toThrow('Start time is required');
    expect(() =>
      PERMISSION_SCHEMAS['erc20-token-periodic'].validate?.({
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
