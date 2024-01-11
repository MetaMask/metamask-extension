"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC4337EthersProvider = void 0;
const providers_1 = require("@ethersproject/providers");
const debug_1 = __importDefault(require("debug"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const ERC4337EthersSigner_1 = require("./ERC4337EthersSigner");
const UserOperationEventListener_1 = require("./UserOperationEventListener");
const utils_2 = require("../utils");
const debug = (0, debug_1.default)('aa.provider');
class ERC4337EthersProvider extends providers_1.BaseProvider {
    constructor(chainId, config, originalSigner, originalProvider, httpRpcClient, entryPoint, smartAccountAPI) {
        super({
            name: 'ERC-4337 Custom Network',
            chainId,
        });
        this.chainId = chainId;
        this.config = config;
        this.originalSigner = originalSigner;
        this.originalProvider = originalProvider;
        this.httpRpcClient = httpRpcClient;
        this.entryPoint = entryPoint;
        this.smartAccountAPI = smartAccountAPI;
        this.signer = new ERC4337EthersSigner_1.ERC4337EthersSigner(config, originalSigner, this, httpRpcClient, smartAccountAPI);
    }
    /**
     * finish intializing the provider.
     * MUST be called after construction, before using the provider.
     */
    async init() {
        // await this.httpRpcClient.validateChainId()
        this.initializedBlockNumber = await this.originalProvider.getBlockNumber();
        await this.smartAccountAPI.init();
        // await this.signer.init()
        return this;
    }
    getSigner() {
        return this.signer;
    }
    async perform(method, params) {
        debug('perform', method, params);
        if (method === 'sendTransaction' || method === 'getTransactionReceipt') {
            // TODO: do we need 'perform' method to be available at all?
            // there is nobody out there to use it for ERC-4337 methods yet, we have nothing to override in fact.
            throw new Error('Should not get here. Investigate.');
        }
        return await this.originalProvider.perform(method, params);
    }
    async getTransaction(transactionHash) {
        // TODO
        return await super.getTransaction(transactionHash);
    }
    async getTransactionReceipt(transactionHash) {
        const userOpHash = await transactionHash;
        const sender = await this.getSenderAccountAddress();
        return await new Promise((resolve, reject) => {
            new UserOperationEventListener_1.UserOperationEventListener(resolve, reject, this.entryPoint, sender, userOpHash).start();
        });
    }
    async getSenderAccountAddress() {
        return await this.smartAccountAPI.getAccountAddress();
    }
    async waitForTransaction(transactionHash, confirmations, timeout) {
        const sender = await this.getSenderAccountAddress();
        return await new Promise((resolve, reject) => {
            const listener = new UserOperationEventListener_1.UserOperationEventListener(resolve, reject, this.entryPoint, sender, transactionHash, undefined, timeout);
            listener.start();
        });
    }
    // fabricate a response in a format usable by ethers users...
    async constructUserOpTransactionResponse(userOp1) {
        const userOp = await (0, utils_1.resolveProperties)(userOp1);
        const userOpHash = (0, utils_2.getUserOpHash)(userOp, this.config.entryPointAddress, this.chainId);
        const waitForUserOp = async () => await new Promise((resolve, reject) => {
            new UserOperationEventListener_1.UserOperationEventListener(resolve, reject, this.entryPoint, userOp.sender, userOpHash, userOp.nonce).start();
        });
        return {
            hash: userOpHash,
            confirmations: 0,
            from: userOp.sender,
            nonce: ethers_1.BigNumber.from(userOp.nonce).toNumber(),
            gasLimit: ethers_1.BigNumber.from(userOp.callGasLimit),
            value: ethers_1.BigNumber.from(0),
            data: (0, utils_1.hexValue)(userOp.callData),
            chainId: this.chainId,
            wait: async (confirmations) => {
                const transactionReceipt = await waitForUserOp();
                if (userOp.initCode.length !== 0) {
                    // checking if the wallet has been deployed by the transaction; it must be if we are here
                    await this.smartAccountAPI.checkAccountPhantom();
                }
                return transactionReceipt;
            },
        };
    }
    async detectNetwork() {
        return this.originalProvider.detectNetwork();
    }
}
exports.ERC4337EthersProvider = ERC4337EthersProvider;
//# sourceMappingURL=ERC4337EthersProvider.js.map