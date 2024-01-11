"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initServer = void 0;
const contracts_1 = require("@account-abstraction/contracts");
const utils_1 = require("ethers/lib/utils");
const BundleManager_1 = require("./BundleManager");
const EventsManager_1 = require("./EventsManager");
const ExecutionManager_1 = require("./ExecutionManager");
const MempoolManager_1 = require("./MempoolManager");
const ReputationManager_1 = require("./ReputationManager");
const validation_manager_1 = require("../../validation-manager");
const Config_1 = require("../Config");
/**
 * initialize server modules.
 * returns the ExecutionManager and EventsManager (for handling events, to update reputation)
 * @param config
 * @param signer
 */
function initServer(config, signer) {
    var _a, _b;
    const entryPoint = contracts_1.EntryPoint__factory.connect(config.entryPoint, signer);
    const reputationManager = new ReputationManager_1.ReputationManager((0, Config_1.getNetworkProvider)(config.network), ReputationManager_1.BundlerReputationParams, (0, utils_1.parseEther)(config.minStake), config.minUnstakeDelay);
    const mempoolManager = new MempoolManager_1.MempoolManager(reputationManager);
    const validationManager = new validation_manager_1.ValidationManager(entryPoint, config.unsafe);
    const eventsManager = new EventsManager_1.EventsManager(entryPoint, mempoolManager, reputationManager);
    const bundleManager = new BundleManager_1.BundleManager(entryPoint, eventsManager, mempoolManager, validationManager, reputationManager, config.beneficiary, (0, utils_1.parseEther)(config.minBalance), config.maxBundleGas, config.conditionalRpc);
    const executionManager = new ExecutionManager_1.ExecutionManager(reputationManager, mempoolManager, bundleManager, validationManager);
    reputationManager.addWhitelist(...((_a = config.whitelist) !== null && _a !== void 0 ? _a : []));
    reputationManager.addBlacklist(...((_b = config.blacklist) !== null && _b !== void 0 ? _b : []));
    executionManager.setAutoBundler(config.autoBundleInterval, config.autoBundleMempoolSize);
    return [executionManager, eventsManager, reputationManager, mempoolManager];
}
exports.initServer = initServer;
//# sourceMappingURL=initServer.js.map