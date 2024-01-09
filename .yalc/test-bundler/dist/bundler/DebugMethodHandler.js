"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugMethodHandler = void 0;
class DebugMethodHandler {
    constructor(execManager, eventsManager, repManager, mempoolMgr) {
        this.execManager = execManager;
        this.eventsManager = eventsManager;
        this.repManager = repManager;
        this.mempoolMgr = mempoolMgr;
    }
    setBundlingMode(mode) {
        this.setBundleInterval(mode);
    }
    setBundleInterval(interval, maxPoolSize = 100) {
        if (interval == null) {
            throw new Error('must specify interval <number>|manual|auto');
        }
        if (interval === 'auto') {
            // size=0 ==> auto-bundle on each userop
            this.execManager.setAutoBundler(0, 0);
        }
        else if (interval === 'manual') {
            // interval=0, but never auto-mine
            this.execManager.setAutoBundler(0, 1000);
        }
        else {
            this.execManager.setAutoBundler(interval, maxPoolSize);
        }
    }
    async sendBundleNow() {
        const ret = await this.execManager.attemptBundle(true);
        // handlePastEvents is performed before processing the next bundle.
        // however, in debug mode, we are interested in the side effects
        // (on the mempool) of this "sendBundle" operation
        await this.eventsManager.handlePastEvents();
        return ret;
    }
    clearState() {
        this.mempoolMgr.clearState();
        this.repManager.clearState();
    }
    async dumpMempool() {
        return this.mempoolMgr.dump();
    }
    clearMempool() {
        this.mempoolMgr.clearState();
    }
    setReputation(param) {
        return this.repManager.setReputation(param);
    }
    dumpReputation() {
        return this.repManager.dump();
    }
    clearReputation() {
        this.repManager.clearState();
    }
    async getStakeStatus(address, entryPoint) {
        return await this.repManager.getStakeStatus(address, entryPoint);
    }
}
exports.DebugMethodHandler = DebugMethodHandler;
//# sourceMappingURL=DebugMethodHandler.js.map