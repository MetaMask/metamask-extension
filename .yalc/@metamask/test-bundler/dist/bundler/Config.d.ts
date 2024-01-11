import type { BaseProvider } from '@ethersproject/providers';
import { JsonRpcProvider } from '@ethersproject/providers';
import type { Signer } from 'ethers';
import type { BundlerConfig } from './BundlerConfig';
/**
 *
 * @param url
 */
export declare function getNetworkProvider(url: string): JsonRpcProvider;
/**
 *
 * @param programOpts
 */
export declare function resolveConfiguration(programOpts: any): Promise<{
    config: BundlerConfig;
    provider: BaseProvider;
    wallet: Signer;
}>;
