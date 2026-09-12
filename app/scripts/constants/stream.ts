// contexts
export const CONTENT_SCRIPT = 'metamask-contentscript';
export const METAMASK_INPAGE = 'metamask-inpage';
export const PHISHING_WARNING_PAGE = 'metamask-phishing-warning-page';

// stream channels
export const METAMASK_COOKIE_HANDLER = 'metamask-cookie-handler';
// liveness streams are sent over every port on connection, by the service
// worker (`app-init-liveness`, see `service-worker.ts`) and the background
// (`background-liveness`, see `background.js`). Only the extension UI consumes
// them (see `ui.js`); all other muxes must ignore them to avoid
// "ObjectMultiplex - orphaned data" warnings.
export const APP_INIT_LIVENESS_STREAM = 'app-init-liveness';
export const BACKGROUND_LIVENESS_STREAM = 'background-liveness';
export const METAMASK_EIP_1193_PROVIDER = 'metamask-provider';
export const METAMASK_CAIP_MULTICHAIN_PROVIDER = 'metamask-multichain-provider';
export const PHISHING_SAFELIST = 'metamask-phishing-safelist';
export const PHISHING_STREAM = 'phishing';

// For more information about these legacy streams, see here:
// https://github.com/MetaMask/metamask-extension/issues/15491
// TODO:LegacyProvider: Delete
export const LEGACY_CONTENT_SCRIPT = 'contentscript';
export const LEGACY_INPAGE = 'inpage';
export const LEGACY_PROVIDER = 'provider';
export const LEGACY_PUBLIC_CONFIG = 'publicConfig';
