"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRpcClient = void 0;
const debug_1 = __importDefault(require("debug"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const utils_2 = require("../utils");
const debug = (0, debug_1.default)('aa.rpc');
class HttpRpcClient {
    constructor(bundlerUrl, entryPointAddress, chainId) {
        this.bundlerUrl = bundlerUrl;
        this.entryPointAddress = entryPointAddress;
        this.chainId = chainId;
        this.userOpJsonRpcProvider = new ethers_1.ethers.providers.JsonRpcProvider(this.bundlerUrl, {
            name: 'Connected bundler network',
            chainId,
        });
        this.initializing = this.validateChainId();
    }
    async validateChainId() {
        // validate chainId is in sync with expected chainid
        const chain = await this.userOpJsonRpcProvider.send('eth_chainId', []);
        const bundlerChain = parseInt(chain);
        if (bundlerChain !== this.chainId) {
            throw new Error(`bundler ${this.bundlerUrl} is on chainId ${bundlerChain}, but provider is on chainId ${this.chainId}`);
        }
    }
    /**
     * send a UserOperation to the bundler
     * @param userOp1
     * @returns userOpHash the id of this operation, for getUserOperationTransaction
     */
    async sendUserOpToBundler(userOp1) {
        await this.initializing;
        const hexifiedUserOp = (0, utils_2.deepHexlify)(await (0, utils_1.resolveProperties)(userOp1));
        const jsonRequestData = [
            hexifiedUserOp,
            this.entryPointAddress,
        ];
        await this.printUserOperation('eth_sendUserOperation', jsonRequestData);
        return await this.userOpJsonRpcProvider.send('eth_sendUserOperation', [
            hexifiedUserOp,
            this.entryPointAddress,
        ]);
    }
    /**
     * estimate gas requirements for UserOperation
     * @param userOp1
     * @returns latest gas suggestions made by the bundler.
     */
    async estimateUserOpGas(userOp1) {
        await this.initializing;
        const hexifiedUserOp = (0, utils_2.deepHexlify)(await (0, utils_1.resolveProperties)(userOp1));
        const jsonRequestData = [
            hexifiedUserOp,
            this.entryPointAddress,
        ];
        await this.printUserOperation('eth_estimateUserOperationGas', jsonRequestData);
        return await this.userOpJsonRpcProvider.send('eth_estimateUserOperationGas', [hexifiedUserOp, this.entryPointAddress]);
    }
    async printUserOperation(method, [userOp1, entryPointAddress]) {
        const userOp = await (0, utils_1.resolveProperties)(userOp1);
        debug('sending', method, Object.assign({}, userOp), entryPointAddress);
    }
}
exports.HttpRpcClient = HttpRpcClient;
//# sourceMappingURL=HttpRpcClient.js.map