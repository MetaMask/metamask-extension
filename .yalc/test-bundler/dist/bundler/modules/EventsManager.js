"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsManager = void 0;
const debug_1 = __importDefault(require("debug"));
const debug = (0, debug_1.default)('aa.events');
/**
 * listen to events. trigger ReputationManager's Included
 */
class EventsManager {
    constructor(entryPoint, mempoolManager, reputationManager) {
        this.entryPoint = entryPoint;
        this.mempoolManager = mempoolManager;
        this.reputationManager = reputationManager;
        this.eventAggregator = null;
        this.eventAggregatorTxHash = null;
    }
    /**
     * automatically listen to all UserOperationEvent events
     */
    initEventListener() {
        this.entryPoint.on(this.entryPoint.filters.UserOperationEvent(), (...args) => {
            const ev = args.slice(-1)[0];
            void this.handleEvent(ev);
        });
    }
    /**
     * process all new events since last run
     */
    async handlePastEvents() {
        if (this.lastBlock === undefined) {
            this.lastBlock = Math.max(1, await this.entryPoint.provider.getBlockNumber() - 1000);
        }
        const events = await this.entryPoint.queryFilter({ address: this.entryPoint.address }, this.lastBlock);
        for (const ev of events) {
            this.handleEvent(ev);
        }
    }
    handleEvent(ev) {
        switch (ev.event) {
            case 'UserOperationEvent':
                this.handleUserOperationEvent(ev);
                break;
            case 'AccountDeployed':
                this.handleAccountDeployedEvent(ev);
                break;
            case 'SignatureAggregatorForUserOperations':
                this.handleAggregatorChangedEvent(ev);
                break;
        }
        this.lastBlock = ev.blockNumber + 1;
    }
    handleAggregatorChangedEvent(ev) {
        debug('handle ', ev.event, ev.args.aggregator);
        this.eventAggregator = ev.args.aggregator;
        this.eventAggregatorTxHash = ev.transactionHash;
    }
    // aggregator event is sent once per events bundle for all UserOperationEvents in this bundle.
    // it is not sent at all if the transaction is handleOps
    getEventAggregator(ev) {
        if (ev.transactionHash !== this.eventAggregatorTxHash) {
            this.eventAggregator = null;
            this.eventAggregatorTxHash = ev.transactionHash;
        }
        return this.eventAggregator;
    }
    // AccountDeployed event is sent before each UserOperationEvent that deploys a contract.
    handleAccountDeployedEvent(ev) {
        this._includedAddress(ev.args.factory);
    }
    handleUserOperationEvent(ev) {
        const hash = ev.args.userOpHash;
        this.mempoolManager.removeUserOp(hash);
        this._includedAddress(ev.args.sender);
        this._includedAddress(ev.args.paymaster);
        this._includedAddress(this.getEventAggregator(ev));
    }
    _includedAddress(data) {
        if (data != null && data.length >= 42) {
            const addr = data.slice(0, 42);
            this.reputationManager.updateIncludedStatus(addr);
        }
    }
}
exports.EventsManager = EventsManager;
//# sourceMappingURL=EventsManager.js.map