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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenNameProvider = void 0;
const logger_1 = require("../logger");
const types_1 = require("../types");
const util_1 = require("../util");
const ID = 'token';
const LABEL = 'Blockchain (Token Name)';
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'token');
class TokenNameProvider {
    getMetadata() {
        return {
            sourceIds: { [types_1.NameType.ETHEREUM_ADDRESS]: [ID] },
            sourceLabels: { [ID]: LABEL },
        };
    }
    getProposedNames(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const { value, chainId } = request;
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
//# sourceMappingURL=token.js.map