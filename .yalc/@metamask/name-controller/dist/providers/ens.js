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
var _ENSNameProvider_reverseLookup;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENSNameProvider = void 0;
const logger_1 = require("../logger");
const types_1 = require("../types");
const ID = 'ens';
const LABEL = 'Ethereum Name Service (ENS)';
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'ens');
class ENSNameProvider {
    constructor({ reverseLookup }) {
        _ENSNameProvider_reverseLookup.set(this, void 0);
        __classPrivateFieldSet(this, _ENSNameProvider_reverseLookup, reverseLookup, "f");
    }
    getMetadata() {
        return {
            sourceIds: { [types_1.NameType.ETHEREUM_ADDRESS]: [ID] },
            sourceLabels: { [ID]: LABEL },
        };
    }
    getProposedNames(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { value, chainId } = request;
            log('Invoking callback', { value, chainId });
            try {
                const proposedName = yield __classPrivateFieldGet(this, _ENSNameProvider_reverseLookup, "f").call(this, value, chainId);
                const proposedNames = proposedName ? [proposedName] : [];
                log('New proposed names', proposedNames);
                return {
                    results: {
                        [ID]: { proposedNames },
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
exports.ENSNameProvider = ENSNameProvider;
_ENSNameProvider_reverseLookup = new WeakMap();
//# sourceMappingURL=ens.js.map