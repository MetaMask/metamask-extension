const { readAddressAsContract } = require('./contract-utils');

describe('Contract Utils', () => {
  it('checks is an address is a contract address or not', async () => {
    let mockEthQuery = {
      getCode: (_, cb) => {
        cb(null, '0xa');
      },
    };
    const { isContractAddress } = await readAddressAsContract(
      mockEthQuery,
      '0x76B4aa9Fc4d351a0062c6af8d186DF959D564A84',
    );
    expect(isContractAddress).toStrictEqual(true);

    mockEthQuery = {
      getCode: (_, cb) => {
        cb(null, '0x');
      },
    };

    const { isContractAddress: isNotContractAddress } =
      await readAddressAsContract(
        mockEthQuery,
        '0x76B4aa9Fc4d351a0062c6af8d186DF959D564A84',
      );
    expect(isNotContractAddress).toStrictEqual(false);
  });
});
