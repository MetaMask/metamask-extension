var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    const DEFAULT_UPDATE_INTERVAL = 1000;
    /**
     * Controller class that polls for token exchange
     * rates based on the current account's token list
     */
    class TokenRatesController extends BaseController_1.default {
        /**
         * Creates a TokenRatesController
         *
         * @param config - Options to configure this controller
         */
        constructor(config, initialState) {
            super(config, initialState);
            const { interval = DEFAULT_UPDATE_INTERVAL, preferencesController } = config;
            this.onPreferencesUpdate = this.onPreferencesUpdate.bind(this);
            this.interval = interval;
            this.preferencesController = preferencesController;
        }
        onPreferencesUpdate({ tokens = [] }) {
            this.tokens = tokens;
        }
        /**
         * @param interval - Polling interval used to fetch new token rates
         */
        set interval(interval) {
            this.handle && clearInterval(this.handle);
            this.handle = window.setInterval(() => { this.updateExchangeRates(); }, interval);
        }
        /**
         * @param preferencesController - PreferencesControllers used to retrieve account tokens
         */
        set preferencesController(preferences) {
            this.preferences && this.preferences.unsubscribe(this.onPreferencesUpdate);
            this.preferences = preferences;
            this.tokens = preferences.state.tokens;
            preferences.subscribe(this.onPreferencesUpdate);
        }
        /**
         * @param tokens - List of tokens to track exchange rates for
         */
        set tokens(tokens) {
            this.tokenList = tokens;
            this.updateExchangeRates();
        }
        /**
         * Fetches a token exchange rate by address
         *
         * @param address - Token contract address
         * @returns - Promise resolving to exchange rate for given contract address
         */
        fetchExchangeRate(address) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield fetch(`https://metamask.balanc3.net/prices?from=${address}&to=ETH&autoConversion=false&summaryOnly=true`);
                    const json = yield response.json();
                    return json && json.length ? json[0].averagePrice : 0;
                }
                catch (error) {
                    return 0;
                }
            });
        }
        /**
         * Updates exchange rates for all tokens
         */
        updateExchangeRates() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.disabled) {
                    return;
                }
                const contractExchangeRates = {};
                for (const i in this.tokenList) {
                    const address = this.tokenList[i].address;
                    contractExchangeRates[address] = yield this.fetchExchangeRate(address);
                }
                this.updateState({ contractExchangeRates });
            });
        }
    }
    exports.TokenRatesController = TokenRatesController;
    exports.default = TokenRatesController;
});
