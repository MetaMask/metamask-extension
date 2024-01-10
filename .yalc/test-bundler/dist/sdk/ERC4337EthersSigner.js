"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERC4337EthersSigner = void 0;
const properties_1 = require("@ethersproject/properties");
const abstract_signer_1 = require("@ethersproject/abstract-signer");
class ERC4337EthersSigner extends abstract_signer_1.Signer {
    // TODO: we have 'erc4337provider', remove shared dependencies or avoid two-way reference
    constructor(config, originalSigner, erc4337provider, httpRpcClient, smartAccountAPI) {
        super();
        this.config = config;
        this.originalSigner = originalSigner;
        this.erc4337provider = erc4337provider;
        this.httpRpcClient = httpRpcClient;
        this.smartAccountAPI = smartAccountAPI;
        (0, properties_1.defineReadOnly)(this, 'provider', erc4337provider);
    }
    // This one is called by Contract. It signs the request and passes in to Provider to be sent.
    async sendTransaction(transaction) {
        var _a, _b, _c;
        const tx = await this.populateTransaction(transaction);
        await this.verifyAllNecessaryFields(tx);
        const userOperation = await this.smartAccountAPI.createSignedUserOp({
            target: (_a = tx.to) !== null && _a !== void 0 ? _a : '',
            data: (_c = (_b = tx.data) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : '',
            value: tx.value,
            gasLimit: tx.gasLimit
        });
        const transactionResponse = await this.erc4337provider.constructUserOpTransactionResponse(userOperation);
        try {
            await this.httpRpcClient.sendUserOpToBundler(userOperation);
        }
        catch (error) {
            // console.error('sendUserOpToBundler failed', error)
            throw this.unwrapError(error);
        }
        // TODO: handle errors - transaction that is "rejected" by bundler is _not likely_ to ever resolve its "wait()"
        return transactionResponse;
    }
    unwrapError(errorIn) {
        var _a;
        if (errorIn.body != null) {
            const errorBody = JSON.parse(errorIn.body);
            let paymasterInfo = '';
            let failedOpMessage = (_a = errorBody === null || errorBody === void 0 ? void 0 : errorBody.error) === null || _a === void 0 ? void 0 : _a.message;
            if ((failedOpMessage === null || failedOpMessage === void 0 ? void 0 : failedOpMessage.includes('FailedOp')) === true) {
                // TODO: better error extraction methods will be needed
                const matched = failedOpMessage.match(/FailedOp\((.*)\)/);
                if (matched != null) {
                    const split = matched[1].split(',');
                    paymasterInfo = `(paymaster address: ${split[1]})`;
                    failedOpMessage = split[2];
                }
            }
            const error = new Error(`The bundler has failed to include UserOperation in a batch: ${failedOpMessage} ${paymasterInfo})`);
            error.stack = errorIn.stack;
            return error;
        }
        return errorIn;
    }
    async verifyAllNecessaryFields(transactionRequest) {
        if (transactionRequest.to == null) {
            throw new Error('Missing call target');
        }
        if (transactionRequest.data == null && transactionRequest.value == null) {
            // TBD: banning no-op UserOps seems to make sense on provider level
            throw new Error('Missing call data or value');
        }
    }
    connect(provider) {
        throw new Error('changing providers is not supported');
    }
    async getAddress() {
        if (this.address == null) {
            this.address = await this.erc4337provider.getSenderAccountAddress();
        }
        return this.address;
    }
    async signMessage(message) {
        return await this.originalSigner.signMessage(message);
    }
    async signTransaction(transaction) {
        throw new Error('not implemented');
    }
    async signUserOperation(userOperation) {
        const message = await this.smartAccountAPI.getUserOpHash(userOperation);
        return await this.originalSigner.signMessage(message);
    }
}
exports.ERC4337EthersSigner = ERC4337EthersSigner;
//# sourceMappingURL=ERC4337EthersSigner.js.map