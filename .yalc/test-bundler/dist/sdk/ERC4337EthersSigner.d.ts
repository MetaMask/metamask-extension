import { Deferrable } from '@ethersproject/properties';
import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/providers';
import { Signer } from '@ethersproject/abstract-signer';
import { Bytes } from 'ethers';
import { ERC4337EthersProvider } from './ERC4337EthersProvider';
import { ClientConfig } from './ClientConfig';
import { HttpRpcClient } from './HttpRpcClient';
import { UserOperationStruct } from '@account-abstraction/contracts';
import { BaseAccountAPI } from './BaseAccountAPI';
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
