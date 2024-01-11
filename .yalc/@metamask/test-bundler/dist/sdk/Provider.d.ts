import type { Signer } from '@ethersproject/abstract-signer';
import type { JsonRpcProvider } from '@ethersproject/providers';
import type { ClientConfig } from './ClientConfig';
import { ERC4337EthersProvider } from './ERC4337EthersProvider';
/**
 * wrap an existing provider to tunnel requests through Account Abstraction.
 * @param originalProvider - the normal provider
 * @param config - see ClientConfig for more info
 * @param originalSigner - use this signer as the owner. of this wallet. By default, use the provider's signer
 */
export declare function wrapProvider(originalProvider: JsonRpcProvider, config: ClientConfig, originalSigner?: Signer): Promise<ERC4337EthersProvider>;
