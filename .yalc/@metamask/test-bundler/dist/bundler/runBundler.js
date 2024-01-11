"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBundler = exports.startBundler = exports.connectContracts = exports.showStackTraces = exports.inspectCustomSymbol = void 0;
const contracts_1 = require("@account-abstraction/contracts");
const commander_1 = require("commander");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const fs_1 = __importDefault(require("fs"));
const BundlerConfig_1 = require("./BundlerConfig");
const BundlerServer_1 = require("./BundlerServer");
const Config_1 = require("./Config");
const DebugMethodHandler_1 = require("./DebugMethodHandler");
const initServer_1 = require("./modules/initServer");
const UserOpMethodHandler_1 = require("./UserOpMethodHandler");
const sdk_1 = require("../sdk");
const utils_2 = require("../utils");
const validation_manager_1 = require("../validation-manager");
// this is done so that console.log outputs BigNumber as hex string instead of unreadable object
exports.inspectCustomSymbol = Symbol.for('nodejs.util.inspect.custom');
// @ts-ignore
ethers_1.ethers.BigNumber.prototype[exports.inspectCustomSymbol] = function () {
    return `BigNumber ${parseInt(this._hex)}`;
};
const CONFIG_FILE_NAME = 'workdir/bundler.config.json';
exports.showStackTraces = false;
/**
 *
 * @param wallet
 * @param entryPointAddress
 */
async function connectContracts(wallet, entryPointAddress) {
    const entryPoint = contracts_1.EntryPoint__factory.connect(entryPointAddress, wallet);
    return {
        entryPoint,
    };
}
exports.connectContracts = connectContracts;
/**
 * Start the bundler server.
 * @param options - Options for the bundler server.
 * @param options.configFile - Path to the config file.
 * @param options.unsafe - Whether to disable additional validations requiring the RPC debug methods.
 * @returns The bundler server instance.
 */
async function startBundler({ configFile, unsafe, }) {
    const args = [
        '-',
        '-',
        unsafe ? '--unsafe' : undefined,
        '--config',
        configFile,
    ].filter((arg) => arg !== undefined);
    return await runBundler(args);
}
exports.startBundler = startBundler;
/**
 * start the bundler server.
 * this is an async method, but only to resolve configuration. after it returns, the server is only active after asyncInit()
 * @param argv
 * @param overrideExit
 */
async function runBundler(argv, overrideExit = true) {
    var _a;
    const program = new commander_1.Command();
    if (overrideExit) {
        program._exit = (exitCode, code, message) => {
            class CommandError extends Error {
                constructor(message, code, exitCode) {
                    super(message);
                    this.code = code;
                    this.exitCode = exitCode;
                }
            }
            throw new CommandError(message, code, exitCode);
        };
    }
    program
        .version(utils_2.erc4337RuntimeVersion)
        .option('--beneficiary <string>', 'address to receive funds')
        .option('--gasFactor <number>')
        .option('--minBalance <number>', 'below this signer balance, keep fee for itself, ignoring "beneficiary" address ')
        .option('--network <string>', 'network name or url')
        .option('--mnemonic <file>', 'mnemonic/private-key file of signer account')
        .option('--entryPoint <string>', 'address of the supported EntryPoint contract')
        .option('--port <number>', `server listening port (default: ${BundlerConfig_1.bundlerConfigDefault.port})`)
        .option('--config <string>', 'path to config file', CONFIG_FILE_NAME)
        .option('--auto', 'automatic bundling (bypass config.autoBundleMempoolSize)', false)
        .option('--unsafe', 'UNSAFE mode: no storage or opcode checks (safe mode requires geth)')
        .option('--debugRpc', 'enable debug rpc methods (auto-enabled for test node')
        .option('--conditionalRpc', 'Use eth_sendRawTransactionConditional RPC)')
        .option('--show-stack-traces', 'Show stack traces.')
        .option('--createMnemonic <file>', 'create the mnemonic file');
    const programOpts = program.parse(argv).opts();
    exports.showStackTraces = programOpts.showStackTraces;
    console.log('command-line arguments: ', program.opts());
    if (programOpts.createMnemonic != null) {
        const mnemonicFile = programOpts.createMnemonic;
        console.log('Creating mnemonic in file', mnemonicFile);
        if (fs_1.default.existsSync(mnemonicFile)) {
            throw new Error(`Can't --createMnemonic: out file ${mnemonicFile} already exists`);
        }
        const newMnemonic = ethers_1.Wallet.createRandom().mnemonic.phrase;
        fs_1.default.writeFileSync(mnemonicFile, newMnemonic);
        console.log('created mnemonic file', mnemonicFile);
        process.exit(1);
    }
    const { config, provider, wallet } = await (0, Config_1.resolveConfiguration)(programOpts);
    const { 
    // name: chainName,
    chainId, } = await provider.getNetwork();
    if (chainId === 31337) {
        if (config.debugRpc == null) {
            console.log('== debugrpc was', config.debugRpc);
            config.debugRpc = true;
        }
        else {
            console.log('== debugrpc already st', config.debugRpc);
        }
        await new sdk_1.DeterministicDeployer(provider).deterministicDeploy(contracts_1.EntryPoint__factory.bytecode);
        if ((await wallet.getBalance()).eq(0)) {
            console.log('=== testnet: fund signer');
            const signer = provider.getSigner();
            await signer.sendTransaction({
                to: await wallet.getAddress(),
                value: (0, utils_1.parseEther)('1'),
            });
        }
    }
    if (config.conditionalRpc &&
        !(await (0, utils_2.supportsRpcMethod)(provider, 'eth_sendRawTransactionConditional', [{}, {}]))) {
        console.error('FATAL: --conditionalRpc requires a node that support eth_sendRawTransactionConditional');
        process.exit(1);
    }
    if (!config.unsafe && !(await (0, validation_manager_1.supportsDebugTraceCall)(provider))) {
        console.error('FATAL: full validation requires a node with debug_traceCall. for local UNSAFE mode: use --unsafe');
        process.exit(1);
    }
    const { entryPoint } = await connectContracts(wallet, config.entryPoint);
    // bundleSize=1 replicate current immediate bundling mode
    const execManagerConfig = Object.assign({}, config);
    if (programOpts.auto === true) {
        execManagerConfig.autoBundleMempoolSize = 0;
        execManagerConfig.autoBundleInterval = 0;
    }
    const [execManager, eventsManager, reputationManager, mempoolManager] = (0, initServer_1.initServer)(execManagerConfig, entryPoint.signer);
    const methodHandler = new UserOpMethodHandler_1.UserOpMethodHandler(execManager, provider, wallet, config, entryPoint);
    eventsManager.initEventListener();
    const debugHandler = ((_a = config.debugRpc) !== null && _a !== void 0 ? _a : false)
        ? new DebugMethodHandler_1.DebugMethodHandler(execManager, eventsManager, reputationManager, mempoolManager)
        : new Proxy({}, {
            get(target, method, receiver) {
                throw new utils_2.RpcError(`method debug_bundler_${method} is not supported`, -32601);
            },
        });
    const bundlerServer = new BundlerServer_1.BundlerServer(methodHandler, debugHandler, config, provider, wallet);
    void bundlerServer.asyncStart().then(async () => {
        console.log('Bundle interval (seconds)', execManagerConfig.autoBundleInterval);
        console.log('connected to network', await provider.getNetwork().then((net) => {
            return {
                name: net.name,
                chainId: net.chainId,
            };
        }));
        console.log(`running on http://localhost:${config.port}/rpc`);
    });
    return bundlerServer;
}
exports.runBundler = runBundler;
//# sourceMappingURL=runBundler.js.map