import type { Hex } from '@metamask/utils';
import { isStrictHexString } from '@metamask/utils';
import {
  decimalToHex,
  hexToDecimal,
} from '../../../../../shared/lib/conversion.utils';
import { jsonRpcRequest } from '../../../../../shared/lib/rpc.utils';

type ValidateRpcUrlOptions = {
  url: string;
  expectedChainId?: string;
  t: (key: string, substitutions?: string[]) => string;
};

export async function validateRpcUrlChainId({
  url,
  expectedChainId,
  t,
}: ValidateRpcUrlOptions): Promise<string | undefined> {
  const expectedChainIdHex = toHex(expectedChainId);

  if (!expectedChainIdHex) {
    return undefined;
  }

  try {
    const fetchedChainId = (await jsonRpcRequest(
      url,
      'eth_chainId',
    )) as string;

    if (fetchedChainId.toLowerCase() !== expectedChainIdHex.toLowerCase()) {
      return t('endpointReturnedDifferentChainId', [
        hexToDecimal(fetchedChainId),
      ]);
    }

    return undefined;
  } catch {
    return t('failedToFetchChainId');
  }
}

function toHex(value?: string): Hex | undefined {
  if (!value) {
    return undefined;
  }

  if (isStrictHexString(value)) {
    return value;
  }

  if (/^\d+$/u.test(value)) {
    return `0x${decimalToHex(value)}`;
  }

  return undefined;
}
