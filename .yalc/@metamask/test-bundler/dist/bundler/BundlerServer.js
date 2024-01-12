"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundlerServer = void 0;
const contracts_1 = require("@account-abstraction/contracts");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const debug_1 = __importDefault(require("debug"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const express_1 = __importDefault(require("express"));
const utils_2 = require("../utils");
const events_1 = __importDefault(require("events"));
const debug = (0, debug_1.default)('aa.rpc');
class BundlerServer {
    constructor(methodHandler, debugHandler, config, provider, wallet) {
        this.methodHandler = methodHandler;
        this.debugHandler = debugHandler;
        this.config = config;
        this.provider = provider;
        this.wallet = wallet;
        this.app = (0, express_1.default)();
        this.hub = new events_1.default();
        this.app.use((0, cors_1.default)());
        this.app.use(body_parser_1.default.json());
        this.app.get('/', this.intro.bind(this));
        this.app.post('/', this.intro.bind(this));
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.app.post('/rpc', this.rpc.bind(this));
        this.httpServer = this.app.listen(this.config.port);
        this.startingPromise = this._preflightCheck();
    }
    async asyncStart() {
        await this.startingPromise;
    }
    async stop() {
        this.httpServer.close();
    }
    async _preflightCheck() {
        if ((await this.provider.getCode(this.config.entryPoint)) === '0x') {
            this.fatal(`entrypoint not deployed at ${this.config.entryPoint}`);
        }
        // minimal UserOp to revert with "FailedOp"
        const emptyUserOp = {
            sender: utils_2.AddressZero,
            callData: '0x',
            initCode: utils_2.AddressZero,
            paymasterAndData: '0x',
            nonce: 0,
            preVerificationGas: 0,
            verificationGasLimit: 100000,
            callGasLimit: 0,
            maxFeePerGas: 0,
            maxPriorityFeePerGas: 0,
            signature: '0x',
        };
        // await EntryPoint__factory.connect(this.config.entryPoint,this.provider).callStatic.addStake(0)
        const err = await contracts_1.EntryPoint__factory.connect(this.config.entryPoint, this.provider)
            .callStatic.simulateValidation(emptyUserOp)
            .catch((e) => e);
        if ((err === null || err === void 0 ? void 0 : err.errorName) !== 'FailedOp') {
            this.fatal(`Invalid entryPoint contract at ${this.config.entryPoint}. wrong version?`);
        }
        const signerAddress = await this.wallet.getAddress();
        const bal = await this.provider.getBalance(signerAddress);
        console.log('signer', signerAddress, 'balance', ethers_1.utils.formatEther(bal));
        if (bal.eq(0)) {
            this.fatal('cannot run with zero balance');
        }
        else if (bal.lt((0, utils_1.parseEther)(this.config.minBalance))) {
            console.log('WARNING: initial balance below --minBalance ', this.config.minBalance);
        }
    }
    fatal(msg) {
        console.error('FATAL:', msg);
        process.exit(1);
    }
    intro(req, res) {
        res.send(`Account-Abstraction Bundler v.${utils_2.erc4337RuntimeVersion}. please use "/rpc"`);
    }
    async rpc(req, res) {
        let resContent;
        if (Array.isArray(req.body)) {
            resContent = [];
            for (const reqItem of req.body) {
                resContent.push(await this.handleRpc(reqItem));
            }
        }
        else {
            resContent = await this.handleRpc(req.body);
        }
        try {
            res.send(resContent);
        }
        catch (err) {
            const error = {
                message: err.message,
                data: err.data,
                code: err.code,
            };
            console.log('failed: ', 'rpc::res.send()', 'error:', JSON.stringify(error));
        }
    }
    async handleRpc(reqItem) {
        const { method, params, jsonrpc, id } = reqItem;
        debug('>>', { jsonrpc, id, method, params });
        try {
            const result = (0, utils_2.deepHexlify)(await this.handleMethod(method, params));
            console.log('sent', method, '-', result);
            debug('<<', { jsonrpc, id, result });
            return {
                jsonrpc,
                id,
                result,
            };
        }
        catch (err) {
            const error = {
                message: err.message,
                data: err.data,
                code: err.code,
            };
            console.log('failed: ', method, 'error:', JSON.stringify(error));
            debug('<<', { jsonrpc, id, error });
            return {
                jsonrpc,
                id,
                error,
            };
        }
    }
    async handleMethod(method, params) {
        let result;
        switch (method) {
            case 'eth_chainId':
                // eslint-disable-next-line no-case-declarations
                const { chainId } = await this.provider.getNetwork();
                result = chainId;
                break;
            case 'eth_supportedEntryPoints':
                result = await this.methodHandler.getSupportedEntryPoints();
                break;
            case 'eth_sendUserOperation':
                result = await this.methodHandler.sendUserOperation(params[0], params[1]);
                if (result === null || result === void 0 ? void 0 : result.length) {
                    this.hub.emit('user-operation-added', result);
                }
                break;
            case 'eth_estimateUserOperationGas':
                result = await this.methodHandler.estimateUserOperationGas(params[0], params[1]);
                break;
            case 'eth_getUserOperationReceipt':
                result = await this.methodHandler.getUserOperationReceipt(params[0]);
                break;
            case 'eth_getUserOperationByHash':
                result = await this.methodHandler.getUserOperationByHash(params[0]);
                break;
            case 'web3_clientVersion':
                result = this.methodHandler.clientVersion();
                break;
            case 'debug_bundler_clearState':
                this.debugHandler.clearState();
                result = 'ok';
                break;
            case 'debug_bundler_dumpMempool':
                result = await this.debugHandler.dumpMempool();
                break;
            case 'debug_bundler_clearMempool':
                this.debugHandler.clearMempool();
                result = 'ok';
                break;
            case 'debug_bundler_setReputation':
                await this.debugHandler.setReputation(params[0]);
                result = 'ok';
                break;
            case 'debug_bundler_dumpReputation':
                result = await this.debugHandler.dumpReputation();
                break;
            case 'debug_bundler_clearReputation':
                this.debugHandler.clearReputation();
                result = 'ok';
                break;
            case 'debug_bundler_setBundlingMode':
                await this.debugHandler.setBundlingMode(params[0]);
                result = 'ok';
                break;
            case 'debug_bundler_setBundleInterval':
                await this.debugHandler.setBundleInterval(params[0], params[1]);
                result = 'ok';
                break;
            case 'debug_bundler_sendBundleNow':
                result = await this.debugHandler.sendBundleNow();
                if (result == null) {
                    result = 'ok';
                }
                break;
            case 'debug_bundler_getStakeStatus':
                result = await this.debugHandler.getStakeStatus(params[0], params[1]);
                break;
            default:
                throw new utils_2.RpcError(`Method ${method} is not supported`, -32601);
        }
        return result;
    }
}
exports.BundlerServer = BundlerServer;
//# sourceMappingURL=BundlerServer.js.map