import pify from 'pify';
import type EthQuery from '@metamask/eth-query';

export type Contract = {
  contractCode: string | null;
  isContractAddress: boolean;
};

export const readAddressAsContract = async (
  ethQuery: EthQuery,
  address: string,
): Promise<Contract> => {
  let contractCode: string | null = null;
  try {
    if (ethQuery && 'getCode' in ethQuery) {
      contractCode = await pify(ethQuery.getCode.bind(ethQuery))(address);
    }
  } catch (err) {
    // TODO(@dbrans): Dangerous to swallow errors here.
    contractCode = null;
  }
  const isContractAddress = contractCode
    ? contractCode !== '0x' && contractCode !== '0x0'
    : false;
  return { contractCode, isContractAddress };
};
