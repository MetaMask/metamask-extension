import { abiERC20, abiERC1155 } from '@metamask/metamask-eth-abis';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import type { Provider } from '@metamask/network-controller';

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
 * @param tokenData - ethers Interface token data.
 * @returns A decimal string value.
 */
// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTokenIdParam(tokenData: any = {}): string | undefined {
  return (
    tokenData?.args?._tokenId?.toString() ?? tokenData?.args?.id?.toString()
  );
}

export async function fetchTokenBalance(
  address: string,
  userAddress: string,
  provider: Provider,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const ethersProvider = new Web3Provider(provider);
  const tokenContract = new Contract(address, abiERC20, ethersProvider);
  const tokenBalancePromise = tokenContract
    ? tokenContract.balanceOf(userAddress)
    : Promise.resolve();
  return await tokenBalancePromise;
}

export async function fetchERC1155Balance(
  address: string,
  userAddress: string,
  tokenId: string,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (!userAddress || !tokenId) {
    return null;
  }
  const ethersProvider = new Web3Provider(provider);
  const tokenContract = new Contract(address, abiERC1155, ethersProvider);
  const tokenBalancePromise = tokenContract
    ? tokenContract.balanceOf(userAddress, tokenId)
    : Promise.resolve();
  return await tokenBalancePromise;
}
