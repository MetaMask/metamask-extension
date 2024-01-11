import type { UserOperationStruct } from '@account-abstraction/contracts';
import { Signer } from '@ethersproject/abstract-signer';
import type { Deferrable } from '@ethersproject/properties';
import type { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import type { Bytes } from 'ethers';
import type { BaseAccountAPI } from './BaseAccountAPI';
import type { ClientConfig } from './ClientConfig';
import type { ERC4337EthersProvider } from './ERC4337EthersProvider';
import type { HttpRpcClient } from './HttpRpcClient';
export declare class ERC4337EthersSigner extends Signer {
    readonly config: ClientConfig;
    readonly originalSigner: Signer;
    readonly erc4337provider: ERC4337EthersProvider;
    readonly httpRpcClient: HttpRpcClient;
    readonly smartAccountAPI: BaseAccountAPI;
    constructor(config: ClientConfig, originalSigner: Signer, erc4337provider: ERC4337EthersProvider, httpRpcClient: HttpRpcClient, smartAccountAPI: BaseAccountAPI);
    address?: string;
    sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse>;
    unwrapError(errorIn: any): Error;
    verifyAllNecessaryFields(transactionRequest: TransactionRequest): Promise<void>;
    connect(provider: Provider): Signer;
    getAddress(): Promise<string>;
    signMessage(message: Bytes | string): Promise<string>;
    signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>;
    signUserOperation(userOperation: UserOperationStruct): Promise<string>;
}
