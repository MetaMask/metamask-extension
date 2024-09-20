const { DEFAULT_FIXTURE_ACCOUNT, ENTRYPOINT } = require('../constants');
const ContractAddressRegistry = require('./contract-address-registry');
const { contractConfiguration, SMART_CONTRACTS } = require('./smart-contracts');

/*
 * Local network seeder is used to seed initial smart contract or set initial blockchain state.
 */
class AnvilSeeder {
  constructor(provider) {
    this.smartContractRegistry = new ContractAddressRegistry();
    this.provider = provider;
  }

  /**
   * Deploy initial smart contracts that can be used later within the e2e tests.
   *
   * @param contractName
   */

  async deploySmartContract(contractName) {
    const { publicClient, testClient, walletClient } = this.provider;
    const fromAddress = (await walletClient.getAddresses())[0];

    const contractConfig = contractConfiguration[contractName];
    const deployArgs = this.getDeployArgs(contractName, contractConfig);

    const hash = await walletClient.deployContract({
      abi: contractConfig.abi,
      account: fromAddress,
      args: deployArgs,
      bytecode: contractConfig.bytecode,
      gasPrice: 2000000000,
    });

    await testClient.mine({
      blocks: 1,
    });

    const receipt = await publicClient.getTransactionReceipt({ hash });

    console.log('Deployed smart contract', {
      contractName,
      contractAddress: receipt.contractAddress,
    });

    if (contractName === SMART_CONTRACTS.NFTS) {
      const transaction = await walletClient.sendTransaction({
        from: fromAddress,
        data: contractConfig.abi.encodeFunctionData('mintNFTs', [1]),
        to: receipt.contractAddress,
      });
      await publicClient.getTransactionReceipt({ hash: transaction.hash });
    }

    if (contractName === SMART_CONTRACTS.ERC1155) {
      const transaction = await walletClient.sendTransaction({
        from: fromAddress,
        data: contractConfig.abi.encodeFunctionData('mintBatch', [
          fromAddress,
          [1, 2, 3],
          [1, 1, 100000000000000],
          '0x',
        ]),
        to: receipt.contractAddress,
      });
      await publicClient.getTransactionReceipt({ hash: transaction.hash });
    }

    this.storeSmartContractAddress(contractName, receipt.contractAddress);
  }

  async transfer(to, value) {
    const { publicClient, walletClient } = this.provider;
    const fromAddress = (await walletClient.getAddresses())[0];

    const transaction = await walletClient.sendTransaction({
      from: fromAddress,
      value,
      to,
    });

    await publicClient.getTransactionReceipt({ hash: transaction.hash });

    console.log('Completed transfer', { to, value });
  }

  async paymasterDeposit(amount) {
    const paymasterAddress = this.smartContractRegistry.getContractAddress(
      SMART_CONTRACTS.VERIFYING_PAYMASTER,
    );

    const { publicClient, walletClient } = this.provider;
    const fromAddress = (await walletClient.getAddresses())[0];

    const transaction = await walletClient.sendTransaction({
      from: fromAddress,
      data: contractConfiguration[
        SMART_CONTRACTS.VERIFYING_PAYMASTER
      ].abi.encodeFunctionData('deposit', []),
      to: paymasterAddress,
      value: amount,
    });

    await publicClient.getTransactionReceipt({ hash: transaction.hash });

    console.log('Completed paymaster deposit', { amount });
  }

  /**
   * Store deployed smart contract address within the environment variables
   * to make it available everywhere.
   *
   * @param contractName
   * @param contractAddress
   */
  storeSmartContractAddress(contractName, contractAddress) {
    this.smartContractRegistry.storeNewContractAddress(
      contractName,
      contractAddress,
    );
  }

  /**
   * Return an instance of the currently used smart contract registry.
   *
   * @returns ContractAddressRegistry
   */
  getContractRegistry() {
    return this.smartContractRegistry;
  }

  getDeployArgs(contractName, contractConfig) {
    if (contractName === SMART_CONTRACTS.HST) {
      return [
        contractConfig.initialAmount,
        contractConfig.tokenName,
        contractConfig.decimalUnits,
        contractConfig.tokenSymbol,
      ];
    } else if (contractName === SMART_CONTRACTS.SIMPLE_ACCOUNT_FACTORY) {
      return [ENTRYPOINT];
    } else if (contractName === SMART_CONTRACTS.VERIFYING_PAYMASTER) {
      return [ENTRYPOINT, DEFAULT_FIXTURE_ACCOUNT];
    }
    return [];
  }
}

module.exports = AnvilSeeder;
