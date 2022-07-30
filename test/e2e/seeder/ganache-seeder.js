const { ethers } = require('ethers');
const ganache = require('ganache');
const { contractConfiguration } = require('./smart-contracts');
const GanacheContractAddressRegistry = require('./ganache-contract-address-registry');

/*
 * Ganache seeder is used to seed initial smart contract or set initial blockchain state.
 */
class GanacheSeeder {
  constructor(debug = false) {
    this.debug = debug;
    this.smartContractRegistry = new GanacheContractAddressRegistry();
  }

  /**
   * Deploy initial smart contracts that can be used later within the e2e tests.
   *
   * @param contractName
   */

  async deploySmartContract(contractName) {
    if (this.debug) {
      console.log('Deploying smart contracts using GanacheSeeder');
    }

    const ethersProvider = new ethers.providers.Web3Provider(
      ganache.provider(),
      'any',
    );
    const contractFactory = new ethers.ContractFactory(
      contractConfiguration[contractName].abi,
      contractConfiguration[contractName].bytecode,
      ethersProvider.getSigner(),
    );

    let contract;

    if (contractName === 'hst') {
      contract = await contractFactory.deploy(
        contractConfiguration.hst.initialAmount,
        contractConfiguration.hst.tokenName,
        contractConfiguration.hst.decimalUnits,
        contractConfiguration.hst.tokenSymbol,
      );
    } else {
      contract = await contractFactory.deploy();
    }

    await contract.deployTransaction.wait();

    if (this.debug) {
      console.log(
        `Contract mined! address: ${contract.address} transactionHash: ${contract.deployTransaction.hash}`,
      );
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
    if (this.debug) {
      console.log(
        `Storing smart contract address: [${contractName}] => ${contractAddress}`,
      );
    }
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
