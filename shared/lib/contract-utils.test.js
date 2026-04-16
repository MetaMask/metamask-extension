import { createTestProviderTools } from '../../test/stub/provider';

const { readAddressAsContract } = require('./contract-utils');

describe('Contract Utils', () => {
  it('checks is an address is a contract address or not', async () => {
    let mockProvider = createTestProviderTools({
      scaffold: {
        eth_getCode: '0xa',
      },
    }).provider;
    const { isContractAddress } = await readAddressAsContract(
      mockProvider,
      '0x76B4aa9Fc4d351a0062c6af8d186DF959D564A84',
    );
    expect(isContractAddress).toStrictEqual(true);

    mockProvider = createTestProviderTools({
      scaffold: {
        eth_getCode: '0x',
      },
    }).provider;

    const { isContractAddress: isNotContractAddress } =
      await readAddressAsContract(
        mockProvider,
        '0x76B4aa9Fc4d351a0062c6af8d186DF959D564A84',
      );
    expect(isNotContractAddress).toStrictEqual(false);
  });
});
