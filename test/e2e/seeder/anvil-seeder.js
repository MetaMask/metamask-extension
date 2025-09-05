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

  async deploySmartContract(contractName, hardfork) {
    const { publicClient, testClient, walletClient } = this.provider;
    const fromAddress = (await walletClient.getAddresses())[0];

    const contractConfig = contractConfiguration[contractName];
    const deployArgs = this.getDeployArgs(contractName, contractConfig);

    const deployOptions = {
      abi: contractConfig.abi,
      account: fromAddress,
      args: deployArgs,
      bytecode: contractConfig.bytecode,
    };

    // Add gasPrice if hardfork is muirGlacier to indicate it's a legacy tx
    if (hardfork === 'muirGlacier') {
      deployOptions.gasPrice = 20000;
    }

    const hash = await walletClient.deployContract(deployOptions);

    await testClient.mine({
      blocks: 1,
    });

    const receipt = await publicClient.getTransactionReceipt({ hash });

    console.log('Deployed smart contract', {
      contractName,
      contractAddress: receipt.contractAddress,
    });

    if (contractName === SMART_CONTRACTS.NFTS) {
      const mintOptions = {
        address: receipt.contractAddress,
        abi: contractConfig.abi,
        functionName: 'mintNFTs',
        args: [1],
        account: fromAddress,
      };

      // Add gasPrice if hardfork is muirGlacier to indicate it's a legacy tx
      if (hardfork === 'muirGlacier') {
        mintOptions.gasPrice = 20000;
      }

      await walletClient.writeContract(mintOptions);
    }

    if (contractName === SMART_CONTRACTS.ERC1155) {
      const mintBatchOptions = {
        address: receipt.contractAddress,
        abi: contractConfig.abi,
        functionName: 'mintBatch',
        args: [fromAddress, [1, 2, 3], [1, 1, 100000000000000], '0x'],
        account: fromAddress,
      };

      // Add gasPrice if hardfork is muirGlacier to indicate it's a legacy tx
      if (hardfork === 'muirGlacier') {
        mintBatchOptions.gasPrice = 20000;
      }

      await walletClient.writeContract(mintBatchOptions);
    }

    this.storeSmartContractAddress(contractName, receipt.contractAddress);
  }

  async transfer(to, value) {
    const { publicClient, walletClient, testClient } = this.provider;
    const fromAddress = (await walletClient.getAddresses())[0];

    const transaction = await walletClient.sendTransaction({
      account: fromAddress,
      value,
      to,
    });
    await testClient.mine({
      blocks: 1,
    });

    await publicClient.getTransactionReceipt({ hash: transaction });

    console.log('Completed transfer', { to, value });
  }

  async paymasterDeposit(amount) {
    const paymasterAddress = this.smartContractRegistry.getContractAddress(
      SMART_CONTRACTS.VERIFYING_PAYMASTER,
    );

    const { publicClient, walletClient, testClient } = this.provider;
    const fromAddress = (await walletClient.getAddresses())[0];

    const transaction = await walletClient.writeContract({
      account: fromAddress,
      abi: contractConfiguration[SMART_CONTRACTS.VERIFYING_PAYMASTER].abi,
      functionName: 'deposit',
      address: paymasterAddress,
      value: amount,
    });

    await testClient.mine({
      blocks: 1,
    });

    await publicClient.getTransactionReceipt({ hash: transaction });

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
