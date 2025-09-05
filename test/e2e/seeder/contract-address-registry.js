/*
 * Use this class to store pre-deployed smart contract addresses of the contracts deployed to
 * a local blockchain instance.
 */
class ContractAddressRegistry {
  #contracts = [];

  /**
   * Store new contract address in key:value pair.
   *
   * @param contractName
   * @param contractAddress
   */
  storeNewContractAddress(contractName, contractAddress) {
    this.#contracts.push({
      contractName,
      address: contractAddress,
    });
  }

  /**
   * Get deployed contract address by its name (key).
   * Returns the most recently deployed contract of this type.
   *
   * @param contractName
   */
  getContractAddress(contractName) {
    const matchingContracts = this.#contracts.filter(
      contract => contract.contractName === contractName
    );
    return matchingContracts.length > 0
      ? matchingContracts[matchingContracts.length - 1].address
      : undefined;
  }

  /**
   * Get all deployed contract addresses in deployment order.
   *
   * @returns Array of all deployed contract addresses in deployment order
   */
  getAllDeployedContractAddresses() {
    return this.#contracts.map(contract => contract.address);
  }
}

module.exports = ContractAddressRegistry;
