export const readAddressAsContract = async (ethQuery, address) => {
  let contractCode;
  try {
    contractCode = await ethQuery.getCode(address);
  } catch (e) {
    contractCode = null;
  }

  const isContractAddress =
    contractCode && contractCode !== '0x' && contractCode !== '0x0';
  return { contractCode, isContractAddress };
};
