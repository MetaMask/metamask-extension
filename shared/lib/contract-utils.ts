import type { Provider } from '@metamask/network-controller';
import { addHexPrefix, padToEven } from 'ethereumjs-util';
import type { JsonRpcParams } from '@metamask/utils';

export type Contract = {
  contractCode: string | null;
  isContractAddress: boolean;
};

export const readAddressAsContract = async (
  provider: Provider,
  address: string,
): Promise<Contract> => {
  let contractCode: string | null = null;
  try {
    const result = await provider.request<JsonRpcParams, string>({
      method: 'eth_getCode',
      params: [address, 'latest'],
    });
    contractCode = addHexPrefix(padToEven(result.slice(2)));
  } catch (err) {
    // TODO(@dbrans): Dangerous to swallow errors here.
    contractCode = null;
  }
  const isContractAddress = contractCode
    ? contractCode !== '0x' && contractCode !== '0x0'
    : false;
  return { contractCode, isContractAddress };
};
