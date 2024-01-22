import type { Hex } from '@metamask/utils';
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
export interface EtherscanTokenTransactionMeta extends EtherscanTransactionMetaBase {
    tokenDecimal: string;
    tokenName: string;
    tokenSymbol: string;
}
export interface EtherscanTransactionResponse<T extends EtherscanTransactionMetaBase> {
    status: '0' | '1';
    message?: string;
    result: string | T[];
}
export interface EtherscanTransactionRequest {
    address: string;
    chainId: Hex;
    fromBlock?: number;
    limit?: number;
}
/**
 * Retrieves transaction data from Etherscan.
 *
 * @param request - Configuration required to fetch transactions.
 * @param request.address - Address to retrieve transactions for.
 * @param request.chainId - Current chain ID used to determine subdomain and domain.
 * @param request.fromBlock - Block number to start fetching transactions from.
 * @param request.limit - Number of transactions to retrieve.
 * @returns An Etherscan response object containing the request status and an array of token transaction data.
 */
export declare function fetchEtherscanTransactions({ address, chainId, fromBlock, limit, }: EtherscanTransactionRequest): Promise<EtherscanTransactionResponse<EtherscanTransactionMeta>>;
/**
 * Retrieves token transaction data from Etherscan.
 *
 * @param request - Configuration required to fetch token transactions.
 * @param request.address - Address to retrieve token transactions for.
 * @param request.chainId - Current chain ID used to determine subdomain and domain.
 * @param request.fromBlock - Block number to start fetching token transactions from.
 * @param request.limit - Number of token transactions to retrieve.
 * @returns An Etherscan response object containing the request status and an array of token transaction data.
 */
export declare function fetchEtherscanTokenTransactions({ address, chainId, fromBlock, limit, }: EtherscanTransactionRequest): Promise<EtherscanTransactionResponse<EtherscanTokenTransactionMeta>>;
//# sourceMappingURL=etherscan.d.ts.map