/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
/**
 * Gets either the '_tokenId' parameter or the 'id' param of the passed token transaction data.,
 * These are the parsed tokenId values returned by `parseStandardTokenTransactionData` as defined
 * in the ERC721 and ERC1155 ABIs from metamask-eth-abis (https://github.com/MetaMask/metamask-eth-abis/tree/main/src/abis)
 *
 * @param {object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
export function getTokenIdParam(tokenData = {}) {
  return (
    tokenData?.args?._tokenId?.toString() ?? tokenData?.args?.id?.toString()
  );
}
