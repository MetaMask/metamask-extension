import { validHex, validateData } from '../../../../shared/lib/swaps-utils';
import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';
import { Asset, BridgeId, ChainStatus, StatusTypes } from './types';

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
    validator: (v: unknown): v is string => isValidHexAddress(v as string),
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
    type: 'string|undefined',
    validator: (v: unknown): v is string | undefined =>
      typeof v === 'string' || v === undefined,
  },
];

const assetValidator = (v: unknown): v is Asset =>
  validateResponse<Asset, unknown>(assetValidators, v, 'dummyurl.com');

const chainStatusValidators = [
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
    validator: validHex,
  },
  {
    property: 'amount',
    type: 'string|undefined',
    validator: (v: unknown): v is string | undefined =>
      typeof v === 'string' || v === undefined,
  },
  {
    property: 'token',
    type: 'object|undefined',
    validator: assetValidator,
  },
];

const chainStatusValidator = (v: unknown): v is ChainStatus =>
  validateResponse<ChainStatus, unknown>(
    chainStatusValidators,
    v,
    'dummyurl.com',
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
    validator: chainStatusValidator,
  },
  {
    property: 'destChain',
    type: 'object',
    validator: chainStatusValidator,
  },
  {
    property: 'bridge',
    type: 'string',
    validator: (v: unknown): v is BridgeId =>
      Object.values(BridgeId).includes(v as BridgeId),
  },
  {
    property: 'isExpectedToken',
    type: 'boolean|undefined',
    validator: (v: unknown): v is boolean | undefined =>
      typeof v === 'boolean' || v === undefined,
  },
  {
    property: 'isUnrecognizedRouterAddress',
    type: 'boolean|undefined',
    validator: (v: unknown): v is boolean | undefined =>
      typeof v === 'boolean' || v === undefined,
  },
  // TODO: add refuel validator
  // {
  //   property: 'refuel',
  //   type: 'object',
  //   validator: (v: unknown) => Object.values(RefuelStatusResponse).includes(v),
  // },
];
