"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleManager = void 0;
const async_mutex_1 = require("async-mutex");
const debug_1 = __importDefault(require("debug"));
const ethers_1 = require("ethers");
const ReputationManager_1 = require("./ReputationManager");
const contract_types_1 = require("../../contract-types");
const utils_1 = require("../../utils");
const debug = (0, debug_1.default)('aa.exec.cron');
const THROTTLED_ENTITY_BUNDLE_COUNT = 4;
class BundleManager {
    constructor(entryPoint, eventsManager, mempoolManager, validationManager, reputationManager, beneficiary, minSignerBalance, maxBundleGas, 
    // use eth_sendRawTransactionConditional with storage map
    conditionalRpc, 
    // in conditionalRpc: always put root hash (not specific storage slots) for "sender" entries
    mergeToAccountRootHash = false) {
        this.entryPoint = entryPoint;
        this.eventsManager = eventsManager;
        this.mempoolManager = mempoolManager;
        this.validationManager = validationManager;
        this.reputationManager = reputationManager;
        this.beneficiary = beneficiary;
        this.minSignerBalance = minSignerBalance;
        this.maxBundleGas = maxBundleGas;
        this.conditionalRpc = conditionalRpc;
        this.mergeToAccountRootHash = mergeToAccountRootHash;
        this.mutex = new async_mutex_1.Mutex();
        this.provider = entryPoint.provider;
        this.signer = entryPoint.signer;
    }
    /**
     * attempt to send a bundle:
     * collect UserOps from mempool into a bundle
     * send this bundle.
     */
    async sendNextBundle() {
        return await this.mutex.runExclusive(async () => {
            debug('sendNextBundle');
            // first flush mempool from already-included UserOps, by actively scanning past events.
            await this.handlePastEvents();
            const [bundle, storageMap] = await this.createBundle();
            if (bundle.length === 0) {
                debug('sendNextBundle - no bundle to send');
            }
            else {
                const beneficiary = await this._selectBeneficiary();
                const ret = await this.sendBundle(bundle, beneficiary, storageMap);
                debug(`sendNextBundle exit - after sent a bundle of ${bundle.length} `);
                return ret;
            }
        });
    }
    async handlePastEvents() {
        await this.eventsManager.handlePastEvents();
    }
    /**
     * submit a bundle.
     * after submitting the bundle, remove all UserOps from the mempool
     * @param userOps
     * @param beneficiary
     * @param storageMap
     * @returns SendBundleReturn the transaction and UserOp hashes on successful transaction, or null on failed transaction
     */
    async sendBundle(userOps, beneficiary, storageMap) {
        var _a, _b, _c, _d;
        try {
            const feeData = await this.provider.getFeeData();
            const tx = await this.entryPoint.populateTransaction.handleOps(userOps, beneficiary, {
                type: 2,
                nonce: await this.signer.getTransactionCount(),
                gasLimit: 10e6,
                maxPriorityFeePerGas: (_a = feeData.maxPriorityFeePerGas) !== null && _a !== void 0 ? _a : 0,
                maxFeePerGas: (_b = feeData.maxFeePerGas) !== null && _b !== void 0 ? _b : 0,
            });
            tx.chainId = this.provider._network.chainId;
            const signedTx = await this.signer.signTransaction(tx);
            let ret;
            if (this.conditionalRpc) {
                debug('eth_sendRawTransactionConditional', storageMap);
                ret = await this.provider.send('eth_sendRawTransactionConditional', [
                    signedTx,
                    { knownAccounts: storageMap },
                ]);
                debug('eth_sendRawTransactionConditional ret=', ret);
            }
            else {
                // ret = await this.signer.sendTransaction(tx)
                ret = await this.provider.send('eth_sendRawTransaction', [signedTx]);
                debug('eth_sendRawTransaction ret=', ret);
            }
            // TODO: parse ret, and revert if needed.
            debug('ret=', ret);
            debug('sent handleOps with', userOps.length, 'ops. removing from mempool');
            // hashes are needed for debug rpc only.
            const hashes = await this.getUserOpHashes(userOps);
            return {
                transactionHash: ret,
                userOpHashes: hashes,
            };
        }
        catch (e) {
            let parsedError;
            try {
                parsedError = this.entryPoint.interface.parseError((_d = (_c = e.data) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : e.data);
            }
            catch (e1) {
                this.checkFatal(e);
                console.warn('Failed handleOps, but non-FailedOp error', e);
                return;
            }
            const { opIndex, reason } = parsedError.args;
            const userOp = userOps[opIndex];
            const reasonStr = reason.toString();
            if (reasonStr.startsWith('AA3')) {
                this.reputationManager.crashedHandleOps((0, utils_1.getAddr)(userOp.paymasterAndData));
            }
            else if (reasonStr.startsWith('AA2')) {
                this.reputationManager.crashedHandleOps(userOp.sender);
            }
            else if (reasonStr.startsWith('AA1')) {
                this.reputationManager.crashedHandleOps((0, utils_1.getAddr)(userOp.initCode));
            }
            else {
                this.mempoolManager.removeUserOp(userOp);
                console.warn(`Failed handleOps sender=${userOp.sender} reason=${reasonStr}`);
            }
        }
    }
    // fatal errors we know we can't recover
    checkFatal(e) {
        var _a;
        // console.log('ex entries=',Object.entries(e))
        if (((_a = e.error) === null || _a === void 0 ? void 0 : _a.code) === -32601) {
            throw e;
        }
    }
    async createBundle() {
        var _a, _b, _c, _d, _e, _f;
        const entries = this.mempoolManager.getSortedForInclusion();
        const bundle = [];
        // paymaster deposit should be enough for all UserOps in the bundle.
        const paymasterDeposit = {};
        // throttled paymasters and deployers are allowed only small UserOps per bundle.
        const stakedEntityCount = {};
        // each sender is allowed only once per bundle
        const senders = new Set();
        // all entities that are known to be valid senders in the mempool
        const knownSenders = this.mempoolManager.getKnownSenders();
        const storageMap = {};
        let totalGas = ethers_1.BigNumber.from(0);
        debug('got mempool of ', entries.length);
        // eslint-disable-next-line no-labels
        mainLoop: for (const entry of entries) {
            const paymaster = (0, utils_1.getAddr)(entry.userOp.paymasterAndData);
            const factory = (0, utils_1.getAddr)(entry.userOp.initCode);
            const paymasterStatus = this.reputationManager.getStatus(paymaster);
            const deployerStatus = this.reputationManager.getStatus(factory);
            if (paymasterStatus === ReputationManager_1.ReputationStatus.BANNED ||
                deployerStatus === ReputationManager_1.ReputationStatus.BANNED) {
                this.mempoolManager.removeUserOp(entry.userOp);
                continue;
            }
            // [SREP-030]
            if (paymaster != null &&
                ((_a = paymasterStatus === ReputationManager_1.ReputationStatus.THROTTLED) !== null && _a !== void 0 ? _a : ((_b = stakedEntityCount[paymaster]) !== null && _b !== void 0 ? _b : 0) > THROTTLED_ENTITY_BUNDLE_COUNT)) {
                debug('skipping throttled paymaster', entry.userOp.sender, entry.userOp.nonce);
                continue;
            }
            // [SREP-030]
            if (factory != null &&
                ((_c = deployerStatus === ReputationManager_1.ReputationStatus.THROTTLED) !== null && _c !== void 0 ? _c : ((_d = stakedEntityCount[factory]) !== null && _d !== void 0 ? _d : 0) > THROTTLED_ENTITY_BUNDLE_COUNT)) {
                debug('skipping throttled factory', entry.userOp.sender, entry.userOp.nonce);
                continue;
            }
            if (senders.has(entry.userOp.sender)) {
                debug('skipping already included sender', entry.userOp.sender, entry.userOp.nonce);
                // allow only a single UserOp per sender per bundle
                continue;
            }
            let validationResult;
            try {
                // re-validate UserOp. no need to check stake, since it cannot be reduced between first and 2nd validation
                validationResult = await this.validationManager.validateUserOp(entry.userOp, entry.referencedContracts, false);
            }
            catch (e) {
                debug('failed 2nd validation:', e.message);
                // failed validation. don't try anymore
                this.mempoolManager.removeUserOp(entry.userOp);
                continue;
            }
            for (const storageAddress of Object.keys(validationResult.storageMap)) {
                if (storageAddress.toLowerCase() !== entry.userOp.sender.toLowerCase() &&
                    knownSenders.includes(storageAddress.toLowerCase())) {
                    console.debug(`UserOperation from ${entry.userOp.sender} sender accessed a storage of another known sender ${storageAddress}`);
                    // eslint-disable-next-line no-labels
                    continue mainLoop;
                }
            }
            // todo: we take UserOp's callGasLimit, even though it will probably require less (but we don't
            // attempt to estimate it to check)
            // which means we could "cram" more UserOps into a bundle.
            const userOpGasCost = ethers_1.BigNumber.from(validationResult.returnInfo.preOpGas).add(entry.userOp.callGasLimit);
            const newTotalGas = totalGas.add(userOpGasCost);
            if (newTotalGas.gt(this.maxBundleGas)) {
                break;
            }
            if (paymaster != null) {
                if (paymasterDeposit[paymaster] == null) {
                    paymasterDeposit[paymaster] = await this.entryPoint.balanceOf(paymaster);
                }
                if (paymasterDeposit[paymaster].lt(validationResult.returnInfo.prefund)) {
                    // not enough balance in paymaster to pay for all UserOps
                    // (but it passed validation, so it can sponsor them separately
                    continue;
                }
                stakedEntityCount[paymaster] = ((_e = stakedEntityCount[paymaster]) !== null && _e !== void 0 ? _e : 0) + 1;
                paymasterDeposit[paymaster] = paymasterDeposit[paymaster].sub(validationResult.returnInfo.prefund);
            }
            if (factory != null) {
                stakedEntityCount[factory] = ((_f = stakedEntityCount[factory]) !== null && _f !== void 0 ? _f : 0) + 1;
            }
            // If sender's account already exist: replace with its storage root hash
            if (this.mergeToAccountRootHash &&
                this.conditionalRpc &&
                entry.userOp.initCode.length <= 2) {
                const { storageHash } = await this.provider.send('eth_getProof', [
                    entry.userOp.sender,
                    [],
                    'latest',
                ]);
                storageMap[entry.userOp.sender.toLowerCase()] = storageHash;
            }
            (0, utils_1.mergeStorageMap)(storageMap, validationResult.storageMap);
            senders.add(entry.userOp.sender);
            bundle.push(entry.userOp);
            totalGas = newTotalGas;
        }
        return [bundle, storageMap];
    }
    /**
     * determine who should receive the proceedings of the request.
     * if signer's balance is too low, send it to signer. otherwise, send to configured beneficiary.
     */
    async _selectBeneficiary() {
        const currentBalance = await this.provider.getBalance(this.signer.getAddress());
        let { beneficiary } = this;
        // below min-balance redeem to the signer, to keep it active.
        if (currentBalance.lte(this.minSignerBalance)) {
            beneficiary = await this.signer.getAddress();
            console.log('low balance. using ', beneficiary, 'as beneficiary instead of ', this.beneficiary);
        }
        return beneficiary;
    }
    // helper function to get hashes of all UserOps
    async getUserOpHashes(userOps) {
        const { userOpHashes } = await (0, utils_1.runContractScript)(this.entryPoint.provider, new contract_types_1.GetUserOpHashes__factory(), [this.entryPoint.address, userOps]);
        return userOpHashes;
    }
}
exports.BundleManager = BundleManager;
//# sourceMappingURL=BundleManager.js.map