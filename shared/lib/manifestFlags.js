"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManifestFlags = getManifestFlags;
const webextension_polyfill_1 = __importDefault(require("webextension-polyfill"));
/**
 * Get the runtime flags that were placed in manifest.json by manifest-flag-mocha-hooks.ts
 *
 * @returns flags if they exist, otherwise an empty object
 */
function getManifestFlags() {
    // If this is running in a unit test, there's no manifest, so just return an empty object
    if (process.env.JEST_WORKER_ID === undefined ||
        !webextension_polyfill_1.default.runtime.getManifest) {
        return {};
    }
    return (webextension_polyfill_1.default.runtime.getManifest()._flags ||
        {});
}
