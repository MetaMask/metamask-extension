import { Signer } from 'ethers';
import { BundlerServer } from './BundlerServer';
import { EntryPoint } from '@account-abstraction/contracts';
export declare const inspectCustomSymbol: unique symbol;
export declare let showStackTraces: boolean;
export declare function connectContracts(wallet: Signer, entryPointAddress: string): Promise<{
    entryPoint: EntryPoint;
}>;
/**
 * start the bundler server.
 * this is an async method, but only to resolve configuration. after it returns, the server is only active after asyncInit()
 * @param argv
 * @param overrideExit
 */
export declare function runBundler(argv: string[], overrideExit?: boolean): Promise<BundlerServer>;
