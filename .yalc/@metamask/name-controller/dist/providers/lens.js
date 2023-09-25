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
exports.LensNameProvider = void 0;
const logger_1 = require("../logger");
const types_1 = require("../types");
const util_1 = require("../util");
const ID = 'lens';
const LABEL = 'Lens Protocol';
const LENS_URL = `https://api.lens.dev`;
const QUERY = `
query HandlesForAddress($address: EthereumAddress!) {
  profiles(request: { ownedBy: [$address] }) {
    items {
      handle
    }
  }
}`;
const log = (0, logger_1.createModuleLogger)(logger_1.projectLogger, 'lens');
class LensNameProvider {
    getMetadata() {
        return {
            sourceIds: { [types_1.NameType.ETHEREUM_ADDRESS]: [ID] },
            sourceLabels: { [ID]: LABEL },
        };
    }
    getProposedNames(request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { value } = request;
            const variables = { address: value };
            log('Sending request', { variables });
            try {
                const responseData = yield (0, util_1.graphQL)(LENS_URL, QUERY, variables);
                const profiles = (_b = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.profiles) === null || _a === void 0 ? void 0 : _a.items) !== null && _b !== void 0 ? _b : [];
                const proposedNames = profiles.map((profile) => profile.handle);
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
exports.LensNameProvider = LensNameProvider;
//# sourceMappingURL=lens.js.map