import { validateData } from '../../../../shared/lib/swaps-utils';
import { BridgeAsset, BridgeFlag, Quote, TxData } from '../types';

type Validator<ExpectedResponse, ResponseDataType> = {
  property: keyof ExpectedResponse | string;
  type: string;
  validator: (value: ResponseDataType) => boolean;
};

export const validateResponse = <ExpectedResponse, ResponseDataType = unknown>(
  validators: Validator<ExpectedResponse, ResponseDataType>[],
  data: unknown,
  urlUsed: string,
): data is ExpectedResponse => {
  return validateData(validators, data, urlUsed);
};

export const QUOTE_VALIDATORS = [
  {
    property: 'quote',
    type: 'object',
    validator: (v: unknown): v is Quote =>
      typeof v === 'object' &&
      v !== null &&
      v !== undefined &&
      ['requestId', 'srcTokenAmount', 'destTokenAmount', 'bridgeId'].every(
        (k) => k in v && typeof v[k as keyof typeof v] === 'string',
      ) &&
      ['srcTokenAmount', 'destTokenAmount'].every(
        (k) =>
          k in v &&
          typeof v[k as keyof typeof v] === 'string' &&
          /^\d+$/u.test(v[k as keyof typeof v] as string),
      ) &&
      ['srcAsset', 'destAsset'].every(
        (k) =>
          k in v &&
          typeof v[k as keyof typeof v] === 'object' &&
          'address' in v[k as keyof typeof v] &&
          typeof (v[k as keyof typeof v] as BridgeAsset).address === 'string' &&
          'decimals' in v[k as keyof typeof v] &&
          typeof (v[k as keyof typeof v] as BridgeAsset).decimals === 'number',
      ),
  },
  {
    property: 'approval',
    type: 'object|undefined',
    validator: (v: unknown): v is TxData | undefined =>
      v === undefined ||
      (v
        ? typeof v === 'object' &&
          'gasLimit' in v &&
          typeof v.gasLimit === 'number' &&
          'to' in v &&
          typeof v.to === 'string' &&
          'from' in v &&
          typeof v.from === 'string' &&
          'data' in v &&
          typeof v.data === 'string'
        : false),
  },
  {
    property: 'trade',
    type: 'object',
    validator: (v: unknown): v is TxData =>
      v
        ? typeof v === 'object' &&
          'gasLimit' in v &&
          typeof v.gasLimit === 'number' &&
          'to' in v &&
          typeof v.to === 'string' &&
          'from' in v &&
          typeof v.from === 'string' &&
          'data' in v &&
          typeof v.data === 'string' &&
          'value' in v &&
          typeof v.value === 'string' &&
          v.value.startsWith('0x')
        : false,
  },
  {
    property: 'estimatedProcessingTimeInSeconds',
    type: 'number',
    validator: (v: unknown): v is number[] =>
      Object.values(v as { [s: string]: unknown }).every(
        (i) => typeof i === 'number',
      ),
  },
];

export const FEATURE_FLAG_VALIDATORS = [
  {
    property: BridgeFlag.EXTENSION_SUPPORT,
    type: 'boolean',
    validator: (v: unknown) => typeof v === 'boolean',
  },
  {
    property: BridgeFlag.NETWORK_SRC_ALLOWLIST,
    type: 'object',
    validator: (v: unknown): v is number[] =>
      Object.values(v as { [s: string]: unknown }).every(
        (i) => typeof i === 'number',
      ),
  },
  {
    property: BridgeFlag.NETWORK_DEST_ALLOWLIST,
    type: 'object',
    validator: (v: unknown): v is number[] =>
      Object.values(v as { [s: string]: unknown }).every(
        (i) => typeof i === 'number',
      ),
  },
];
