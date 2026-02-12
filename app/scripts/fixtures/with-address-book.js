import { CHAIN_IDS } from '../../../shared/constants/network';

/**
 * Generates a random Ethereum address.
 *
 * @returns {string} A randomly generated Ethereum address.
 */
const generateRandomAddress = () => {
  const hexChars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += hexChars[Math.floor(Math.random() * 16)];
  }

  return address;
};

/**
 * Generates an address book with a specified number of entries, for the supported networks.
 *
 * @param {number} numEntries - The number of address book entries to generate for each network.
 * @returns {object} The generated address book object.
 */
export const withAddressBook = (numEntries) => {
  const networks = [CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA];

  const addressBook = {};

  networks.forEach((network) => {
    addressBook[network] = {};

    for (let i = 1; i <= numEntries; i++) {
      const address = generateRandomAddress();
      addressBook[network][address] = {
        address,
        chainId: network,
        isEns: false,
        memo: '',
        name: `Contact ${i}`,
      };
    }
  });

  return { addressBook };
};
