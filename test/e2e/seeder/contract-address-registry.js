/*
 * Use this class to store pre-deployed smart contract addresses of the contracts deployed to
 * a local blockchain instance.
 */
class ContractAddressRegistry {
  #addresses = {};

  /**
   * Store new contract address in key:value pair.
   *
   * @param contractName
   * @param contractAddress
   */
  storeNewContractAddress(contractName, contractAddress) {
    if (!this.#addresses[contractName]) {
      this.#addresses[contractName] = [];
    }
    this.#addresses[contractName].push(contractAddress);
  }

  /**
   * Get deployed contract address by its name (key).
   * Returns the most recently deployed contract of this type.
   *
   * @param contractName
   */
  getContractAddress(contractName) {
    const addresses = this.#addresses[contractName];
    return addresses && addresses.length > 0
      ? addresses[addresses.length - 1]
      : undefined;
  }

  /**
   * Get all deployed contract addresses in deployment order.
   *
   * @returns Array of all deployed contract addresses in deployment order
   */
  getAllDeployedContractAddresses() {
    const allAddresses = [];

    // Flatten all deployed addresses from all contract types in deployment order
    Object.keys(this.#addresses).forEach((contractName) => {
      allAddresses.push(...this.#addresses[contractName]);
    });

    return allAddresses;
  }
}

module.exports = ContractAddressRegistry;
