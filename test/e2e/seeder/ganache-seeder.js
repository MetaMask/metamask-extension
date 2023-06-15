const { Web3Provider } = require('@ethersproject/providers');
const { ContractFactory } = require('@ethersproject/contracts');

const { SMART_CONTRACTS, contractConfiguration } = require('./smart-contracts');
const GanacheContractAddressRegistry = require('./ganache-contract-address-registry');

/*
 * Ganache seeder is used to seed initial smart contract or set initial blockchain state.
 */
class GanacheSeeder {
  constructor(ganacheProvider) {
    this.smartContractRegistry = new GanacheContractAddressRegistry();
    this.ganacheProvider = ganacheProvider;
  }

  /**
   * Deploy initial smart contracts that can be used later within the e2e tests.
   *
   * @param contractName
   */

  async deploySmartContract(contractName) {
    const ethersProvider = new Web3Provider(this.ganacheProvider, 'any');
    const signer = ethersProvider.getSigner();
    const fromAddress = await signer.getAddress();
    const contractFactory = new ContractFactory(
      contractConfiguration[contractName].abi,
      contractConfiguration[contractName].bytecode,
      signer,
    );

    let contract;

    if (contractName === SMART_CONTRACTS.HST) {
      contract = await contractFactory.deploy(
        contractConfiguration[SMART_CONTRACTS.HST].initialAmount,
        contractConfiguration[SMART_CONTRACTS.HST].tokenName,
        contractConfiguration[SMART_CONTRACTS.HST].decimalUnits,
        contractConfiguration[SMART_CONTRACTS.HST].tokenSymbol,
      );
    } else {
      contract = await contractFactory.deploy();
    }

    await contract.deployTransaction.wait();

    if (contractName === SMART_CONTRACTS.NFTS) {
      const transaction = await contract.mintNFTs(1, {
        from: fromAddress,
      });
      await transaction.wait();
    }

    if (contractName === SMART_CONTRACTS.ERC1155) {
      const transaction = await contract.mintBatch(
        fromAddress,
        [1, 2, 3],
        [1, 1, 100000000000000],
        '0x',
      );
      await transaction.wait();
    }
    this.storeSmartContractAddress(contractName, contract.address);
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
   * @returns GanacheContractAddressRegistry
   */
  getContractRegistry() {
    return this.smartContractRegistry;
  }
}

module.exports = GanacheSeeder;
