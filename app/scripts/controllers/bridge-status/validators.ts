import { validHex } from '../../../../shared/lib/swaps-utils';
import { isValidHexAddress } from '../../../../shared/modules/hexstring-utils';
import { Asset, BridgeId, ChainStatus, StatusTypes } from './types';

const assetValidator = (v: unknown): v is Asset =>
  typeof v === 'object' &&
  v !== null &&
  'chainId' in v &&
  typeof v.chainId === 'number' &&
  'address' in v &&
  typeof v.address === 'string' &&
  isValidHexAddress(v.address) &&
  'symbol' in v &&
  typeof v.symbol === 'string' &&
  'name' in v &&
  typeof v.name === 'string' &&
  'decimals' in v &&
  typeof v.decimals === 'number' &&
  (!('icon' in v) || v.icon === undefined || typeof v.icon === 'string');

const chainStatusValidator = (v: unknown): v is ChainStatus =>
  typeof v === 'object' &&
  v !== null &&
  'chainId' in v &&
  typeof v.chainId === 'number' &&
  'txHash' in v &&
  validHex(v.txHash) &&
  (!('amount' in v) ||
    v.amount === undefined ||
    typeof v.amount === 'string') &&
  (!('token' in v) || v.token === undefined || assetValidator(v.token));

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
    type: 'boolean',
    validator: (v: unknown) => typeof v === 'boolean',
  },
  {
    property: 'isUnrecognizedRouterAddress',
    type: 'boolean',
    validator: (v: unknown) => typeof v === 'boolean',
  },
  // {
  //   property: 'refuel',
  //   type: 'object',
  //   validator: (v: unknown) => Object.values(RefuelStatusResponse).includes(v),
  // },
];
