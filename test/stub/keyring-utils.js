/**
 * This file contains utility classes and functions used for testing the keyring bridge.
 */

export class Common {
  /**
   * Creates an instance of the Common class.
   * Warning: This class is a simplified version of @ethereum/common to use only in tests.
   * This avoids adding a dependency which increases the bundle size.
   *
   * @param {object} params - Parameters for initializing the Common instance.
   * @param {object} params.chain - Chain information including name, chainId, and networkId.
   * @param {string} params.hardfork - Hardfork name to be used.
   */
  constructor({ chain, hardfork }) {
    this.chain = chain;
    this.hardfork = hardfork;
  }

  /**
   * Creates a new instance of the Common class with custom parameters.
   *
   * @param {object} params - Parameters for creating a custom Common instance.
   * @param {object} params.chain - Chain information including name, chainId, and networkId.
   * @param {bigint} [params.chainId] - Optional chain ID for the custom chain.
   * @param {bigint} [params.networkId] - Optional network ID for the custom chain.
   * @param {object} [opts] - Optional options.
   * @param {string} [opts.hardfork] - Optional hardfork name.
   * @returns {Common} A new Common instance with the specified parameters.
   */
  static custom({ chain, chainId, networkId }, opts = {}) {
    return new Common({
      chain: {
        name: chain.name || 'custom-chain',
        chainId: chainId || chain.chainId,
        networkId: networkId || chain.networkId,
      },
      hardfork: opts.hardfork || 'istanbul',
    });
  }

  /**
   * Creates a copy of the current Common instance.
   *
   * @returns {Common} A new Common instance with the same chain and hardfork as the current instance.
   */
  copy() {
    return new Common({
      chain: this.chain,
      hardfork: this.hardfork,
    });
  }

  /**
   * Checks if the current hardfork is greater than or equal to a specified hardfork.
   *
   * @returns {boolean} We return true by default to simplify the logic.
   */
  gteHardfork() {
    return true;
  }

  /**
   * Returns the chain ID of the current Common instance.
   *
   * @returns {bigint} The chain ID as a BigInt.
   */
  chainId() {
    return BigInt(this.chain.chainId);
  }
}

/**
 * Adds the '0x' prefix to a hexadecimal string if it is not already present.
 *
 * @param {string} hexString - The hexadecimal string to prefix.
 * @returns {string} The hexadecimal string with '0x' prefix if it was not present.
 */
export function addHexPrefix(hexString) {
  if (hexString.startsWith('0x')) {
    return hexString;
  }

  return `0x${hexString}`;
}
