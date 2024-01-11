"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundlerConfigDefault = exports.BundlerConfigShape = void 0;
// TODO: consider adopting config-loading approach from hardhat to allow code in config file
const ow_1 = __importDefault(require("ow"));
const MIN_UNSTAKE_DELAY = 86400;
const MIN_STAKE_VALUE = (1e18).toString();
// TODO: implement merging config (args -> config.js -> default) and runtime shape validation
exports.BundlerConfigShape = {
    beneficiary: ow_1.default.string,
    entryPoint: ow_1.default.string,
    gasFactor: ow_1.default.optional.string,
    minBalance: ow_1.default.string,
    mnemonic: ow_1.default.string,
    network: ow_1.default.string,
    port: ow_1.default.string,
    unsafe: ow_1.default.boolean,
    debugRpc: ow_1.default.optional.boolean,
    conditionalRpc: ow_1.default.boolean,
    whitelist: ow_1.default.optional.array.ofType(ow_1.default.string),
    blacklist: ow_1.default.optional.array.ofType(ow_1.default.string),
    maxBundleGas: ow_1.default.number,
    minStake: ow_1.default.optional.string,
    minUnstakeDelay: ow_1.default.optional.number,
    autoBundleInterval: ow_1.default.number,
    autoBundleMempoolSize: ow_1.default.number,
};
// TODO: consider if we want any default fields at all
// TODO: implement merging config (args -> config.js -> default) and runtime shape validation
exports.bundlerConfigDefault = {
    port: '3000',
    entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    unsafe: false,
    conditionalRpc: false,
    minStake: MIN_STAKE_VALUE,
    minUnstakeDelay: MIN_UNSTAKE_DELAY,
};
//# sourceMappingURL=BundlerConfig.js.map