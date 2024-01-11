"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAccountAPI = void 0;
const contracts_1 = require("@account-abstraction/contracts");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const calcPreVerificationGas_1 = require("./calcPreVerificationGas");
const utils_2 = require("../utils");
/**
 * Base class for all Smart Wallet ERC-4337 Clients to implement.
 * Subclass should inherit 5 methods to support a specific wallet contract:
 *
 * - getAccountInitCode - return the value to put into the "initCode" field, if the account is not yet deployed. should create the account instance using a factory contract.
 * - getNonce - return current account's nonce value
 * - encodeExecute - encode the call from entryPoint through our account to the target contract.
 * - signUserOpHash - sign the hash of a UserOp.
 *
 * The user can use the following APIs:
 * - createUnsignedUserOp - given "target" and "calldata", fill userOp to perform that operation from the account.
 * - createSignedUserOp - helper to call the above createUnsignedUserOp, and then extract the userOpHash and sign it
 */
class BaseAccountAPI {
    /**
     * base constructor.
     * subclass SHOULD add parameters that define the owner (signer) of this wallet
     * @param params
     */
    constructor(params) {
        this.isPhantom = true;
        this.provider = params.provider;
        this.overheads = params.overheads;
        this.entryPointAddress = params.entryPointAddress;
        this.accountAddress = params.accountAddress;
        this.paymasterAPI = params.paymasterAPI;
        // factory "connect" define the contract address. the contract "connect" defines the "from" address.
        this.entryPointView = contracts_1.EntryPoint__factory.connect(params.entryPointAddress, params.provider).connect(ethers_1.ethers.constants.AddressZero);
    }
    async init() {
        if ((await this.provider.getCode(this.entryPointAddress)) === '0x') {
            throw new Error(`entryPoint not deployed at ${this.entryPointAddress}`);
        }
        await this.getAccountAddress();
        return this;
    }
    /**
     * check if the contract is already deployed.
     */
    async checkAccountPhantom() {
        if (!this.isPhantom) {
            // already deployed. no need to check anymore.
            return this.isPhantom;
        }
        const senderAddressCode = await this.provider.getCode(this.getAccountAddress());
        if (senderAddressCode.length > 2) {
            // console.log(`SimpleAccount Contract already deployed at ${this.senderAddress}`)
            this.isPhantom = false;
        }
        else {
            // console.log(`SimpleAccount Contract is NOT YET deployed at ${this.senderAddress} - working in "phantom account" mode.`)
        }
        return this.isPhantom;
    }
    /**
     * calculate the account address even before it is deployed
     */
    async getCounterFactualAddress() {
        const initCode = this.getAccountInitCode();
        // use entryPoint to query account address (factory can provide a helper method to do the same, but
        // this method attempts to be generic
        try {
            await this.entryPointView.callStatic.getSenderAddress(initCode);
        }
        catch (e) {
            if (e.errorArgs == null) {
                throw e;
            }
            return e.errorArgs.sender;
        }
        throw new Error('must handle revert');
    }
    /**
     * return initCode value to into the UserOp.
     * (either deployment code, or empty hex if contract already deployed)
     */
    async getInitCode() {
        if (await this.checkAccountPhantom()) {
            return await this.getAccountInitCode();
        }
        return '0x';
    }
    /**
     * return maximum gas used for verification.
     * NOTE: createUnsignedUserOp will add to this value the cost of creation, if the contract is not yet created.
     */
    async getVerificationGasLimit() {
        return 100000;
    }
    /**
     * should cover cost of putting calldata on-chain, and some overhead.
     * actual overhead depends on the expected bundle size
     * @param userOp
     */
    async getPreVerificationGas(userOp) {
        const p = await (0, utils_1.resolveProperties)(userOp);
        return (0, calcPreVerificationGas_1.calcPreVerificationGas)(p, this.overheads);
    }
    /**
     * ABI-encode a user operation. used for calldata cost estimation
     * @param userOp
     */
    packUserOp(userOp) {
        return (0, utils_2.packUserOp)(userOp, false);
    }
    async encodeUserOpCallDataAndGasLimit(detailsForUserOp) {
        var _a, _b;
        /**
         *
         * @param a
         */
        function parseNumber(a) {
            if (a == null || a === '') {
                return null;
            }
            return ethers_1.BigNumber.from(a.toString());
        }
        const value = (_a = parseNumber(detailsForUserOp.value)) !== null && _a !== void 0 ? _a : ethers_1.BigNumber.from(0);
        const callData = await this.encodeExecute(detailsForUserOp.target, value, detailsForUserOp.data);
        const callGasLimit = (_b = parseNumber(detailsForUserOp.gasLimit)) !== null && _b !== void 0 ? _b : (await this.provider.estimateGas({
            from: this.entryPointAddress,
            to: this.getAccountAddress(),
            data: callData,
        }));
        return {
            callData,
            callGasLimit,
        };
    }
    /**
     * return userOpHash for signing.
     * This value matches entryPoint.getUserOpHash (calculated off-chain, to avoid a view call)
     * @param userOp - userOperation, (signature field ignored)
     */
    async getUserOpHash(userOp) {
        const op = await (0, utils_1.resolveProperties)(userOp);
        const chainId = await this.provider.getNetwork().then((net) => net.chainId);
        return (0, utils_2.getUserOpHash)(op, this.entryPointAddress, chainId);
    }
    /**
     * return the account's address.
     * this value is valid even before deploying the contract.
     */
    async getAccountAddress() {
        if (this.senderAddress == null) {
            if (this.accountAddress != null) {
                this.senderAddress = this.accountAddress;
            }
            else {
                this.senderAddress = await this.getCounterFactualAddress();
            }
        }
        return this.senderAddress;
    }
    async estimateCreationGas(initCode) {
        if (initCode == null || initCode === '0x') {
            return 0;
        }
        const deployerAddress = initCode.substring(0, 42);
        const deployerCallData = `0x${initCode.substring(42)}`;
        return await this.provider.estimateGas({
            to: deployerAddress,
            data: deployerCallData,
        });
    }
    /**
     * create a UserOperation, filling all details (except signature)
     * - if account is not yet created, add initCode to deploy it.
     * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
     * @param info
     */
    async createUnsignedUserOp(info) {
        var _a, _b, _c;
        const { callData, callGasLimit } = await this.encodeUserOpCallDataAndGasLimit(info);
        const initCode = await this.getInitCode();
        const initGas = await this.estimateCreationGas(initCode);
        const verificationGasLimit = ethers_1.BigNumber.from(await this.getVerificationGasLimit()).add(initGas);
        let { maxFeePerGas, maxPriorityFeePerGas } = info;
        if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
            const feeData = await this.provider.getFeeData();
            if (maxFeePerGas == null) {
                maxFeePerGas = (_a = feeData.maxFeePerGas) !== null && _a !== void 0 ? _a : undefined;
            }
            if (maxPriorityFeePerGas == null) {
                maxPriorityFeePerGas = (_b = feeData.maxPriorityFeePerGas) !== null && _b !== void 0 ? _b : undefined;
            }
        }
        const partialUserOp = {
            sender: this.getAccountAddress(),
            nonce: (_c = info.nonce) !== null && _c !== void 0 ? _c : this.getNonce(),
            initCode,
            callData,
            callGasLimit,
            verificationGasLimit,
            maxFeePerGas,
            maxPriorityFeePerGas,
            paymasterAndData: '0x',
        };
        let paymasterAndData;
        if (this.paymasterAPI != null) {
            // fill (partial) preVerificationGas (all except the cost of the generated paymasterAndData)
            const userOpForPm = Object.assign(Object.assign({}, partialUserOp), { preVerificationGas: await this.getPreVerificationGas(partialUserOp) });
            paymasterAndData = await this.paymasterAPI.getPaymasterAndData(userOpForPm);
        }
        partialUserOp.paymasterAndData = paymasterAndData !== null && paymasterAndData !== void 0 ? paymasterAndData : '0x';
        return Object.assign(Object.assign({}, partialUserOp), { preVerificationGas: this.getPreVerificationGas(partialUserOp), signature: '' });
    }
    /**
     * Sign the filled userOp.
     * @param userOp - the UserOperation to sign (with signature field ignored)
     */
    async signUserOp(userOp) {
        const userOpHash = await this.getUserOpHash(userOp);
        const signature = this.signUserOpHash(userOpHash);
        return Object.assign(Object.assign({}, userOp), { signature });
    }
    /**
     * helper method: create and sign a user operation.
     * @param info - transaction details for the userOp
     */
    async createSignedUserOp(info) {
        return await this.signUserOp(await this.createUnsignedUserOp(info));
    }
    /**
     * get the transaction that has this userOpHash mined, or null if not found
     * @param userOpHash - returned by sendUserOpToBundler (or by getUserOpHash..)
     * @param timeout - stop waiting after this timeout
     * @param interval - time to wait between polls.
     * @returns the transactionHash this userOp was mined, or null if not found.
     */
    async getUserOpReceipt(userOpHash, timeout = 30000, interval = 5000) {
        const endtime = Date.now() + timeout;
        while (Date.now() < endtime) {
            const events = await this.entryPointView.queryFilter(this.entryPointView.filters.UserOperationEvent(userOpHash));
            if (events.length > 0) {
                return events[0].transactionHash;
            }
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        return null;
    }
}
exports.BaseAccountAPI = BaseAccountAPI;
//# sourceMappingURL=BaseAccountAPI.js.map