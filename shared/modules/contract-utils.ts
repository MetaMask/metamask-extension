import pify from 'pify';

export type Contract = {
  contractCode: string | null;
  isContractAddress: boolean;
};

// Note(@dbrans): This is a simplified version of the EthQuery interface specific to this file.
type EthQuery = {
  getCode: (
    address: string,
    cb: (err: Error, contractCode: string) => void,
  ) => void;
};

export const readAddressAsContract = async (
  ethQuery: EthQuery,
  address: string,
): Promise<Contract> => {
  const contractCode = await pify(ethQuery.getCode.bind(ethQuery))(address);
  const isContractAddress = contractCode
    ? contractCode !== '0x' && contractCode !== '0x0'
    : false;
  return { contractCode, isContractAddress };
};
