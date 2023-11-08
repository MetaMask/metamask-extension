import { handleFetch } from '@metamask/controller-utils';
import { Hex } from '@metamask/utils';
import { ETHERSCAN_SUPPORTED_NETWORKS } from '../../../../shared/constants/network';

export interface EtherscanTransactionMetaBase {
  blockNumber: string;
  blockHash: string;
  confirmations: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  nonce: string;
  timeStamp: string;
  to: string;
  transactionIndex: string;
  value: string;
}

export interface EtherscanTransactionMeta extends EtherscanTransactionMetaBase {
  functionName: string;
  input: string;
  isError: string;
  methodId: string;
  txreceipt_status: string;
}

export interface EtherscanTokenTransactionMeta
  extends EtherscanTransactionMetaBase {
  tokenDecimal: string;
  tokenName: string;
  tokenSymbol: string;
}

export interface EtherscanTransactionResponse<
  T extends EtherscanTransactionMetaBase,
> {
  result: T[];
}

export interface EtherscanTransactionRequest {
  address: string;
  apiKey?: string;
  chainId: Hex;
  fromBlock?: number;
  limit?: number;
}

interface RawEtherscanResponse<T extends EtherscanTransactionMetaBase> {
  status: '0' | '1';
  message: string;
  result: string | T[];
}

/**
 * Retrieves transaction data from Etherscan.
 *
 * @param request - Configuration required to fetch transactions.
 * @param request.address - Address to retrieve transactions for.
 * @param request.apiKey - Etherscan API key.
 * @param request.chainId - Current chain ID used to determine subdomain and domain.
 * @param request.fromBlock - Block number to start fetching transactions from.
 * @param request.limit - Number of transactions to retrieve.
 * @returns An Etherscan response object containing the request status and an array of token transaction data.
 */
export async function fetchEtherscanTransactions({
  address,
  apiKey,
  chainId,
  fromBlock,
  limit,
}: EtherscanTransactionRequest): Promise<
  EtherscanTransactionResponse<EtherscanTransactionMeta>
> {
  return await fetchTransactions('txlist', {
    address,
    apiKey,
    chainId,
    fromBlock,
    limit,
  });
}

/**
 * Retrieves token transaction data from Etherscan.
 *
 * @param request - Configuration required to fetch token transactions.
 * @param request.address - Address to retrieve token transactions for.
 * @param request.apiKey - Etherscan API key.
 * @param request.chainId - Current chain ID used to determine subdomain and domain.
 * @param request.fromBlock - Block number to start fetching token transactions from.
 * @param request.limit - Number of token transactions to retrieve.
 * @returns An Etherscan response object containing the request status and an array of token transaction data.
 */
export async function fetchEtherscanTokenTransactions({
  address,
  apiKey,
  chainId,
  fromBlock,
  limit,
}: EtherscanTransactionRequest): Promise<
  EtherscanTransactionResponse<EtherscanTokenTransactionMeta>
> {
  return await fetchTransactions('tokentx', {
    address,
    apiKey,
    chainId,
    fromBlock,
    limit,
  });
}

/**
 * Retrieves transaction data from Etherscan from a specific endpoint.
 *
 * @param action - The Etherscan endpoint to use.
 * @param options - Options bag.
 * @param options.address - Address to retrieve transactions for.
 * @param options.apiKey - Etherscan API key.
 * @param options.chainId - Current chain ID used to determine subdomain and domain.
 * @param options.fromBlock - Block number to start fetching transactions from.
 * @param options.limit - Number of transactions to retrieve.
 * @returns An object containing the request status and an array of transaction data.
 */
async function fetchTransactions<T extends EtherscanTransactionMetaBase>(
  action: string,
  {
    address,
    apiKey,
    chainId,
    fromBlock,
    limit,
  }: {
    address: string;
    apiKey?: string;
    chainId: Hex;
    fromBlock?: number;
    limit?: number;
  },
): Promise<EtherscanTransactionResponse<T>> {
  const urlParams = {
    module: 'account',
    address,
    startBlock: fromBlock?.toString(),
    apikey: apiKey,
    offset: limit?.toString(),
    order: 'desc',
  };

  const etherscanTxUrl = getEtherscanApiUrl(chainId, {
    ...urlParams,
    action,
  });

  const response = (await handleFetch(
    etherscanTxUrl,
  )) as RawEtherscanResponse<T>;

  if (response.status === '0' && response.message === 'NOTOK') {
    throw new Error(`Etherscan request failed - ${response.result}`);
  }

  return { result: response.result as T[] };
}

/**
 * Return a URL that can be used to fetch data from Etherscan.
 *
 * @param chainId - Current chain ID used to determine subdomain and domain.
 * @param urlParams - The parameters used to construct the URL.
 * @returns URL to access Etherscan data.
 */
function getEtherscanApiUrl(
  chainId: Hex,
  urlParams: Record<string, string | undefined>,
): string {
  type SupportedChainId = keyof typeof ETHERSCAN_SUPPORTED_NETWORKS;

  const networkInfo = ETHERSCAN_SUPPORTED_NETWORKS[chainId as SupportedChainId];

  if (!networkInfo) {
    throw new Error(`Etherscan does not support chain with ID: ${chainId}`);
  }

  const apiUrl = `https://${networkInfo.subdomain}.${networkInfo.domain}`;
  let url = `${apiUrl}/api?`;

  // eslint-disable-next-line guard-for-in
  for (const paramKey in urlParams) {
    const value = urlParams[paramKey];

    if (!value) {
      continue;
    }

    url += `${paramKey}=${value}&`;
  }

  url += 'tag=latest&page=1';

  return url;
}
