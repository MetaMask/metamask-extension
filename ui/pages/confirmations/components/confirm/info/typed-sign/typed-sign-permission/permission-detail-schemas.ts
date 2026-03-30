import { BigNumber } from 'bignumber.js';
import type { Hex } from '@metamask/utils';
import { DAY } from '../../../../../../../../shared/constants/time';
import {
  formatPeriodDuration,
  MAX_UINT256,
} from './typed-sign-permission-util';
import type {
  PermissionContext,
  PermissionSchemaEntry,
  PermissionSchemaRegistry,
} from './permission-detail-schema.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getData = (ctx: PermissionContext): Record<string, unknown> =>
  ctx.permission.data;

const requireStartTime = (permission: {
  data: Record<string, unknown>;
}): void => {
  if (!permission.data.startTime) {
    throw new Error('Start time is required');
  }
};

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

const nativeTokenPeriodicSchema: PermissionSchemaEntry = {
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    {
      testId: 'native-token-periodic-details-section',
      elements: [
        {
          type: 'nativeAmount',
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) => getData(ctx).periodAmount as Hex,
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPeriodDuration(ctx.t, getData(ctx).periodDuration as number),
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
  tokenResolution: { kind: 'native' },
  validate: requireStartTime,
  sections: [
    {
      testId: 'native-token-stream-details-section',
      elements: [
        {
          type: 'nativeAmount',
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) => getData(ctx).initialAmount as Hex,
          visible: (ctx) => Boolean(getData(ctx).initialAmount),
        },
        {
          type: 'nativeAmount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => getData(ctx).maxAmount as Hex,
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
          type: 'nativeAmount',
          labelKey: 'confirmFieldStreamRate',
          getValue: (ctx) => getData(ctx).amountPerSecond as Hex,
        },
        {
          type: 'nativeAmount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).amountPerSecond as string).mul(
              DAY / 1000,
            ),
        },
        {
          type: 'totalExposure',
          variant: 'native',
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
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (p) => p.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    {
      testId: 'erc20-token-periodic-details-section',
      elements: [
        {
          type: 'tokenAmount',
          labelKey: 'confirmFieldAllowance',
          getValue: (ctx) => getData(ctx).periodAmount as Hex,
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
        },
        {
          type: 'text',
          labelKey: 'confirmFieldFrequency',
          getValue: (ctx) =>
            formatPeriodDuration(ctx.t, getData(ctx).periodDuration as number),
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
  tokenResolution: {
    kind: 'erc20',
    getTokenAddress: (p) => p.data.tokenAddress as string,
  },
  validate: requireStartTime,
  sections: [
    {
      testId: 'erc20-token-stream-details-section',
      elements: [
        {
          type: 'tokenAmount',
          labelKey: 'confirmFieldInitialAllowance',
          getValue: (ctx) => getData(ctx).initialAmount as Hex,
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
          visible: (ctx) => Boolean(getData(ctx).initialAmount),
        },
        {
          type: 'tokenAmount',
          labelKey: 'confirmFieldMaxAllowance',
          getValue: (ctx) => getData(ctx).maxAmount as Hex,
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
          type: 'tokenAmount',
          labelKey: 'confirmFieldStreamRate',
          getValue: (ctx) => getData(ctx).amountPerSecond as Hex,
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
        },
        {
          type: 'tokenAmount',
          labelKey: 'confirmFieldAvailablePerDay',
          getValue: (ctx) =>
            new BigNumber(getData(ctx).amountPerSecond as string).mul(
              DAY / 1000,
            ),
          getTokenAddress: (ctx) => getData(ctx).tokenAddress as string,
        },
        {
          type: 'totalExposure',
          variant: 'erc20',
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
  tokenResolution: { kind: 'none' },
  sections: [
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
