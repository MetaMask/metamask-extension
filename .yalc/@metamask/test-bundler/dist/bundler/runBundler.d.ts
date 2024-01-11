import type { EntryPoint } from '@account-abstraction/contracts';
import type { Signer } from 'ethers';
import { BundlerServer } from './BundlerServer';
export declare const inspectCustomSymbol: unique symbol;
export declare let showStackTraces: boolean;
/**
 *
 * @param wallet
 * @param entryPointAddress
 */
export declare function connectContracts(wallet: Signer, entryPointAddress: string): Promise<{
    entryPoint: EntryPoint;
}>;
/**
 * Start the bundler server.
 * @param options - Options for the bundler server.
 * @param options.configFile - Path to the config file.
 * @param options.unsafe - Whether to disable additional validations requiring the RPC debug methods.
 * @returns The bundler server instance.
 */
export declare function startBundler({ configFile, unsafe, }: {
    configFile: string;
    unsafe?: boolean;
}): Promise<BundlerServer>;
/**
 * start the bundler server.
 * this is an async method, but only to resolve configuration. after it returns, the server is only active after asyncInit()
 * @param argv
 * @param overrideExit
 */
export declare function runBundler(argv: string[], overrideExit?: boolean): Promise<BundlerServer>;
