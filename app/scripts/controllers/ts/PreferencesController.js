(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./BaseController"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const BaseController_1 = require("./BaseController");
    const normalize = require('eth-sig-util').normalize;
    /**
     * Controller that maintains account preferences
     */
    class PreferencesController extends BaseController_1.default {
        /**
         * Creates a TokenRatesController
         *
         * @param config - Options to configure this controller
         */
        constructor(config, initialState) {
            super({}, Object.assign({}, initialState, {
                currentAccountTab: 'history',
                featureFlags: {},
                frequentRpcList: [],
                tokens: [],
                useBlockie: false
            }));
        }
        /**
         * Adds a new token to the token list or updates the token if
         * associated contract is an address that already exists
         *
         * @param rawAddress - Hex address of the token contract, potentially checksummed
         * @param symbol - Symbol of the token
         * @param decimals - Number of decimals the token uses
         * @returns - New token list
         */
        addToken(rawAddress, symbol, decimals) {
            const address = normalize(rawAddress);
            const tokens = this.state.tokens;
            const newToken = { address, symbol, decimals };
            const existingToken = tokens.find(token => token.address === address);
            const existingIndex = tokens.indexOf(existingToken);
            if (existingToken) {
                tokens[existingIndex] = newToken;
            }
            else {
                tokens.push(newToken);
            }
            this.updateState({ tokens });
            return tokens;
        }
        /**
         * Removes a specified token from the token list
         *
         * @param rawAddress - Hex address of the token contract to remove
         * @returns - New token list
         */
        removeToken(rawAddress) {
            const address = normalize(rawAddress);
            const tokens = this.state.tokens;
            const newTokens = tokens.filter(token => token.address !== address);
            this.updateState({ tokens: newTokens });
            return newTokens;
        }
        /**
         * Updates a boolean property on the internal featureFlags state object.
         *
         * @param feature - Key that corresponds to a UI feature.
         * @param activated - Indicates whether or not the UI feature should be displayed
         * @returns - Updated featureFlags object
         */
        setFeatureFlag(feature, activated) {
            const updatedFeatureFlags = Object.assign({}, this.state.featureFlags, { [feature]: activated });
            this.updateState({
                featureFlags: Object.assign({}, this.state.featureFlags, { [feature]: activated })
            });
            return this.state.featureFlags;
        }
        /**
         * Returns an updated rpcList based on the passed url and the current list.
         * The returned list will have a max length of 2. If the _url currently
         * exists in the list, it will be moved to the end of the list. The current
         * list is modified and returned.
         *
         * @param url - Rpc url to add to the frequentRpcList.
         * @returns - New frequentRpcList
         */
        updateFrequentRpcList(url) {
            const rpcList = this.state.frequentRpcList;
            const index = rpcList.findIndex(rpcUrl => rpcUrl === url);
            (index !== -1) && rpcList.splice(index, 1);
            (url !== 'http://localhost:8545') && rpcList.push(url);
            (rpcList.length > 2) && rpcList.shift();
            return rpcList;
        }
    }
    exports.PreferencesController = PreferencesController;
    exports.default = PreferencesController;
});
