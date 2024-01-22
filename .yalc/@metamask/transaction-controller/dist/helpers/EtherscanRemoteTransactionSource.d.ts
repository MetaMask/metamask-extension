import type { Hex } from '@metamask/utils';
import type { RemoteTransactionSource, RemoteTransactionSourceRequest, TransactionMeta } from '../types';
/**
 * A RemoteTransactionSource that fetches transaction data from Etherscan.
 */
export declare class EtherscanRemoteTransactionSource implements RemoteTransactionSource {
    #private;
    constructor({ includeTokenTransfers, }?: {
        includeTokenTransfers?: boolean;
    });
    isSupportedNetwork(chainId: Hex): boolean;
    getLastBlockVariations(): string[];
    fetchTransactions(request: RemoteTransactionSourceRequest): Promise<TransactionMeta[]>;
}
//# sourceMappingURL=EtherscanRemoteTransactionSource.d.ts.map