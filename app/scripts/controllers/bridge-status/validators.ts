import { truthyString, validateData } from '../../../../shared/lib/swaps-utils';
import {
  BridgeId,
  DestChainStatus,
  SrcChainStatus,
  Asset,
  StatusTypes,
} from '../../../../shared/types/bridge-status';
import { BRIDGE_STATUS_BASE_URL } from './constants';

type Validator<ExpectedResponse, DataToValidate> = {
  property: keyof ExpectedResponse | string;
  type: string;
  validator: (value: DataToValidate) => boolean;
};

export const validateResponse = <ExpectedResponse, DataToValidate>(
  validators: Validator<ExpectedResponse, DataToValidate>[],
  data: unknown,
  urlUsed: string,
): data is ExpectedResponse => {
  if (data === null || data === undefined) {
    return false;
  }
  return validateData(validators, data, urlUsed);
};

const assetValidators = [
  {
    property: 'chainId',
    type: 'number',
    validator: (v: unknown): v is number => typeof v === 'number',
  },
  {
    property: 'address',
    type: 'string',
    validator: (v: unknown): v is string => truthyString(v as string),
  },
  {
    property: 'symbol',
    type: 'string',
    validator: (v: unknown): v is string => typeof v === 'string',
  },
  {
    property: 'name',
    type: 'string',
    validator: (v: unknown): v is string => typeof v === 'string',
  },
  {
    property: 'decimals',
    type: 'number',
    validator: (v: unknown): v is number => typeof v === 'number',
  },
  {
    property: 'icon',
    // typeof null === 'object'
    type: 'string|undefined|object',
    validator: (v: unknown): v is string | undefined | object =>
      v === undefined || v === null || typeof v === 'string',
  },
];

const assetValidator = (v: unknown): v is Asset =>
  validateResponse<Asset, unknown>(assetValidators, v, BRIDGE_STATUS_BASE_URL);

const srcChainStatusValidators = [
  {
    property: 'chainId',
    // For some reason, API returns destChain.chainId as a string, it's a number everywhere else
    type: 'number|string',
    validator: (v: unknown): v is number | string =>
      typeof v === 'number' || typeof v === 'string',
  },
  {
    property: 'txHash',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'amount',
    type: 'string|undefined',
    validator: (v: unknown): v is string | undefined =>
      v === undefined || typeof v === 'string',
  },
  {
    property: 'token',
    type: 'object|undefined',
    validator: (v: unknown): v is object | undefined =>
      v === undefined ||
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (v && typeof v === 'object' && Object.keys(v).length === 0) ||
      assetValidator(v),
  },
];

const srcChainStatusValidator = (v: unknown): v is SrcChainStatus =>
  validateResponse<SrcChainStatus, unknown>(
    srcChainStatusValidators,
    v,
    BRIDGE_STATUS_BASE_URL,
  );

const destChainStatusValidators = [
  {
    property: 'chainId',
    // For some reason, API returns destChain.chainId as a string, it's a number everywhere else
    type: 'number|string',
    validator: (v: unknown): v is number | string =>
      typeof v === 'number' || typeof v === 'string',
  },
  {
    property: 'amount',
    type: 'string|undefined',
    validator: (v: unknown): v is string | undefined =>
      v === undefined || typeof v === 'string',
  },
  {
    property: 'txHash',
    type: 'string|undefined',
    validator: (v: unknown): v is string | undefined =>
      v === undefined || typeof v === 'string',
  },
  {
    property: 'token',
    type: 'object|undefined',
    validator: (v: unknown): v is Asset | undefined =>
      v === undefined ||
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      (v && typeof v === 'object' && Object.keys(v).length === 0) ||
      assetValidator(v),
  },
];

const destChainStatusValidator = (v: unknown): v is DestChainStatus =>
  validateResponse<DestChainStatus, unknown>(
    destChainStatusValidators,
    v,
    BRIDGE_STATUS_BASE_URL,
  );

export const validators = [
  {
    property: 'status',
    type: 'string',
    validator: (v: unknown): v is StatusTypes =>
      Object.values(StatusTypes).includes(v as StatusTypes),
  },
  {
    property: 'srcChain',
    type: 'object',
    validator: srcChainStatusValidator,
  },
  {
    property: 'destChain',
    type: 'object|undefined',
    validator: (v: unknown): v is object | unknown =>
      v === undefined || destChainStatusValidator(v),
  },
  {
    property: 'bridge',
    type: 'string|undefined',
    validator: (v: unknown): v is BridgeId | undefined =>
      v === undefined || typeof v === 'string',
  },
  {
    property: 'isExpectedToken',
    type: 'boolean|undefined',
    validator: (v: unknown): v is boolean | undefined =>
      v === undefined || typeof v === 'boolean',
  },
  {
    property: 'isUnrecognizedRouterAddress',
    type: 'boolean|undefined',
    validator: (v: unknown): v is boolean | undefined =>
      v === undefined || typeof v === 'boolean',
  },
  // TODO: add refuel validator
  // {
  //   property: 'refuel',
  //   type: 'object',
  //   validator: (v: unknown) => Object.values(RefuelStatusResponse).includes(v),
  // },
];
