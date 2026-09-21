import {
  getPeriodFrequencyValueTranslationKey,
  formatPermissionPeriodDuration,
} from '@metamask/7715-permission-types';
import type {
  SchemaElement,
  PermissionRenderContext,
} from '@metamask/7715-permission-types';
// eslint-disable-next-line import-x/no-restricted-paths
import enMessages from '../../../app/_locales/en/messages.json';
import { captureMessage } from '../sentry';
import { getPermissionSchemaEntry } from './permission-detail-schemas';

jest.mock('../sentry', () => ({
  captureMessage: jest.fn(),
}));

const KNOWN_PERMISSION_TYPES = [
  'native-token-periodic',
  'native-token-stream',
  'native-token-allowance',
  'erc20-token-periodic',
  'erc20-token-stream',
  'erc20-token-allowance',
  'token-approval-revocation',
];

const BASE_CONTEXT: PermissionRenderContext = {
  permission: { type: 'native-token-stream', data: {} },
  expiry: null,
  chainId: '0x1',
};

/**
 * Collects every locale key an element can reference at render time: its
 * `labelKey`/`tooltip`, plus any `{ key }` i18n value its `getValue` can
 * produce, exercised across every context that changes which branch runs.
 * @param element
 * @param contexts
 */
function collectElementLocaleKeys(
  element: SchemaElement,
  contexts: PermissionRenderContext[],
): string[] {
  const keys: string[] = [];
  if ('labelKey' in element) {
    keys.push(element.labelKey);
  }
  if ('tooltip' in element && typeof element.tooltip === 'string') {
    keys.push(element.tooltip);
  }
  if ('getValue' in element) {
    for (const ctx of contexts) {
      // Amount/date fields need real permission data to compute a value;
      // only the `{ key }`-i18n-value and string-list branches matter here,
      // so fields that need more context than we provide are skipped.
      let value;
      try {
        value = element.getValue(ctx as never);
      } catch {
        continue;
      }
      if (value && typeof value === 'object' && 'key' in value) {
        keys.push(value.key);
      }
      // Only `list` elements render their array values as i18n keys
      // (e.g. revocation method names); other array-valued fields
      // (like `rule-address`) hold raw data, not locale keys.
      if (element.type === 'list' && Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string') {
            keys.push(item);
          }
        });
      }
    }
  }
  return keys;
}

