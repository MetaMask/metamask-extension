import { isStrictHexString } from '@metamask/utils';
import { isValidHexAddress as isValidHexAddress_ } from '@metamask/controller-utils';
import {
  truthyDigitString,
  validateData,
} from '../../../../shared/lib/swaps-utils';
import { BridgeFlag, FeatureFlagResponse } from '../types';

type Validator<ExpectedResponse> = {
  property: keyof ExpectedResponse | string;
  type: string;
  validator?: (value: unknown) => boolean;
};

export const validateResponse = <ExpectedResponse>(
  validators: Validator<ExpectedResponse>[],
  data: unknown,
  urlUsed: string,
): data is ExpectedResponse => {
  return validateData(validators, data, urlUsed);
};

export const isValidNumber = (v: unknown): v is number => typeof v === 'number';
const isValidObject = (v: unknown): v is object =>
  typeof v === 'object' && v !== null;
const isValidString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;
const isValidHexAddress = (v: unknown) =>
  isValidString(v) && isValidHexAddress_(v, { allowNonPrefixed: false });

export const FEATURE_FLAG_VALIDATORS = [
  {
    property: BridgeFlag.EXTENSION_CONFIG,
    type: 'object',
    validator: (
      v: unknown,
    ): v is Pick<FeatureFlagResponse, BridgeFlag.EXTENSION_CONFIG> =>
      isValidObject(v) &&
      'refreshRate' in v &&
      isValidNumber(v.refreshRate) &&
      'maxRefreshCount' in v &&
      isValidNumber(v.maxRefreshCount),
  },
  { property: BridgeFlag.EXTENSION_SUPPORT, type: 'boolean' },
  {
    property: BridgeFlag.NETWORK_SRC_ALLOWLIST,
    type: 'object',
    validator: (v: unknown): v is number[] =>
      isValidObject(v) && Object.values(v).every(isValidNumber),
  },
  {
    property: BridgeFlag.NETWORK_DEST_ALLOWLIST,
    type: 'object',
    validator: (v: unknown): v is number[] =>
      isValidObject(v) && Object.values(v).every(isValidNumber),
  },
];

export const TOKEN_AGGREGATOR_VALIDATORS = [
  {
    property: 'aggregators',
    type: 'object',
    validator: (v: unknown): v is number[] =>
      isValidObject(v) && Object.values(v).every(isValidString),
  },
];

export const TOKEN_VALIDATORS = [
  { property: 'decimals', type: 'number' },
  { property: 'address', type: 'string', validator: isValidHexAddress },
  {
    property: 'symbol',
    type: 'string',
    validator: (v: unknown) => isValidString(v) && v.length <= 12,
  },
];

export const QUOTE_RESPONSE_VALIDATORS = [
  { property: 'quote', type: 'object', validator: isValidObject },
  { property: 'estimatedProcessingTimeInSeconds', type: 'number' },
  {
    property: 'approval',
    type: 'object|undefined',
    validator: (v: unknown) => v === undefined || isValidObject(v),
  },
  { property: 'trade', type: 'object', validator: isValidObject },
];

export const QUOTE_VALIDATORS = [
  { property: 'requestId', type: 'string' },
  { property: 'srcTokenAmount', type: 'string' },
  { property: 'destTokenAmount', type: 'string' },
  { property: 'bridgeId', type: 'string' },
  { property: 'bridges', type: 'object', validator: isValidObject },
  { property: 'srcChainId', type: 'number' },
  { property: 'destChainId', type: 'number' },
  { property: 'srcAsset', type: 'object', validator: isValidObject },
  { property: 'destAsset', type: 'object', validator: isValidObject },
  { property: 'feeData', type: 'object', validator: isValidObject },
];

export const FEE_DATA_VALIDATORS = [
  { property: 'amount', type: 'string', validator: truthyDigitString },
  { property: 'asset', type: 'object', validator: isValidObject },
];

export const TX_DATA_VALIDATORS = [
  { property: 'chainId', type: 'number' },
  { property: 'value', type: 'string', validator: isStrictHexString },
  { property: 'gasLimit', type: 'number' },
  { property: 'to', type: 'string', validator: isValidHexAddress },
  { property: 'from', type: 'string', validator: isValidHexAddress },
  { property: 'data', type: 'string', validator: isStrictHexString },
];
