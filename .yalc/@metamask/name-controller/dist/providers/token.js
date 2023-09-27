"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TokenNameProvider_isEnabled;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenNameProvider = void 0;
const logger_1 = require("../logger");
const types_1 = require("../types");
const util_1 = require("../util");
const ID = 'token';
const LABEL = 'Blockchain (Token Name)';
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'token');
class TokenNameProvider {
    constructor({ isEnabled } = {}) {
        _TokenNameProvider_isEnabled.set(this, void 0);
        __classPrivateFieldSet(this, _TokenNameProvider_isEnabled, isEnabled || (() => true), "f");
    }
    getMetadata() {
        return {
            sourceIds: { [types_1.NameType.ETHEREUM_ADDRESS]: [ID] },
            sourceLabels: { [ID]: LABEL },
        };
    }
    getProposedNames(request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _TokenNameProvider_isEnabled, "f").call(this)) {
                log('Skipping request as disabled');
                return {
                    results: {
                        [ID]: {
                            proposedNames: [],
                        },
                    },
                };
            }
            const { value, variation: chainId } = request;
            const url = `https://token-api.metaswap.codefi.network/token/${chainId}?address=${value}`;
            log('Sending request', url);
            try {
                const responseData = yield (0, util_1.handleFetch)(url);
                const proposedName = responseData.name;
                const proposedNames = proposedName ? [proposedName] : [];
                log('New proposed names', proposedNames);
                return {
                    results: {
                        [ID]: {
                            proposedNames,
                        },
                    },
                };
            }
            catch (error) {
                log('Request failed', error);
                throw error;
            }
        });
    }
}
exports.TokenNameProvider = TokenNameProvider;
_TokenNameProvider_isEnabled = new WeakMap();
//# sourceMappingURL=token.js.map