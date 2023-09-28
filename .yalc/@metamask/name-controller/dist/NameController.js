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
var _NameController_instances, _NameController_providers, _NameController_updateDelay, _NameController_updateProposedNameState, _NameController_updateSourceState, _NameController_getUpdateProposedNamesResult, _NameController_getProviderResponse, _NameController_normalizeProviderResult, _NameController_normalizeProviderSourceResult, _NameController_normalizeValue, _NameController_normalizeVariation, _NameController_updateEntry, _NameController_getCurrentTimeSeconds, _NameController_validateSetNameRequest, _NameController_validateUpdateProposedNamesRequest, _NameController_validateValue, _NameController_validateType, _NameController_validateName, _NameController_validateSourceIds, _NameController_validateSourceId, _NameController_validateDuplicateSourceIds, _NameController_validateVariation, _NameController_getAllSourceIds, _NameController_getSourceIds, _NameController_removeDormantProposedNames;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameController = void 0;
const base_controller_1 = require("@metamask/base-controller");
const types_1 = require("./types");
const DEFAULT_UPDATE_DELAY = 60 * 2; // 2 Minutes
const DEFAULT_VARIATION = '';
const controllerName = 'NameController';
const stateMetadata = {
    names: { persist: true, anonymous: false },
    nameSources: { persist: true, anonymous: false },
};
const getDefaultState = () => ({
    names: {
        [types_1.NameType.ETHEREUM_ADDRESS]: {},
    },
    nameSources: {},
});
/**
 * Controller for storing and deriving names for values such as Ethereum addresses.
 */
