"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announceProvider = exports.requestProvider = void 0;
const utils_1 = require("@metamask/utils");
var EIP6963EventNames;
(function (EIP6963EventNames) {
    EIP6963EventNames["Announce"] = "eip6963:announceProvider";
    EIP6963EventNames["Request"] = "eip6963:requestProvider";
})(EIP6963EventNames || (EIP6963EventNames = {}));
/**
 * Forwards every announced provider to the provided handler by listening for
 * {@link EIP6963AnnounceProviderEvent}, and dispatches an
 * {@link EIP6963RequestProviderEvent}.
 *
 * @param handleProvider - A function that handles an announced provider.
 */
function requestProvider(handleProvider) {
    window.addEventListener(EIP6963EventNames.Announce, (event) => {
        if (event.type === EIP6963EventNames.Announce &&
            (0, utils_1.isObject)(event.detail?.provider)) {
            handleProvider(event.detail);
        }
    });
    window.dispatchEvent(new Event(EIP6963EventNames.Request));
}
exports.requestProvider = requestProvider;
/**
 * Courtesy https://github.com/thenativeweb/uuidv4/blob/bdcf3a3138bef4fb7c51f389a170666f9012c478/lib/uuidv4.ts#L5
 */
const UUID_V4_REGEX = /(?:^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$)|(?:^0{8}-0{4}-0{4}-0{4}-0{12}$)/u;
/**
 * Announces a provider by dispatching an {@link EIP6963AnnounceProviderEvent}, and
 * listening for {@link EIP6963RequestProviderEvent} to re-announce.
 *
 * @throws If the {@link EIP6963ProviderDetail} is invalid.
 * @param providerDetail - The {@link EIP6963ProviderDetail} to announce.
 * @param providerDetail.info - The {@link EIP6963ProviderInfo} to announce.
 * @param providerDetail.provider - The provider to announce.
 */
function announceProvider(providerDetail) {
    if (!isValidProviderDetail(providerDetail)) {
        throw new Error('Invalid EIP-6963 provider detail. See https://eips.ethereum.org/EIPS/eip-6963 for requirements.');
    }
    const { info, provider } = providerDetail;
    const _announceProvider = () => window.dispatchEvent(new CustomEvent(EIP6963EventNames.Announce, {
        detail: { info: { ...info }, provider },
    }));
    _announceProvider();
    window.addEventListener(EIP6963EventNames.Request, (_event) => {
        _announceProvider();
    });
}
exports.announceProvider = announceProvider;
/**
 * Validates an {@link EIP6963ProviderDetail} object.
 *
 * @param providerDetail - The {@link EIP6963ProviderDetail} to validate.
 * @returns Whether the {@link EIP6963ProviderDetail} is valid.
 */
function isValidProviderDetail(providerDetail) {
    if (!(0, utils_1.isObject)(providerDetail) || !(0, utils_1.isObject)(providerDetail.info)) {
        return false;
    }
    const { info } = providerDetail;
    return (typeof info.icon === 'string' &&
        isValidUrl(info.icon) &&
        typeof info.name === 'string' &&
        Boolean(info.name) &&
        typeof info.uuid === 'string' &&
        UUID_V4_REGEX.test(info.uuid) &&
        typeof info.walletId === 'string' &&
        Boolean(info.walletId));
}
/**
 * Checks if a string is a valid URL.
 *
 * @param url - The string to check.
 * @returns Whether the string is a valid URL.
 */
function isValidUrl(url) {
    try {
        // eslint-disable-next-line no-new
        new URL(url);
        return true;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=EIP6963.js.map
