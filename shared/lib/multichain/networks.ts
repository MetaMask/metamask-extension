/**
 * Base URL of a block explorer.
 */
export type MultichainBlockExplorerUrl = `https://${string}.${string}`;

/**
 * Format URL of a block explorer for addresses.
 *
 * The format URLs can be used to "expand" some strings within the format string. (Similar
 * to "string interpolation"). The "tags" are being identified with curly-braces.
 */
export type MultichainBlockExplorerFormatUrl<Tag extends string> =
  `https://${string}.${string}/${string}{${Tag}}${string}`;

/**
 * A group of URL and format URL for block explorers.
 */
export type MultichainBlockExplorerFormatUrls = {
  /**
   * Base URL of the block explorer.
   */
  url: MultichainBlockExplorerUrl;

  /**
   * Format URL of the block explorer for addresses.
   */
  address: MultichainBlockExplorerFormatUrl<'address'>;

  /**
   * Format URL of the block explorer for transactions.
   */
  transaction: MultichainBlockExplorerFormatUrl<'txId'>;
};

/**
 * Format a URL by replacing a "tag" with a corresponding value.
 *
 * @param url - Format URL.
 * @param tag - Format URL tag.
 * @param value - The value to expand.
 * @returns A formatted URL.
 */
export function formatBlockExplorerUrl<Tag extends string>(
  url: MultichainBlockExplorerFormatUrl<Tag>,
  tag: Tag,
  value: string,
) {
  return url.replaceAll(tag, value);
}

/**
 * Format a URL for addresses.
 *
 * @param urls - The group of format URLs for a given block explorer.
 * @param address - The address to create the URL for.
 * @returns The formatted URL for the given address.
 */
export function formatBlockExplorerAddressUrl(
  urls: MultichainBlockExplorerFormatUrls,
  address: string,
) {
  return formatBlockExplorerUrl(urls.address, '{address}', address);
}

/**
 * Format a URL for transactions.
 *
 * @param urls - The group of format URLs for a given block explorer.
 * @param txId - The transaction ID to create the URL for.
 * @returns The formatted URL for the given transaction.
 */
export function formatBlockExplorerTransactionUrl(
  urls: MultichainBlockExplorerFormatUrls,
  txId: string,
): string {
  return urls.transaction.replace('{txId}', txId);
}
