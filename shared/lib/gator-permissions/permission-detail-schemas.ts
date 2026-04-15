import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';

import { DAY } from '../../constants/time';
import { formatPermissionPeriodDuration } from './format-permission-period-duration';
import { MAX_UINT256 } from './permission-constants';
import { parseHexPermissionAmount } from './parse-hex-permission-amount';
import type {
  PermissionRenderContext,
  PermissionSchemaEntry,
  PermissionSchemaRegistry,
  SchemaSection,
} from './permission-detail-schema.types';
import {
  convertAmountPerSecondToAmountPerPeriod,
  getPeriodFrequencyValueTranslationKey,
} from './time-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getData = <TReturn = unknown>(
  ctx: PermissionRenderContext,
  key: string,
): TReturn => ctx.permission.data[key] as TReturn;

function getStreamTotalExposure(
  ctx: PermissionRenderContext,
): BigNumber | null {
  if (ctx.streamTotalExposure === undefined) {
    throw new Error(
      'PermissionRenderContext.streamTotalExposure must be set when rendering stream permission fields',
    );
  }
  return ctx.streamTotalExposure;
}

const requireStartTime = (permission: {
  data: Record<string, unknown>;
}): void => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }
};

const alwaysVisible = () => true;

// ---------------------------------------------------------------------------
// Common sections — shared across all permission types
// These are confirmation-only; the review page renders them with custom UI.
// ---------------------------------------------------------------------------

const justificationSection: SchemaSection = {
  testId: 'confirmation_justification-section',
  elements: [
    {
      type: 'justification',
      labelKey: 'gatorPermissionsJustification',
      testId: 'review-gator-permission-justification',
      getValue: (ctx) =>
        ctx.permission.justification || { key: 'gatorNoJustificationProvided' },
      isVisible: alwaysVisible,
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    {
      type: 'account',
      labelKey: 'account',
      testId: 'review-gator-permission-account-name',
      getValue: () => undefined,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
  ],
};

/** Account row for review list summary — last so Amount/Frequency precede it. */
const reviewSummaryAccountSection: SchemaSection = {
  testId: 'review_summary-account-section',
  elements: [
    {
      type: 'account',
      labelKey: 'account',
      testId: 'review-gator-permission-account-name',
      getValue: () => undefined,
      isVisible: alwaysVisible,
      includeInViews: ['reviewSummary'],
    },
  ],
};

const permissionInfoSection: SchemaSection = {
  testId: 'confirmation_permission-section',
  elements: [
    {
      type: 'origin',
      labelKey: 'requestFrom',
      testId: 'confirmation-origin',
      getValue: (ctx) => ctx.origin,
      isVisible: alwaysVisible,
      includeInViews: ['confirmation'],
    },
    {
      type: 'address',
      labelKey: 'recipient',
      testId: 'confirmation-recipient',
      getValue: (ctx) => ctx.to,
      isVisible: (ctx) => Boolean(ctx.to),
      includeInViews: ['confirmation'],
    },
    { type: 'network', includeInViews: ['confirmation', 'reviewDetail'] },
  ],
};

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

const nativeTokenPeriodicSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'native-token-periodic-details-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'amount',
          testId: 'review-gator-permission-amount-label',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'periodAmount')),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          testId: 'review-gator-permission-frequency-label',
          getValue: (ctx) => ({
            key: getPeriodFrequencyValueTranslationKey(
              getData<number>(ctx, 'periodDuration'),
            ),
          }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAllowance',
          testId: 'confirmation-allowance',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'periodAmount')),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          testId: 'confirmation-frequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData<number>(ctx, 'periodDuration'),
            ),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'gatorPermissionsStartDate',
          testId: 'review-gator-permission-start-date',
          getValue: (ctx) => getData<number>(ctx, 'startTime'),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};

const nativeTokenStreamSchema: PermissionSchemaEntry = {
  tokenVariant: 'native',
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'native-token-stream-details-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'gatorPermissionsStreamingAmountLabel',
          testId: 'review-gator-permission-amount-label',
          getValue: (ctx) =>
            parseHexPermissionAmount(
              convertAmountPerSecondToAmountPerPeriod(
                getData<Hex>(ctx, 'amountPerSecond'),
                'weekly',
              ),
            ),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
          testId: 'review-gator-permission-frequency-label',
          getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'amount',
          labelKey: 'gatorPermissionsInitialAllowance',
          testId: 'review-gator-permission-initial-allowance',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'initialAmount')),
          isVisible: (ctx) => Boolean(getData(ctx, 'initialAmount')),
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'gatorPermissionsMaxAllowance',
          testId: 'review-gator-permission-max-allowance',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'maxAmount')),
          isVisible: (ctx) => {
            const max = getData<string | null | undefined>(ctx, 'maxAmount');
            return (
              max !== undefined &&
              max !== null &&
              max.toLowerCase() !== MAX_UINT256
            );
          },
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionsMaxAllowance',
          testId: 'review-gator-permission-max-allowance-unlimited',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData<string | null | undefined>(ctx, 'maxAmount');
            return Boolean(max?.toLowerCase() === MAX_UINT256);
          },
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'gatorPermissionsStartDate',
          testId: 'review-gator-permission-start-date',
          getValue: (ctx) => getData<number>(ctx, 'startTime'),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    {
      testId: 'native-token-stream-stream-rate-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'gatorPermissionsStreamRate',
          testId: 'review-gator-permission-stream-rate',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'amountPerSecond')),
          isRatePerSecond: true,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          testId: 'confirmation-available-per-day',
          getValue: (ctx) =>
            parseHexPermissionAmount(
              getData<string>(ctx, 'amountPerSecond'),
            ).mul(DAY / 1000),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldTotalExposure',
          testId: 'confirmation-total-exposure',
          getValue: (ctx) => getStreamTotalExposure(ctx) ?? new BigNumber(0),
          isVisible: (ctx) => getStreamTotalExposure(ctx) !== null,
          includeInViews: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldTotalExposure',
          testId: 'confirmation-total-exposure-unlimited',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => getStreamTotalExposure(ctx) === null,
          includeInViews: ['confirmation'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};

