type contract = {
  contractCode: string | null;
  isContractAddress: boolean;
};

export const readAddressAsContract = async (
  ethQuery: {
    getCode: (address: string) => string;
  },
  address: string,
): Promise<contract> => {
  let contractCode;
  try {
    contractCode = await ethQuery.getCode(address);
  } catch (e) {
    contractCode = null;
  }

  const isContractAddress = contractCode
    ? contractCode !== '0x' && contractCode !== '0x0'
    : false;
  return { contractCode, isContractAddress };
};
