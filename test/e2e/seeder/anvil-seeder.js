const { privateKeyToAccount } = require('viem/accounts');
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
   * @param hardfork
   * @param deployerOptions - Optional deployer configuration object:
   *   - { fromAddress?: string, fromPrivateKey?: string }
   */

  async deploySmartContract(contractName, hardfork, deployerOptions) {
    const { publicClient, testClient, walletClient } = this.provider;

    let fromAddress;

    // Determine deployment type
    let deploymentType;
    if (!deployerOptions) {
      deploymentType = 'default';
    } else if (deployerOptions.fromPrivateKey) {
      deploymentType = 'fromPrivateKey';
    } else if (deployerOptions.fromAddress) {
      deploymentType = 'fromAddress';
    } else {
      deploymentType = 'invalid';
    }

    switch (deploymentType) {
      case 'default':
        fromAddress = (await walletClient.getAddresses())[0];
        break;

      case 'fromPrivateKey':
        fromAddress = privateKeyToAccount(deployerOptions.fromPrivateKey).address;
        // Seed the account with ETH for gas
        await testClient.setBalance({
          address: fromAddress,
          value: 1000000000000000000n, // 1 ETH
        });
        break;

      case 'fromAddress':
        fromAddress = deployerOptions.fromAddress;
        await this.impersonateAccount(deployerOptions.fromAddress, testClient);
        // Seed the impersonated account with ETH for gas
        await testClient.setBalance({
          address: fromAddress,
          value: 1000000000000000000n, // 1 ETH
        });
        break;

      default:
        throw new Error('invalid deployerOptions object');
    }

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

  /**
   * Impersonate account for anvil deployment
   *
   * @param {string} address - Address to impersonate
   * @param {object} testClient - Viem test client
   */
  async impersonateAccount(address, testClient) {
    await testClient.impersonateAccount({ address });
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
