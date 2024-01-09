"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionManager = void 0;
const debug_1 = __importDefault(require("debug"));
const async_mutex_1 = require("async-mutex");
const timers_1 = require("timers");
const debug = (0, debug_1.default)('aa.exec');
/**
 * execute userOps manually or using background timer.
 * This is the top-level interface to send UserOperation
 */
class ExecutionManager {
    constructor(reputationManager, mempoolManager, bundleManager, validationManager) {
        this.reputationManager = reputationManager;
        this.mempoolManager = mempoolManager;
        this.bundleManager = bundleManager;
        this.validationManager = validationManager;
        this.maxMempoolSize = 0; // default to auto-mining
        this.autoInterval = 0;
        this.mutex = new async_mutex_1.Mutex();
    }
    /**
     * send a user operation through the bundler.
     * @param userOp the UserOp to send.
     */
    async sendUserOperation(userOp, entryPointInput) {
        await this.mutex.runExclusive(async () => {
            debug('sendUserOperation');
            this.validationManager.validateInputParameters(userOp, entryPointInput);
            const validationResult = await this.validationManager.validateUserOp(userOp, undefined);
            const userOpHash = await this.validationManager.entryPoint.getUserOpHash(userOp);
            this.mempoolManager.addUserOp(userOp, userOpHash, validationResult.returnInfo.prefund, validationResult.referencedContracts, validationResult.senderInfo, validationResult.paymasterInfo, validationResult.factoryInfo, validationResult.aggregatorInfo);
            await this.attemptBundle(false);
        });
    }
    setReputationCron(interval) {
        debug('set reputation interval to', interval);
        (0, timers_1.clearInterval)(this.reputationCron);
        if (interval !== 0) {
            this.reputationCron = setInterval(() => this.reputationManager.hourlyCron(), interval);
        }
    }
    /**
     * set automatic bundle creation
     * @param autoBundleInterval autoBundleInterval to check. send bundle anyway after this time is elapsed. zero for manual mode
     * @param maxMempoolSize maximum # of pending mempool entities. send immediately when there are that many entities in the mempool.
     *    set to zero (or 1) to automatically send each UserOp.
     * (note: there is a chance that the sent bundle will contain less than this number, in case only some mempool entities can be sent.
     *  e.g. throttled paymaster)
     */
    setAutoBundler(autoBundleInterval, maxMempoolSize) {
        debug('set auto-bundle autoBundleInterval=', autoBundleInterval, 'maxMempoolSize=', maxMempoolSize);
        (0, timers_1.clearInterval)(this.autoBundleInterval);
        this.autoInterval = autoBundleInterval;
        if (autoBundleInterval !== 0) {
            this.autoBundleInterval = setInterval(() => {
                void this.attemptBundle(true).catch(e => console.error('auto-bundle failed', e));
            }, autoBundleInterval * 1000);
        }
        this.maxMempoolSize = maxMempoolSize;
    }
    /**
     * attempt to send a bundle now.
     * @param force
     */
    async attemptBundle(force = true) {
        debug('attemptBundle force=', force, 'count=', this.mempoolManager.count(), 'max=', this.maxMempoolSize);
        if (force || this.mempoolManager.count() >= this.maxMempoolSize) {
            const ret = await this.bundleManager.sendNextBundle();
            if (this.maxMempoolSize === 0) {
                // in "auto-bundling" mode (which implies auto-mining) also flush mempool from included UserOps
                await this.bundleManager.handlePastEvents();
            }
            return ret;
        }
    }
}
exports.ExecutionManager = ExecutionManager;
//# sourceMappingURL=ExecutionManager.js.map