const erc20TokenPeriodicSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (p) => p.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'erc20-token-periodic-details-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'amount',
          testId: 'review-gator-permission-amount-label',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'periodAmount')),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          testId: 'review-gator-permission-frequency-label',
          getValue: (ctx) => ({
            key: getPeriodFrequencyValueTranslationKey(
              getData<number>(ctx, 'periodDuration'),
            ),
          }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAllowance',
          testId: 'confirmation-allowance',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'periodAmount')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          testId: 'confirmation-frequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData<number>(ctx, 'periodDuration'),
            ),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'gatorPermissionsStartDate',
          testId: 'review-gator-permission-start-date',
          getValue: (ctx) => getData<number>(ctx, 'startTime'),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};

const erc20TokenStreamSchema: PermissionSchemaEntry = {
  tokenVariant: 'erc20',
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (p) => p.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'erc20-token-stream-details-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'gatorPermissionsStreamingAmountLabel',
          testId: 'review-gator-permission-amount-label',
          getValue: (ctx) =>
            parseHexPermissionAmount(
              convertAmountPerSecondToAmountPerPeriod(
                getData<Hex>(ctx, 'amountPerSecond'),
                'weekly',
              ),
            ),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
          testId: 'review-gator-permission-frequency-label',
          getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'amount',
          labelKey: 'gatorPermissionsInitialAllowance',
          testId: 'review-gator-permission-initial-allowance',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'initialAmount')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: (ctx) => Boolean(getData(ctx, 'initialAmount')),
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'gatorPermissionsMaxAllowance',
          testId: 'review-gator-permission-max-allowance',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'maxAmount')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: (ctx) => {
            const max = getData<string | null | undefined>(ctx, 'maxAmount');
            return (
              max !== undefined &&
              max !== null &&
              max.toLowerCase() !== MAX_UINT256
            );
          },
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionsMaxAllowance',
          testId: 'review-gator-permission-max-allowance-unlimited',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData<string | null | undefined>(ctx, 'maxAmount');
            return Boolean(max?.toLowerCase() === MAX_UINT256);
          },
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'gatorPermissionsStartDate',
          testId: 'review-gator-permission-start-date',
          getValue: (ctx) => getData<number>(ctx, 'startTime'),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    {
      testId: 'erc20-token-stream-stream-rate-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'gatorPermissionsStreamRate',
          testId: 'review-gator-permission-stream-rate',
          getValue: (ctx) =>
            parseHexPermissionAmount(getData<string>(ctx, 'amountPerSecond')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isRatePerSecond: true,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          testId: 'confirmation-available-per-day',
          getValue: (ctx) =>
            parseHexPermissionAmount(
              getData<string>(ctx, 'amountPerSecond'),
            ).mul(DAY / 1000),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: alwaysVisible,
          includeInViews: ['confirmation'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldTotalExposure',
          testId: 'confirmation-total-exposure',
          getValue: (ctx) => getStreamTotalExposure(ctx) ?? new BigNumber(0),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: (ctx) => getStreamTotalExposure(ctx) !== null,
          includeInViews: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldTotalExposure',
          testId: 'confirmation-total-exposure-unlimited',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => getStreamTotalExposure(ctx) === null,
          includeInViews: ['confirmation'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};

const erc20TokenRevocationSchema: PermissionSchemaEntry = {
  tokenVariant: 'none',
  tokenResolution: { kind: 'none' },
  sections: [
    justificationSection,
    permissionInfoSection,
    {
      testId: 'erc20-token-revocation-details-section',
      elements: [
        {
          type: 'text',
          labelKey: 'revokeTokenApprovals',
          testId: 'review-gator-permission-amount-label',
          getValue: () => ({ key: 'allTokens' }),
          isVisible: alwaysVisible,
          includeInViews: ['reviewSummary'],
        },
        {
          type: 'expiry',
          labelKey: 'gatorPermissionsExpirationDate',
          testId: 'review-gator-permission-expiration-date',
          getValue: (ctx) => ctx.expiry,
          isVisible: alwaysVisible,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    reviewSummaryAccountSection,
  ],
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PERMISSION_SCHEMAS: PermissionSchemaRegistry = {
  'native-token-periodic': nativeTokenPeriodicSchema,
  'native-token-stream': nativeTokenStreamSchema,
  'erc20-token-periodic': erc20TokenPeriodicSchema,
  'erc20-token-stream': erc20TokenStreamSchema,
  'erc20-token-revocation': erc20TokenRevocationSchema,
};

/**
 * Ensures a permission type is registered in {@link PERMISSION_SCHEMAS}.
 * Call this when the controller can return types the UI registry does not yet implement,
 * so the failure is explicit instead of rendering nothing.
 *
 * @param permissionType - Permission type string from the permission payload
 * @param entry - Result of `PERMISSION_SCHEMAS[permissionType]`
 */
export function assertPermissionSchemaEntry(
  permissionType: string,
  entry: PermissionSchemaEntry | undefined,
): asserts entry is PermissionSchemaEntry {
  if (!entry) {
    throw new Error(`Invalid permission type: ${permissionType}`);
  }
}
