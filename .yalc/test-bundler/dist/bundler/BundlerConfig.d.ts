export interface BundlerConfig {
    beneficiary: string;
    entryPoint: string;
    gasFactor: string;
    minBalance: string;
    mnemonic: string;
    network: string;
    port: string;
    unsafe: boolean;
    debugRpc?: boolean;
    conditionalRpc: boolean;
    whitelist?: string[];
    blacklist?: string[];
    maxBundleGas: number;
    minStake: string;
    minUnstakeDelay: number;
    autoBundleInterval: number;
    autoBundleMempoolSize: number;
}
export declare const BundlerConfigShape: {
    beneficiary: import("ow").StringPredicate;
    entryPoint: import("ow").StringPredicate;
    gasFactor: import("ow").StringPredicate;
    minBalance: import("ow").StringPredicate;
    mnemonic: import("ow").StringPredicate;
    network: import("ow").StringPredicate;
    port: import("ow").StringPredicate;
    unsafe: import("ow").BooleanPredicate;
    debugRpc: import("ow").BooleanPredicate & import("ow").BasePredicate<boolean | undefined>;
    conditionalRpc: import("ow").BooleanPredicate;
    whitelist: import("ow").ArrayPredicate<string>;
    blacklist: import("ow").ArrayPredicate<string>;
    maxBundleGas: import("ow").NumberPredicate;
    minStake: import("ow").StringPredicate;
    minUnstakeDelay: import("ow").NumberPredicate;
    autoBundleInterval: import("ow").NumberPredicate;
    autoBundleMempoolSize: import("ow").NumberPredicate;
};
export declare const bundlerConfigDefault: Partial<BundlerConfig>;
