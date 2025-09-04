/*
 * Use this class to store pre-deployed smart contract addresses of the contracts deployed to
 * a local blockchain instance.
 */
class ContractAddressRegistry {
  #addresses = {};

  #instanceCounts = {};

  /**
   * Store new contract address in key:value pair.
   *
   * @param contractName
   * @param contractAddress
   * @param instanceIndex - Optional index for multiple instances of the same contract
   */
  storeNewContractAddress(contractName, contractAddress, instanceIndex) {
    if (instanceIndex !== undefined) {
      // Store indexed contract (e.g., "hst_0", "hst_1", "hst_2")
      const indexedName = `${contractName}_${instanceIndex}`;
      this.#addresses[indexedName] = contractAddress;

      // If we're storing with index 0 and a base contract exists, remove the base entry
      // to avoid confusion between base name and indexed storage
      if (instanceIndex === 0 && this.#addresses[contractName]) {
        delete this.#addresses[contractName];
      }
    } else {
      // Store regular contract (backward compatibility)
      this.#addresses[contractName] = contractAddress;
    }

    // Keep track of instance counts for each contract type
    if (!this.#instanceCounts[contractName]) {
      this.#instanceCounts[contractName] = 0;
    }
    this.#instanceCounts[contractName]++;
  }

  /**
   * Get deployed contract address by its name (key).
   *
   * @param contractName
   * @param instanceIndex - Optional index for multiple instances
   */
  getContractAddress(contractName, instanceIndex) {
    if (instanceIndex !== undefined) {
      const indexedName = `${contractName}_${instanceIndex}`;
      return this.#addresses[indexedName];
    }
    return this.#addresses[contractName];
  }

  /**
   * Get all contract addresses for a given contract type.
   *
   * @param contractName
   * @returns Array of contract addresses
   */
  getAllContractAddresses(contractName) {
    const addresses = [];
    const instanceCount = this.#instanceCounts[contractName] || 0;

    for (let i = 0; i < instanceCount; i++) {
      const indexedName = `${contractName}_${i}`;
      const address = this.#addresses[indexedName];
      if (address) {
        addresses.push(address);
      }
    }

    // If no indexed instances exist, check for the base contract name
    if (addresses.length === 0 && this.#addresses[contractName]) {
      addresses.push(this.#addresses[contractName]);
    }

    return addresses;
  }

  /**
   * Get the number of deployed instances for a contract type.
   *
   * @param contractName
   * @returns Number of instances
   */
  getInstanceCount(contractName) {
    return this.#instanceCounts[contractName] || 0;
  }
}

module.exports = ContractAddressRegistry;
