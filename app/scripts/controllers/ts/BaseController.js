(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Controller class that provides subscription capabilities and
     * defines a standard interface other controllers must implement
     */
    class BaseController {
        /**
         * Creates a BaseController
         *
         * @param - Initial state to set on this controller
         */
        constructor(config, initialState) {
            this.listeners = [];
            this.disabled = config.disabled;
            this.state = initialState;
        }
        /**
         * Retrieves internal state
         *
         * @returns - Current internal state
         */
        get state() {
            return this.internalState;
        }
        /**
         * Updates internal state
         *
         * @param state - New state to store
         */
        set state(state) {
            this.internalState = Object.assign({}, state) || {};
            this.notify();
        }
        /**
         * Notifies all subscribed listeners of current state
         */
        notify() {
            !this.disabled && this.listeners.forEach(listener => { listener(this.internalState); });
        }
        /**
         * Adds new listener to be notified of state changes
         *
         * @param listener - Callback triggered when state changes
         */
        subscribe(listener) {
            this.listeners.push(listener);
        }
        /**
         * Removes existing listener from receiving state changes
         *
         * @param listener - Callback to remove
         * @returns - True if a listener is found and unsubscribed
         */
        unsubscribe(listener) {
            const index = this.listeners.findIndex(cachedListener => listener === cachedListener);
            index > -1 && this.listeners.splice(index, 1);
            return index > -1 ? true : false;
        }
        /**
         * Merges new state on top of existing state
         */
        updateState(data) {
            this.state = Object.assign(this.internalState, data);
        }
    }
    exports.BaseController = BaseController;
    exports.default = BaseController;
});
