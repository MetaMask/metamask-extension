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

const getData = (ctx: PermissionRenderContext): Record<string, unknown> =>
  ctx.permission.data;

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
      views: ['confirmation', 'reviewDetail'],
    },
    { type: 'account', views: ['confirmation', 'reviewSummary'] },
  ],
};

const permissionInfoSection: SchemaSection = {
  testId: 'confirmation_permission-section',
  elements: [
    { type: 'origin', views: ['confirmation'] },
    {
      type: 'address',
      labelKey: 'recipient',
      getAddress: (ctx) => ctx.to,
      isVisible: (ctx) => Boolean(ctx.to),
      views: ['confirmation'],
    },
    { type: 'network', views: ['confirmation', 'reviewDetail'] },
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
          getValue: (ctx) => new BigNumber(getData(ctx).periodAmount as string),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          getValue: (ctx) => ({
            key: getPeriodFrequencyValueTranslationKey(
              getData(ctx).periodDuration as number,
            ),
          }),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).periodAmount as string),
          views: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData(ctx).periodDuration as number,
            ),
          views: ['confirmation'],
        },
        { type: 'divider', views: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          views: ['confirmation', 'reviewDetail'],
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
                getData(ctx).amountPerSecond as Hex,
                'weekly',
              ),
            ),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
          getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).initialAmount as string),
          isVisible: (ctx) => Boolean(getData(ctx).initialAmount),
          reviewLabelKey: 'gatorPermissionsInitialAllowance',
          reviewTestId: 'review-gator-permission-initial-allowance',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).maxAmount as string),
          isVisible: (ctx) => {
            const max = getData(ctx).maxAmount as string | undefined;
            return Boolean(max && max.toLowerCase() !== MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData(ctx).maxAmount as string | undefined;
            return Boolean(max && max.toLowerCase() === MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          views: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', views: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          views: ['confirmation', 'reviewDetail'],
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
            new BigNumber(getData(ctx).amountPerSecond as string),
          reviewLabelKey: 'gatorPermissionsStreamRate',
          reviewTestId: 'review-gator-permission-stream-rate',
          isRatePerSecond: true,
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).amountPerSecond as string).mul(
              DAY / 1000,
            ),
          views: ['confirmation'],
        },
        {
          type: 'totalExposure',
          getStreamParams: (ctx) => ({
            initialAmount: (getData(ctx).initialAmount as Hex) ?? undefined,
            maxAmount: (getData(ctx).maxAmount as Hex) ?? undefined,
            amountPerSecond: getData(ctx).amountPerSecond as Hex,
            startTime: getData(ctx).startTime as number,
          }),
          views: ['confirmation'],
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
          getValue: (ctx) => new BigNumber(getData(ctx).periodAmount as string),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenPeriodicFrequencyLabel',
          getValue: (ctx) => ({
            key: getPeriodFrequencyValueTranslationKey(
              getData(ctx).periodDuration as number,
            ),
          }),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).periodAmount as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as Hex,
          views: ['confirmation'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData(ctx).periodDuration as number,
            ),
          views: ['confirmation'],
        },
        { type: 'divider', views: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          views: ['confirmation', 'reviewDetail'],
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
                getData(ctx).amountPerSecond as Hex,
                'weekly',
              ),
            ),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'text',
          labelKey: 'gatorPermissionTokenStreamFrequencyLabel',
          getValue: () => ({ key: 'gatorPermissionWeeklyFrequency' }),
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-frequency-label',
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).initialAmount as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as Hex,
          isVisible: (ctx) => Boolean(getData(ctx).initialAmount),
          reviewLabelKey: 'gatorPermissionsInitialAllowance',
          reviewTestId: 'review-gator-permission-initial-allowance',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).maxAmount as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as Hex,
          isVisible: (ctx) => {
            const max = getData(ctx).maxAmount as string | undefined;
            return Boolean(max && max.toLowerCase() !== MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'text',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: () => ({ key: 'unlimited' }),
          isVisible: (ctx) => {
            const max = getData(ctx).maxAmount as string | undefined;
            return Boolean(max && max.toLowerCase() === MAX_UINT256);
          },
          reviewLabelKey: 'gatorPermissionsMaxAllowance',
          reviewTestId: 'review-gator-permission-max-allowance',
          views: ['confirmation', 'reviewDetail'],
        },
        { type: 'divider', views: ['confirmation'] },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
          reviewLabelKey: 'gatorPermissionsStartDate',
          reviewTestId: 'review-gator-permission-start-date',
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          views: ['confirmation', 'reviewDetail'],
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
            new BigNumber(getData(ctx).amountPerSecond as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as Hex,
          reviewLabelKey: 'gatorPermissionsStreamRate',
          reviewTestId: 'review-gator-permission-stream-rate',
          isRatePerSecond: true,
          views: ['confirmation', 'reviewDetail'],
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).amountPerSecond as string).mul(
              DAY / 1000,
            ),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as Hex,
          views: ['confirmation'],
        },
        {
          type: 'totalExposure',
          getStreamParams: (ctx) => ({
            initialAmount: getData(ctx).initialAmount as Hex | undefined,
            maxAmount: getData(ctx).maxAmount as Hex | undefined,
            amountPerSecond: getData(ctx).amountPerSecond as Hex,
            startTime: getData(ctx).startTime as number,
          }),
          views: ['confirmation'],
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
          views: ['reviewSummary'],
          reviewTestId: 'review-gator-permission-amount-label',
        },
        {
          type: 'expiry',
          reviewTestId: 'review-gator-permission-expiration-date',
          views: ['confirmation', 'reviewDetail'],
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
