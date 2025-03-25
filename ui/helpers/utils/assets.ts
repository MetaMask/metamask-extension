import {
  getFormattedIpfsUrl,
  fetchTokenContractExchangeRates,
  CodefiTokenPricesServiceV2,
  ContractExchangeRates,
} from '@metamask/assets-controllers';
import { Hex, isStrictHexString } from '@metamask/utils';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import abi from 'human-standard-token-abi';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';
import { logErrorWithMessage } from '../../../shared/modules/error';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { tsMigrateWidenSignature } from '../../../shared/lib/typescript-migration-tools';

/**
 * Gets the URL for an asset image, with IPFS support
 *
 * @param image - Image URL or IPFS URI
 * @param ipfsGateway - IPFS gateway URL
 * @returns Resolved image URL or empty string
 */
export async function getAssetImageURL(
  image?: string,
  ipfsGateway?: string,
): Promise<string> {
  if (!image || typeof image !== 'string') {
    return '';
  }

  if (ipfsGateway && image.startsWith('ipfs://')) {
    try {
      return await getFormattedIpfsUrl(ipfsGateway, image, true);
    } catch (e) {
      logErrorWithMessage(e);
      return '';
    }
  }
  return image;
}

/**
 * Gets a Contract instance for a token at the specified address
 *
 * @param tokenAddress - Token contract address
 * @returns Contract instance
 */
export function getContractAtAddress(tokenAddress: string) {
  return new Contract(
    tokenAddress,
    abi,
    new Web3Provider(global.ethereumProvider),
  );
}

/**
 * Generates a random file name
 *
 * @returns Random string suitable for a filename
 */
export function getRandomFileName(): string {
  let fileName = '';
  const charBank = [
    ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ];
  const fileNameLength = Math.floor(Math.random() * 7 + 6);

  for (let i = 0; i < fileNameLength; i++) {
    fileName += charBank[Math.floor(Math.random() * charBank.length)];
  }

  return fileName;
}

/**
 * Retrieves token prices
 *
 * @param nativeCurrency - native currency to fetch prices for
 * @param tokenAddresses - set of contract addresses
 * @param chainId - current chainId
 * @returns The prices for the requested tokens
 */
export const fetchTokenExchangeRates = tsMigrateWidenSignature<
  [string, string[], string]
>()(
  async (
    nativeCurrency: string,
    tokenAddresses: Hex[],
    chainId: Hex,
  ): Promise<ContractExchangeRates> => {
    try {
      return await fetchTokenContractExchangeRates({
        tokenPricesService: new CodefiTokenPricesServiceV2(),
        nativeCurrency,
        tokenAddresses,
        chainId,
      });
    } catch (err) {
      return {};
    }
  },
);

/**
 * Converts a hex string to UTF-8 text if possible
 *
 * @param hex - Hex string to convert
 * @returns UTF-8 string or original hex if conversion fails
 */
export const hexToText = (hex?: string): string => {
  if (!hex) {
    return hex || '';
  }
  try {
    const stripped = hex.startsWith('0x') ? hex.slice(2) : hex;
    const buff = Buffer.from(stripped, 'hex');
    return buff.length === 32 ? hex : buff.toString('utf8');
  } catch (e) {
    return hex;
  }
};

/**
 * Checks if a tokenId in Hex or decimal format already exists in an object
 *
 * @param address - collection address
 * @param tokenId - tokenId to search for
 * @param obj - object to look into
 * @returns `false` if tokenId does not already exist
 */
export const checkTokenIdExists = (
  address: string,
  tokenId: string,
  obj: Record<string, { nfts: { address: string; tokenId: string }[] }>,
): boolean => {
  // check if input tokenId is hexadecimal
  // If it is convert to decimal and compare with existing tokens
  const isHex = isStrictHexString(tokenId);
  let convertedTokenId = tokenId;
  if (isHex) {
    // Convert to decimal
    convertedTokenId = hexToDecimal(tokenId);
  }
  // Convert the input address to checksum address
  const checkSumAdr = toChecksumHexAddress(address);
  if (obj[checkSumAdr]) {
    const value = obj[checkSumAdr];
    return value.nfts.some((nft) => {
      return (
        nft.address === checkSumAdr &&
        (isEqualCaseInsensitive(nft.tokenId, tokenId) ||
          isEqualCaseInsensitive(nft.tokenId, convertedTokenId.toString()))
      );
    });
  }
  return false;
};

/**
 * Helper function to calculate the token amount 1dAgo using price percentage a day ago
 *
 * @param tokenFiatBalance - current token fiat balance
 * @param tokenPricePercentChange1dAgo - price percentage 1day ago
 * @returns token amount 1day ago
 */
export const getCalculatedTokenAmount1dAgo = tsMigrateWidenSignature<
  [string | number | undefined, number | undefined]
>()(
  (
    tokenFiatBalance: number | undefined,
    tokenPricePercentChange1dAgo: number | undefined,
  ): number => {
    return tokenPricePercentChange1dAgo !== undefined && tokenFiatBalance
      ? tokenFiatBalance / (1 + tokenPricePercentChange1dAgo / 100)
      : tokenFiatBalance ?? 0;
  },
);