class NameController extends base_controller_1.BaseControllerV2 {
    /**
     * Construct a Name controller.
     *
     * @param options - Controller options.
     * @param options.messenger - Restricted controller messenger for the name controller.
     * @param options.providers - Array of name provider instances to propose names.
     * @param options.state - Initial state to set on the controller.
     * @param options.updateDelay - The delay in seconds before a new request to a source should be made.
     */
    constructor({ messenger, providers, state, updateDelay, }) {
        super({
            name: controllerName,
            metadata: stateMetadata,
            messenger,
            state: Object.assign(Object.assign({}, getDefaultState()), state),
        });
        _NameController_instances.add(this);
        _NameController_providers.set(this, void 0);
        _NameController_updateDelay.set(this, void 0);
        __classPrivateFieldSet(this, _NameController_providers, providers, "f");
        __classPrivateFieldSet(this, _NameController_updateDelay, updateDelay !== null && updateDelay !== void 0 ? updateDelay : DEFAULT_UPDATE_DELAY, "f");
    }
    /**
     * Set the user specified name for a value.
     *
     * @param request - Request object.
     * @param request.name - Name to set.
     * @param request.sourceId - Optional ID of the source of the proposed name.
     * @param request.type - Type of value to set the name for.
     * @param request.value - Value to set the name for.
     */
    setName(request) {
        __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateSetNameRequest).call(this, request);
        const { value, type, name, sourceId: requestSourceId, variation } = request;
        const sourceId = requestSourceId !== null && requestSourceId !== void 0 ? requestSourceId : null;
        __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_updateEntry).call(this, value, type, variation, (entry) => {
            entry.name = name;
            entry.sourceId = sourceId;
        });
    }
    /**
     * Generate the proposed names for a value using the name providers and store them in the state.
     *
     * @param request - Request object.
     * @param request.value - Value to update the proposed names for.
     * @param request.type - Type of value to update the proposed names for.
     * @param request.sourceIds - Optional array of source IDs to limit which sources are used by the providers. If not provided, all sources in all providers will be used.
     * @returns The updated proposed names for the value.
     */
    updateProposedNames(request) {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateUpdateProposedNamesRequest).call(this, request);
            const providerResponses = (yield Promise.all(__classPrivateFieldGet(this, _NameController_providers, "f").map((provider) => __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getProviderResponse).call(this, request, provider)))).filter((response) => Boolean(response));
            __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_updateProposedNameState).call(this, request, providerResponses);
            __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_updateSourceState).call(this, __classPrivateFieldGet(this, _NameController_providers, "f"));
            return __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getUpdateProposedNamesResult).call(this, providerResponses);
        });
    }
}
exports.NameController = NameController;
_NameController_providers = new WeakMap(), _NameController_updateDelay = new WeakMap(), _NameController_instances = new WeakSet(), _NameController_updateProposedNameState = function _NameController_updateProposedNameState(request, providerResponses) {
    const { value, type, variation } = request;
    const currentTime = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getCurrentTimeSeconds).call(this);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_updateEntry).call(this, value, type, variation, (entry) => {
        var _a;
        __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_removeDormantProposedNames).call(this, entry.proposedNames, type);
        for (const providerResponse of providerResponses) {
            const { results } = providerResponse;
            for (const sourceId of Object.keys(providerResponse.results)) {
                const result = results[sourceId];
                const { proposedNames, updateDelay } = result;
                const proposedNameEntry = (_a = entry.proposedNames[sourceId]) !== null && _a !== void 0 ? _a : {
                    proposedNames: [],
                    lastRequestTime: null,
                    updateDelay: null,
                };
                entry.proposedNames[sourceId] = proposedNameEntry;
                if (proposedNames) {
                    proposedNameEntry.proposedNames = proposedNames;
                }
                proposedNameEntry.lastRequestTime = currentTime;
                proposedNameEntry.updateDelay = updateDelay !== null && updateDelay !== void 0 ? updateDelay : null;
            }
        }
    });
}, _NameController_updateSourceState = function _NameController_updateSourceState(providers) {
    const newNameSources = Object.assign({}, this.state.nameSources);
    for (const provider of providers) {
        const { sourceLabels } = provider.getMetadata();
        for (const sourceId of Object.keys(sourceLabels)) {
            newNameSources[sourceId] = {
                label: sourceLabels[sourceId],
            };
        }
    }
    this.update((state) => {
        state.nameSources = newNameSources;
    });
}, _NameController_getUpdateProposedNamesResult = function _NameController_getUpdateProposedNamesResult(providerResponses) {
    return providerResponses.reduce((acc, providerResponse) => {
        const { results } = providerResponse;
        for (const sourceId of Object.keys(results)) {
            const { proposedNames, error } = results[sourceId];
            acc.results[sourceId] = {
                proposedNames,
                error,
            };
        }
        return acc;
    }, { results: {} });
}, _NameController_getProviderResponse = function _NameController_getProviderResponse(request, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const { value, type, sourceIds: requestedSourceIds, onlyUpdateAfterDelay, variation, } = request;
        /* istanbul ignore next */
        const variationKey = variation !== null && variation !== void 0 ? variation : DEFAULT_VARIATION;
        const supportedSourceIds = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getSourceIds).call(this, provider, type);
        const currentTime = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getCurrentTimeSeconds).call(this);
        const normalizedValue = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeValue).call(this, value, type);
        const matchingSourceIds = supportedSourceIds.filter((sourceId) => {
            var _a, _b, _c, _d, _e, _f, _g;
            if (requestedSourceIds && !requestedSourceIds.includes(sourceId)) {
                return false;
            }
            if (onlyUpdateAfterDelay) {
                const entry = (_c = (_b = (_a = this.state.names[type]) === null || _a === void 0 ? void 0 : _a[normalizedValue]) === null || _b === void 0 ? void 0 : _b[variationKey]) !== null && _c !== void 0 ? _c : {};
                const proposedNamesEntry = (_e = (_d = entry.proposedNames) === null || _d === void 0 ? void 0 : _d[sourceId]) !== null && _e !== void 0 ? _e : {};
                const lastRequestTime = (_f = proposedNamesEntry.lastRequestTime) !== null && _f !== void 0 ? _f : 0;
                const updateDelay = (_g = proposedNamesEntry.updateDelay) !== null && _g !== void 0 ? _g : __classPrivateFieldGet(this, _NameController_updateDelay, "f");
                if (currentTime - lastRequestTime < updateDelay) {
                    return false;
                }
            }
            return true;
        });
        if (!matchingSourceIds.length) {
            return undefined;
        }
        const providerRequest = {
            value: __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeValue).call(this, value, type),
            type,
            sourceIds: requestedSourceIds ? matchingSourceIds : undefined,
            variation: __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeVariation).call(this, variationKey, type),
        };
        let responseError;
        let response;
        try {
            response = yield provider.getProposedNames(providerRequest);
            responseError = response.error;
        }
        catch (error) {
            responseError = error;
        }
        return __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeProviderResult).call(this, response, responseError, matchingSourceIds);
    });
}, _NameController_normalizeProviderResult = function _NameController_normalizeProviderResult(result, responseError, matchingSourceIds) {
    const error = responseError !== null && responseError !== void 0 ? responseError : undefined;
    const results = matchingSourceIds.reduce((acc, sourceId) => {
        var _a;
        const sourceResult = (_a = result === null || result === void 0 ? void 0 : result.results) === null || _a === void 0 ? void 0 : _a[sourceId];
        const normalizedSourceResult = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeProviderSourceResult).call(this, sourceResult, responseError);
        return Object.assign(Object.assign({}, acc), { [sourceId]: normalizedSourceResult });
    }, {});
    return { results, error };
}, _NameController_normalizeProviderSourceResult = function _NameController_normalizeProviderSourceResult(result, responseError) {
    var _a, _b, _c, _d;
    const error = (_b = (_a = result === null || result === void 0 ? void 0 : result.error) !== null && _a !== void 0 ? _a : responseError) !== null && _b !== void 0 ? _b : undefined;
    const updateDelay = (_c = result === null || result === void 0 ? void 0 : result.updateDelay) !== null && _c !== void 0 ? _c : undefined;
    let proposedNames = error ? undefined : (_d = result === null || result === void 0 ? void 0 : result.proposedNames) !== null && _d !== void 0 ? _d : undefined;
    if (proposedNames) {
        proposedNames = proposedNames.filter((proposedName) => proposedName === null || proposedName === void 0 ? void 0 : proposedName.length);
    }
    return {
        proposedNames,
        error,
        updateDelay,
    };
}, _NameController_normalizeValue = function _NameController_normalizeValue(value, type) {
    /* istanbul ignore next */
    switch (type) {
        case types_1.NameType.ETHEREUM_ADDRESS:
            return value.toLowerCase();
        default:
            return value;
    }
}, _NameController_normalizeVariation = function _NameController_normalizeVariation(variation, type) {
    /* istanbul ignore next */
    switch (type) {
        case types_1.NameType.ETHEREUM_ADDRESS:
            return variation.toLowerCase();
        default:
            return variation;
    }
}, _NameController_updateEntry = function _NameController_updateEntry(value, type, variation, callback) {
    /* istanbul ignore next */
    const variationKey = variation !== null && variation !== void 0 ? variation : DEFAULT_VARIATION;
    const normalizedValue = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeValue).call(this, value, type);
    const normalizedVariation = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_normalizeVariation).call(this, variationKey, type);
    this.update((state) => {
        var _a;
        const typeEntries = state.names[type] || {};
        state.names[type] = typeEntries;
        const variationEntries = typeEntries[normalizedValue] || {};
        typeEntries[normalizedValue] = variationEntries;
        const entry = (_a = variationEntries[normalizedVariation]) !== null && _a !== void 0 ? _a : {
            proposedNames: {},
            name: null,
            sourceId: null,
        };
        variationEntries[normalizedVariation] = entry;
        callback(entry);
    });
}, _NameController_getCurrentTimeSeconds = function _NameController_getCurrentTimeSeconds() {
    return Math.round(Date.now() / 1000);
}, _NameController_validateSetNameRequest = function _NameController_validateSetNameRequest(request) {
    const { name, value, type, sourceId, variation } = request;
    const errorMessages = [];
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateValue).call(this, value, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateType).call(this, type, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateName).call(this, name, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateSourceId).call(this, sourceId, type, name, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateVariation).call(this, variation, type, errorMessages);
    if (errorMessages.length) {
        throw new Error(errorMessages.join(' '));
    }
}, _NameController_validateUpdateProposedNamesRequest = function _NameController_validateUpdateProposedNamesRequest(request) {
    const { value, type, sourceIds, variation } = request;
    const errorMessages = [];
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateValue).call(this, value, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateType).call(this, type, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateSourceIds).call(this, sourceIds, type, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateDuplicateSourceIds).call(this, type, errorMessages);
    __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_validateVariation).call(this, variation, type, errorMessages);
    if (errorMessages.length) {
        throw new Error(errorMessages.join(' '));
    }
}, _NameController_validateValue = function _NameController_validateValue(value, errorMessages) {
    if (!(value === null || value === void 0 ? void 0 : value.length) || typeof value !== 'string') {
        errorMessages.push('Must specify a non-empty string for value.');
    }
}, _NameController_validateType = function _NameController_validateType(type, errorMessages) {
    if (!Object.values(types_1.NameType).includes(type)) {
        errorMessages.push(`Must specify one of the following types: ${Object.values(types_1.NameType).join(', ')}`);
    }
}, _NameController_validateName = function _NameController_validateName(name, errorMessages) {
    if (name === null) {
        return;
    }
    if (!(name === null || name === void 0 ? void 0 : name.length) || typeof name !== 'string') {
        errorMessages.push('Must specify a non-empty string or null for name.');
    }
}, _NameController_validateSourceIds = function _NameController_validateSourceIds(sourceIds, type, errorMessages) {
    if (!sourceIds) {
        return;
    }
    const allSourceIds = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getAllSourceIds).call(this, type);
    const missingSourceIds = [];
    for (const sourceId of sourceIds) {
        if (!allSourceIds.includes(sourceId)) {
            missingSourceIds.push(sourceId);
            continue;
        }
    }
    if (missingSourceIds.length) {
        errorMessages.push(`Unknown source IDs for type '${type}': ${missingSourceIds.join(', ')}`);
    }
}, _NameController_validateSourceId = function _NameController_validateSourceId(sourceId, type, name, errorMessages) {
    if (sourceId === null || sourceId === undefined) {
        return;
    }
    if (name === null) {
        errorMessages.push(`Cannot specify a source ID when clearing the saved name: ${sourceId}`);
        return;
    }
    const allSourceIds = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getAllSourceIds).call(this, type);
    if (!sourceId.length || typeof sourceId !== 'string') {
        errorMessages.push('Must specify a non-empty string for sourceId.');
        return;
    }
    if (!allSourceIds.includes(sourceId)) {
        errorMessages.push(`Unknown source ID for type '${type}': ${sourceId}`);
    }
}, _NameController_validateDuplicateSourceIds = function _NameController_validateDuplicateSourceIds(type, errorMessages) {
    const allSourceIds = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getAllSourceIds).call(this, type);
    const duplicateSourceIds = allSourceIds.filter((sourceId, index) => allSourceIds.indexOf(sourceId) !== index);
    if (duplicateSourceIds.length) {
        errorMessages.push(`Duplicate source IDs found for type '${type}': ${duplicateSourceIds.join(', ')}`);
    }
}, _NameController_validateVariation = function _NameController_validateVariation(variation, type, errorMessages) {
    if (type !== types_1.NameType.ETHEREUM_ADDRESS) {
        return;
    }
    if (!(variation === null || variation === void 0 ? void 0 : variation.length) ||
        typeof variation !== 'string' ||
        !variation.match(/^0x[0-9A-Fa-f]+$/u)) {
        errorMessages.push(`Must specify a chain ID in hexidecimal format for variation when using '${type}' type.`);
    }
}, _NameController_getAllSourceIds = function _NameController_getAllSourceIds(type) {
    return (__classPrivateFieldGet(this, _NameController_providers, "f")
        /* istanbul ignore next */
        .map((provider) => __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getSourceIds).call(this, provider, type))
        .flat());
}, _NameController_getSourceIds = function _NameController_getSourceIds(provider, type) {
    return provider.getMetadata().sourceIds[type];
}, _NameController_removeDormantProposedNames = function _NameController_removeDormantProposedNames(proposedNames, type) {
    if (Object.keys(proposedNames).length === 0) {
        return;
    }
    const typeSourceIds = __classPrivateFieldGet(this, _NameController_instances, "m", _NameController_getAllSourceIds).call(this, type);
    const dormantSourceIds = Object.keys(proposedNames).filter((sourceId) => !typeSourceIds.includes(sourceId));
    for (const dormantSourceId of dormantSourceIds) {
        delete proposedNames[dormantSourceId];
    }
};
//# sourceMappingURL=NameController.js.map