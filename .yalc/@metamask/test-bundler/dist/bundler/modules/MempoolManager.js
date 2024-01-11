"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MempoolManager = void 0;
const debug_1 = __importDefault(require("debug"));
const ethers_1 = require("ethers");
const utils_1 = require("../../utils");
const debug = (0, debug_1.default)('aa.mempool');
const MAX_MEMPOOL_USEROPS_PER_SENDER = 4;
const THROTTLED_ENTITY_MEMPOOL_COUNT = 4;
class MempoolManager {
    entryCount(address) {
        return this._entryCount[address.toLowerCase()];
    }
    incrementEntryCount(address) {
        var _a;
        address = address === null || address === void 0 ? void 0 : address.toLowerCase();
        if (address == null) {
            return;
        }
        this._entryCount[address] = ((_a = this._entryCount[address]) !== null && _a !== void 0 ? _a : 0) + 1;
    }
    decrementEntryCount(address) {
        var _a, _b;
        address = address === null || address === void 0 ? void 0 : address.toLowerCase();
        if (address == null || this._entryCount[address] == null) {
            return;
        }
        this._entryCount[address] = ((_a = this._entryCount[address]) !== null && _a !== void 0 ? _a : 0) - 1;
        if (((_b = this._entryCount[address]) !== null && _b !== void 0 ? _b : 0) <= 0) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete this._entryCount[address];
        }
    }
    constructor(reputationManager) {
        this.reputationManager = reputationManager;
        this.mempool = [];
        // count entities in mempool.
        this._entryCount = {};
    }
    count() {
        return this.mempool.length;
    }
    // add userOp into the mempool, after initial validation.
    // replace existing, if any (and if new gas is higher)
    // revets if unable to add UserOp to mempool (too many UserOps with this sender)
    addUserOp(userOp, userOpHash, prefund, referencedContracts, senderInfo, paymasterInfo, factoryInfo, aggregatorInfo) {
        const entry = {
            userOp,
            userOpHash,
            prefund,
            referencedContracts,
            aggregator: aggregatorInfo === null || aggregatorInfo === void 0 ? void 0 : aggregatorInfo.addr,
        };
        const index = this._findBySenderNonce(userOp.sender, userOp.nonce);
        if (index !== -1) {
            const oldEntry = this.mempool[index];
            this.checkReplaceUserOp(oldEntry, entry);
            debug('replace userOp', userOp.sender, userOp.nonce);
            this.mempool[index] = entry;
        }
        else {
            debug('add userOp', userOp.sender, userOp.nonce);
            this.incrementEntryCount(userOp.sender);
            const paymaster = (0, utils_1.getAddr)(userOp.paymasterAndData);
            if (paymaster != null) {
                this.incrementEntryCount(paymaster);
            }
            const factory = (0, utils_1.getAddr)(userOp.initCode);
            if (factory != null) {
                this.incrementEntryCount(factory);
            }
            this.checkReputation(senderInfo, paymasterInfo, factoryInfo, aggregatorInfo);
            this.checkMultipleRolesViolation(userOp);
            this.mempool.push(entry);
        }
        this.updateSeenStatus(aggregatorInfo === null || aggregatorInfo === void 0 ? void 0 : aggregatorInfo.addr, userOp, senderInfo);
    }
    updateSeenStatus(aggregator, userOp, senderInfo) {
        try {
            this.reputationManager.checkStake('account', senderInfo);
            this.reputationManager.updateSeenStatus(userOp.sender);
        }
        catch (e) {
            if (!(e instanceof utils_1.RpcError)) {
                throw e;
            }
        }
        this.reputationManager.updateSeenStatus(aggregator);
        this.reputationManager.updateSeenStatus((0, utils_1.getAddr)(userOp.paymasterAndData));
        this.reputationManager.updateSeenStatus((0, utils_1.getAddr)(userOp.initCode));
    }
    // TODO: de-duplicate code
    // TODO 2: use configuration parameters instead of hard-coded constants
    checkReputation(senderInfo, paymasterInfo, factoryInfo, aggregatorInfo) {
        this.checkReputationStatus('account', senderInfo, MAX_MEMPOOL_USEROPS_PER_SENDER);
        if (paymasterInfo != null) {
            this.checkReputationStatus('paymaster', paymasterInfo);
        }
        if (factoryInfo != null) {
            this.checkReputationStatus('deployer', factoryInfo);
        }
        if (aggregatorInfo != null) {
            this.checkReputationStatus('aggregator', aggregatorInfo);
        }
    }
    checkMultipleRolesViolation(userOp) {
        var _a, _b, _c, _d;
        const knownEntities = this.getKnownEntities();
        (0, utils_1.requireCond)(!knownEntities.includes(userOp.sender.toLowerCase()), `The sender address "${userOp.sender}" is used as a different entity in another UserOperation currently in mempool`, utils_1.ValidationErrors.OpcodeValidation);
        const knownSenders = this.getKnownSenders();
        const paymaster = (_a = (0, utils_1.getAddr)(userOp.paymasterAndData)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        const factory = (_b = (0, utils_1.getAddr)(userOp.initCode)) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        const isPaymasterSenderViolation = knownSenders.includes((_c = paymaster === null || paymaster === void 0 ? void 0 : paymaster.toLowerCase()) !== null && _c !== void 0 ? _c : '');
        const isFactorySenderViolation = knownSenders.includes((_d = factory === null || factory === void 0 ? void 0 : factory.toLowerCase()) !== null && _d !== void 0 ? _d : '');
        (0, utils_1.requireCond)(!isPaymasterSenderViolation, `A Paymaster at ${paymaster} in this UserOperation is used as a sender entity in another UserOperation currently in mempool.`, utils_1.ValidationErrors.OpcodeValidation);
        (0, utils_1.requireCond)(!isFactorySenderViolation, `A Factory at ${factory} in this UserOperation is used as a sender entity in another UserOperation currently in mempool.`, utils_1.ValidationErrors.OpcodeValidation);
    }
    checkReputationStatus(title, stakeInfo, maxTxMempoolAllowedOverride) {
        var _a;
        const maxTxMempoolAllowedEntity = maxTxMempoolAllowedOverride !== null && maxTxMempoolAllowedOverride !== void 0 ? maxTxMempoolAllowedOverride : this.reputationManager.calculateMaxAllowedMempoolOpsUnstaked(stakeInfo.addr);
        this.reputationManager.checkBanned(title, stakeInfo);
        const entryCount = (_a = this.entryCount(stakeInfo.addr)) !== null && _a !== void 0 ? _a : 0;
        if (entryCount > THROTTLED_ENTITY_MEMPOOL_COUNT) {
            this.reputationManager.checkThrottled(title, stakeInfo);
        }
        if (entryCount > maxTxMempoolAllowedEntity) {
            this.reputationManager.checkStake(title, stakeInfo);
        }
    }
    checkReplaceUserOp(oldEntry, entry) {
        const oldMaxPriorityFeePerGas = ethers_1.BigNumber.from(oldEntry.userOp.maxPriorityFeePerGas).toNumber();
        const newMaxPriorityFeePerGas = ethers_1.BigNumber.from(entry.userOp.maxPriorityFeePerGas).toNumber();
        const oldMaxFeePerGas = ethers_1.BigNumber.from(oldEntry.userOp.maxFeePerGas).toNumber();
        const newMaxFeePerGas = ethers_1.BigNumber.from(entry.userOp.maxFeePerGas).toNumber();
        // the error is "invalid fields", even though it is detected only after validation
        (0, utils_1.requireCond)(newMaxPriorityFeePerGas >= oldMaxPriorityFeePerGas * 1.1, `Replacement UserOperation must have higher maxPriorityFeePerGas (old=${oldMaxPriorityFeePerGas} new=${newMaxPriorityFeePerGas}) `, utils_1.ValidationErrors.InvalidFields);
        (0, utils_1.requireCond)(newMaxFeePerGas >= oldMaxFeePerGas * 1.1, `Replacement UserOperation must have higher maxFeePerGas (old=${oldMaxFeePerGas} new=${newMaxFeePerGas}) `, utils_1.ValidationErrors.InvalidFields);
    }
    getSortedForInclusion() {
        const copy = Array.from(this.mempool);
        /**
         *
         * @param op
         */
        function cost(op) {
            // TODO: need to consult basefee and maxFeePerGas
            return ethers_1.BigNumber.from(op.maxPriorityFeePerGas).toNumber();
        }
        copy.sort((a, b) => cost(a.userOp) - cost(b.userOp));
        return copy;
    }
    _findBySenderNonce(sender, nonce) {
        for (let i = 0; i < this.mempool.length; i++) {
            const curOp = this.mempool[i].userOp;
            if (curOp.sender === sender && curOp.nonce === nonce) {
                return i;
            }
        }
        return -1;
    }
    _findByHash(hash) {
        for (let i = 0; i < this.mempool.length; i++) {
            const curOp = this.mempool[i];
            if (curOp.userOpHash === hash) {
                return i;
            }
        }
        return -1;
    }
    /**
     * remove UserOp from mempool. either it is invalid, or was included in a block
     * @param userOpOrHash
     */
    removeUserOp(userOpOrHash) {
        let index;
        if (typeof userOpOrHash === 'string') {
            index = this._findByHash(userOpOrHash);
        }
        else {
            index = this._findBySenderNonce(userOpOrHash.sender, userOpOrHash.nonce);
        }
        if (index !== -1) {
            const { userOp } = this.mempool[index];
            debug('removeUserOp', userOp.sender, userOp.nonce);
            this.mempool.splice(index, 1);
            this.decrementEntryCount(userOp.sender);
            this.decrementEntryCount((0, utils_1.getAddr)(userOp.paymasterAndData));
            this.decrementEntryCount((0, utils_1.getAddr)(userOp.initCode));
            // TODO: store and remove aggregator entity count
        }
    }
    /**
     * debug: dump mempool content
     */
    dump() {
        return this.mempool.map((entry) => entry.userOp);
    }
    /**
     * for debugging: clear current in-memory state
     */
    clearState() {
        this.mempool = [];
        this._entryCount = {};
    }
    /**
     * Returns all addresses that are currently known to be "senders" according to the current mempool.
     */
    getKnownSenders() {
        return this.mempool.map((it) => {
            return it.userOp.sender.toLowerCase();
        });
    }
    /**
     * Returns all addresses that are currently known to be any kind of entity according to the current mempool.
     * Note that "sender" addresses are not returned by this function. Use {@link getKnownSenders} instead.
     */
    getKnownEntities() {
        const res = [];
        const userOps = this.mempool;
        res.push(...userOps.map((it) => {
            return (0, utils_1.getAddr)(it.userOp.paymasterAndData);
        }));
        res.push(...userOps.map((it) => {
            return (0, utils_1.getAddr)(it.userOp.initCode);
        }));
        return res
            .filter((it) => it != null)
            .map((it) => it.toLowerCase());
    }
}
exports.MempoolManager = MempoolManager;
//# sourceMappingURL=MempoolManager.js.map