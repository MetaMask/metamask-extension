import { BundlerConfig } from './BundlerConfig';
import { Signer } from 'ethers';
import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers';
export declare function getNetworkProvider(url: string): JsonRpcProvider;
export declare function resolveConfiguration(programOpts: any): Promise<{
    config: BundlerConfig;
    provider: BaseProvider;
    wallet: Signer;
}>;
