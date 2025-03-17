import { validateData } from '../../lib/swaps-utils';

type Validator<ExpectedResponse> = {
  property: keyof ExpectedResponse | string;
  type: string;
  validator?: (value: unknown) => boolean;
};

export const validateResponse = <ExpectedResponse>(
  validators: Validator<ExpectedResponse>[],
  data: unknown,
  urlUsed: string,
  logError = true,
): data is ExpectedResponse => {
  return validateData(validators, data, urlUsed, logError);
};

export const isValidNumber = (v: unknown): v is number => typeof v === 'number';
const isValidObject = (v: unknown): v is object =>
  typeof v === 'object' && v !== null;
const isValidString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

export const TOKEN_AGGREGATOR_VALIDATORS = [
  {
    property: 'aggregators',
    type: 'object',
    validator: (v: unknown): v is number[] =>
      isValidObject(v) && Object.values(v).every(isValidString),
  },
];

export const ASSET_VALIDATORS = [
  { property: 'decimals', type: 'number' },
  { property: 'assetId', type: 'string', validator: isValidString },
  {
    property: 'symbol',
    type: 'string',
    validator: (v: unknown) => isValidString(v) && v.length <= 12,
  },
];

export const TOKEN_VALIDATORS = [
  { property: 'decimals', type: 'number' },
  { property: 'address', type: 'string', validator: isValidString },
  {
    property: 'symbol',
    type: 'string',
    validator: (v: unknown) => isValidString(v) && v.length <= 12,
  },
];
