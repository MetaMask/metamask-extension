export const addressIsContract = async (ethQuery, address) => {
  let code;
  try {
    code = await ethQuery.getCode(address);
  } catch (e) {
    code = null;
  }

  const isContractAddress = !(!code || code === '0x' || code === '0x0');
  return { code, isContractAddress };
};
