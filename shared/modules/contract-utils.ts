import pify from 'pify';

export type Contract = {
  contractCode: string | null;
  isContractAddress: boolean;
};

// Note(@dbrans): This is a simplified version of the 'EthQuery' interface specific to this file.
type EthQueryWithGetCode = {
  getCode: (
    address: string,
    cb: (err: Error, contractCode: string) => void,
  ) => void;
};

export const readAddressAsContract = async (
  ethQuery: EthQueryWithGetCode,
  address: string,
): Promise<Contract> => {
  let contractCode: string | null;
  try {
    contractCode = await pify(ethQuery.getCode.bind(ethQuery))(address);
  } catch (err) {
    // TODO(@dbrans): Dangerous to swallow errors here.
    contractCode = null;
  }
  const isContractAddress = contractCode
    ? contractCode !== '0x' && contractCode !== '0x0'
    : false;
  return { contractCode, isContractAddress };
};
