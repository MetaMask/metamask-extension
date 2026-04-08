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
// ---------------------------------------------------------------------------

const justificationSection: SchemaSection = {
  testId: 'confirmation_justification-section',
  elements: [
    {
      type: 'justification',
      visible: (ctx) => Boolean(ctx.permission.justification),
    },
    { type: 'account' },
  ],
};

const permissionInfoSection: SchemaSection = {
  testId: 'confirmation_permission-section',
  elements: [
    { type: 'origin' },
    {
      type: 'address',
      labelKey: 'recipient',
      getAddress: (ctx) => ctx.to,
      visible: (ctx) => Boolean(ctx.to),
    },
    { type: 'network' },
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
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).periodAmount as string),
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData(ctx).periodDuration as number,
            ),
        },
        { type: 'divider' },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
        },
        { type: 'expiry' },
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
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).initialAmount as string),
          visible: (ctx) => Boolean(getData(ctx).initialAmount),
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).maxAmount as string),
          visible: (ctx) => {
            const max = getData(ctx).maxAmount as string | undefined;
            return Boolean(max && max.toLowerCase() !== MAX_UINT256);
          },
        },
        { type: 'divider' },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
        },
        { type: 'expiry' },
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
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).amountPerSecond as string).mul(
              DAY / 1000,
            ),
        },
        {
          type: 'totalExposure',
          getStreamParams: (ctx) => ({
            initialAmount: (getData(ctx).initialAmount as Hex) ?? undefined,
            maxAmount: (getData(ctx).maxAmount as Hex) ?? undefined,
            amountPerSecond: getData(ctx).amountPerSecond as Hex,
            startTime: getData(ctx).startTime as number,
          }),
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
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).periodAmount as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPermissionPeriodDuration(
              getData(ctx).periodDuration as number,
            ),
        },
        { type: 'divider' },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
        },
        { type: 'expiry' },
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
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).initialAmount as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
          visible: (ctx) => Boolean(getData(ctx).initialAmount),
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => new BigNumber(getData(ctx).maxAmount as string),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
          visible: (ctx) => {
            const max = getData(ctx).maxAmount as string | undefined;
            return Boolean(max && max.toLowerCase() !== MAX_UINT256);
          },
        },
        { type: 'divider' },
        {
          type: 'date',
          labelKey: 'confirmFieldStartDate',
          getTimestamp: (ctx) => getData(ctx).startTime as number,
        },
        { type: 'expiry' },
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
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
        },
        {
          type: 'amount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).amountPerSecond as string).mul(
              DAY / 1000,
            ),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
        },
        {
          type: 'totalExposure',
          getStreamParams: (ctx) => ({
            initialAmount: getData(ctx).initialAmount as Hex | undefined,
            maxAmount: getData(ctx).maxAmount as Hex | undefined,
            amountPerSecond: getData(ctx).amountPerSecond as Hex,
            startTime: getData(ctx).startTime as number,
          }),
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
      elements: [{ type: 'expiry' }],
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
