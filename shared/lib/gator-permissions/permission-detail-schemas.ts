import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';

import { DAY } from '../../constants/time';
import { formatPermissionPeriodDuration } from './format-permission-period-duration';
import { MAX_UINT256 } from './permission-constants';
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

const requireStartTime = (permission: {
  data: Record<string, unknown>;
}): void => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }
};

// ---------------------------------------------------------------------------
// Common sections — shared across all permission types
// These are confirmation-only; the review page renders them with custom UI.
// ---------------------------------------------------------------------------

const justificationSection: SchemaSection = {
  testId: 'confirmation_justification-section',
  elements: [
    {
      type: 'justification',
      isVisible: (ctx) => Boolean(ctx.permission.justification),
      includeInViews: ['confirmation', 'reviewDetail'],
    },
    { type: 'account', includeInViews: ['confirmation', 'reviewSummary'] },
  ],
};

const permissionInfoSection: SchemaSection = {
  testId: 'confirmation_permission-section',
  elements: [
    { type: 'origin', includeInViews: ['confirmation'] },
    {
      type: 'address',
      labelKey: 'recipient',
      getAddress: (ctx) => ctx.to,
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
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'periodAmount')),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          getValue: (ctx) => ({
            key: getPeriodFrequencyValueTranslationKey(
              getData<number>(ctx, 'periodDuration'),
            ),
          }),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'periodAmount')),
          includeInViews: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData<number>(ctx, 'periodDuration'),
            ),
          includeInViews: ['confirmation'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData<number>(ctx, 'startTime'),
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
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
          getValue: (ctx) =>
            new BigNumber(
              convertAmountPerSecondToAmountPerPeriod(
                getData<Hex>(ctx, 'amountPerSecond'),
                'weekly',
              ),
            ),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
          getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'initialAmount')),
          isVisible: (ctx) => Boolean(getData(ctx, 'initialAmount')),
          reviewLabelKey: 'gatorPermissionsInitialAllowance',
          reviewTestId: 'review-gator-permission-initial-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => new BigNumber(getData<string>(ctx, 'maxAmount')),
          isVisible: (ctx) => {
            const max = getData<string | undefined>(ctx, 'maxAmount');
            return Boolean(max && max.toLowerCase() !== MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData<string | undefined>(ctx, 'maxAmount');
            return Boolean(max && max.toLowerCase() === MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData<string | undefined>(ctx, 'maxAmount');
            return Boolean(max && max.toLowerCase() === MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData<number>(ctx, 'startTime'),
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    {
      testId: 'native-token-stream-stream-rate-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'confirmFieldStreamRate',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'amountPerSecond')),
          reviewLabelKey: 'gatorPermissionsStreamRate',
          reviewTestId: 'review-gator-permission-stream-rate',
          isRatePerSecond: true,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'amountPerSecond')).mul(
              DAY / 1000,
            ),
          includeInViews: ['confirmation'],
        },
        {
          type: 'totalExposure',
          getStreamParams: (ctx) => ({
            initialAmount: getData<Hex>(ctx, 'initialAmount'),
            maxAmount: getData<Hex>(ctx, 'maxAmount'),
            amountPerSecond: getData<Hex>(ctx, 'amountPerSecond'),
            startTime: getData<number>(ctx, 'startTime'),
          }),
          includeInViews: ['confirmation'],
        },
      ],
    },
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
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'periodAmount')),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          getValue: (ctx) => ({
            key: getPeriodFrequencyValueTranslationKey(
              getData<number>(ctx, 'periodDuration'),
            ),
          }),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'periodAmount')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          includeInViews: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData<number>(ctx, 'periodDuration'),
            ),
          includeInViews: ['confirmation'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData<number>(ctx, 'startTime'),
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
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
          getValue: (ctx) =>
            new BigNumber(
              convertAmountPerSecondToAmountPerPeriod(
                getData<Hex>(ctx, 'amountPerSecond'),
                'weekly',
              ),
            ),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
          getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'initialAmount')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: (ctx) => Boolean(getData(ctx, 'initialAmount')),
          reviewLabelKey: 'gatorPermissionsInitialAllowance',
          reviewTestId: 'review-gator-permission-initial-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => new BigNumber(getData<string>(ctx, 'maxAmount')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          isVisible: (ctx) => {
            const max = getData<string | undefined>(ctx, 'maxAmount');
            return Boolean(max && max.toLowerCase() !== MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData<string | undefined>(ctx, 'maxAmount');
            return Boolean(max && max.toLowerCase() === MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', includeInViews: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData<number>(ctx, 'startTime'),
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
    {
      testId: 'erc20-token-stream-stream-rate-section',
      elements: [
        {
          type: 'amount',
          labelKey: 'confirmFieldStreamRate',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'amountPerSecond')),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          reviewLabelKey: 'gatorPermissionsStreamRate',
          reviewTestId: 'review-gator-permission-stream-rate',
          isRatePerSecond: true,
          includeInViews: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData<string>(ctx, 'amountPerSecond')).mul(
              DAY / 1000,
            ),
          getTokenAddress: (ctx) => getData<Hex>(ctx, 'tokenAddress'),
          includeInViews: ['confirmation'],
        },
        {
          type: 'totalExposure',
          getStreamParams: (ctx) => ({
            initialAmount: getData<Hex>(ctx, 'initialAmount'),
            maxAmount: getData<Hex>(ctx, 'maxAmount'),
            amountPerSecond: getData<Hex>(ctx, 'amountPerSecond'),
            startTime: getData<number>(ctx, 'startTime'),
          }),
          includeInViews: ['confirmation'],
        },
      ],
    },
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
          getValue: () => ({ key: 'allTokens' }),
          includeInViews: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          includeInViews: ['confirmation', 'reviewDetail'],
        },
      ],
    },
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