describe('getPermissionSchemaEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the schema for a known permission type', () => {
    const schema = getPermissionSchemaEntry('native-token-stream');
    expect(schema.tokenVariant).toBe('native');
  });

  it('does not report known permission types to Sentry', () => {
    getPermissionSchemaEntry('native-token-stream');
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('reports unknown permission types to Sentry', () => {
    getPermissionSchemaEntry('unregistered-type');
    expect(captureMessage).toHaveBeenCalledWith(
      'Unknown advanced permission type encountered',
      { extra: { permissionType: 'unregistered-type' } },
    );
  });

  it('does not report to Sentry when throwIfUnknown is true', () => {
    expect(() => getPermissionSchemaEntry('unregistered-type', true)).toThrow(
      'Unknown permission type: unregistered-type',
    );
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('falls back to unknown schema when no matching type exists', () => {
    const unknownSchema = getPermissionSchemaEntry('unregistered-type');
    const unknownTypeElement = unknownSchema.sections
      .flatMap((section) => section.elements)
      .find(
        (element) =>
          'testId' in element &&
          element.testId === 'review-gator-permission-unknown-type',
      );

    expect(unknownTypeElement?.type).toBe('raw-text');
  });
});

describe('locale keys referenced by @metamask/7715-permission-types schemas', () => {
  // Contexts chosen to exercise every branch that changes which locale key
  // a `getValue()` call returns (e.g. facilitator-only vs. named redeemers,
  // each individually-enabled token approval revocation method).
  const revocationContexts: PermissionRenderContext[] = [
    { ...BASE_CONTEXT, redeemerAddresses: ['0xfacilitator'] },
    { ...BASE_CONTEXT, redeemerAddresses: ['0xother'] },
    {
      ...BASE_CONTEXT,
      permission: {
        type: 'token-approval-revocation',
        data: {
          erc20Approve: true,
          erc721Approve: true,
          erc721SetApprovalForAll: true,
          permit2Approve: true,
          permit2Lockdown: true,
          permit2InvalidateNonces: true,
        },
      },
    },
    {
      ...BASE_CONTEXT,
      permission: {
        type: 'token-approval-revocation',
        data: { erc20Approve: true },
      },
    },
  ];

  it('all statically and dynamically referenced keys exist in the en locale', () => {
    const referencedKeys = new Set<string>();

    for (const permissionType of [
      ...KNOWN_PERMISSION_TYPES,
      'unregistered-type', // exercises the unknown-permission-type schema
    ]) {
      const schema = getPermissionSchemaEntry(permissionType);
      for (const section of schema.sections) {
        for (const element of section.elements) {
          collectElementLocaleKeys(element, [
            BASE_CONTEXT,
            ...revocationContexts,
          ]).forEach((key) => referencedKeys.add(key));
        }
      }
    }

    // Period durations are rendered via standalone helpers rather than an
    // element's getValue, so they're not reachable via the schema walk above.
    const secondsPerPeriod = [
      1, 3600, 86400, 604800, 1209600, 2592000, 31536000,
    ];
    secondsPerPeriod.forEach((seconds) => {
      referencedKeys.add(getPeriodFrequencyValueTranslationKey(seconds));
      referencedKeys.add(formatPermissionPeriodDuration(seconds).key);
    });

    expect(referencedKeys.size).toBeGreaterThan(0);

    const missingKeys = [...referencedKeys].filter(
      (key) => !(key in enMessages),
    );
    expect(missingKeys).toStrictEqual([]);

    // Written out as literals (not derived from referencedKeys) so
    // `yarn verify-locales` can see these locale keys are still in use —
    // it statically scans source text and can't detect keys computed only
    // at runtime via getValue()/formatPermissionPeriodDuration() above.
    const expectedKeys = [
      'account',
      'allTokens',
      'amount',
      'confirmFieldAllowance',
      'confirmFieldAvailablePerDay',
      'confirmFieldFrequency',
      'confirmFieldPeriodDurationBiWeekly',
      'confirmFieldPeriodDurationDaily',
      'confirmFieldPeriodDurationHourly',
      'confirmFieldPeriodDurationMonthly',
      'confirmFieldPeriodDurationSeconds',
      'confirmFieldPeriodDurationWeekly',
      'confirmFieldPeriodDurationYearly',
      'confirmFieldTotalExposure',
      'gatorNoJustificationProvided',
      'gatorPermissionAnnualFrequency',
      'gatorPermissionCustomFrequency',
      'gatorPermissionDailyFrequency',
      'gatorPermissionFortnightlyFrequency',
      'gatorPermissionMonthlyFrequency',
      'gatorPermissionTokenPeriodicFrequencyLabel',
      'gatorPermissionTokenStreamFrequencyLabel',
      'gatorPermissionWeeklyFrequency',
      'gatorPermissionsAllTokenApprovalRevocationPrimitives',
      'gatorPermissionsErc20ApproveRevocation',
      'gatorPermissionsErc721ApproveRevocation',
      'gatorPermissionsExpirationDate',
      'gatorPermissionsInitialAllowance',
      'gatorPermissionsJustification',
      'gatorPermissionsMaxAllowance',
      'gatorPermissionsMetaMaskFacilitator',
      'gatorPermissionsPermit2ApproveRevocation',
      'gatorPermissionsPermit2InvalidateNonces',
      'gatorPermissionsPermit2Lockdown',
      'gatorPermissionsRevocationMethods',
      'gatorPermissionsSetApprovalForAllRevocation',
      'gatorPermissionsStartDate',
      'gatorPermissionsStreamRate',
      'gatorPermissionsStreamingAmountLabel',
      'payee',
      'recipient',
      'redeemer',
      'redeemers',
      'requestFrom',
      'revokeTokenApprovals',
      'unknownPermissionType',
      'unlimited',
    ];
    expect([...referencedKeys].sort()).toStrictEqual([...expectedKeys].sort());
  });
});
