import { isValidHexAddress, type Hex } from '@metamask/utils';
import { mmPayRpcErrors } from './errors';
import type { MmPayRpcParams } from './types';

export function validateMmPayRpcRequest(params: unknown): MmPayRpcParams {
  if (!Array.isArray(params) || params.length !== 1) {
    throw mmPayRpcErrors.invalidParams('params', 'an array with one object');
  }

  const [request] = params;

  if (!isPlainObject(request)) {
    throw mmPayRpcErrors.invalidParams('params[0]', 'an object');
  }

  const { type, from, payParams } = request;

  if (typeof type !== 'string' || type.length === 0) {
    throw mmPayRpcErrors.invalidParams('type', 'a non-empty string');
  }

  if (typeof from !== 'string' || !isValidHexAddress(from as Hex)) {
    throw mmPayRpcErrors.invalidParams('from', 'a hex address');
  }

  return { type, from: from as Hex, payParams };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
