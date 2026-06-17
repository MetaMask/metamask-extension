/**
 * Custom WebSocket message type the dev server uses to announce the fingerprint of
 * the current build's background code.
 */
export const BACKGROUND_RELOAD_MESSAGE_TYPE =
  'mm:background-reload-fingerprint';

/**
 * Entry name for the background reload client bundle on MV2 (Firefox), where
 * it is injected as a `<script>` into the background page by
 * `HtmlBundlerPlugin`. On MV3 the client is bundled directly into the service
 * worker instead.
 */
export const BACKGROUND_RELOAD_CLIENT_ENTRY_NAME = 'background-reload-client';

/**
 * Custom WebSocket message type the dev server uses to announce the hash
 * of the current build's UI pages.
 */
export const UI_RELOAD_MESSAGE_TYPE = 'mm:ui-reload-hash';

/**
 * Entry name for the UI reload client. Used by `ManifestPlugin` to mark the
 * entry self-contained and by `HtmlBundlerPlugin.beforeEmit` to look up its
 * output filename for `<script>` injection into UI pages.
 */
export const UI_RELOAD_CLIENT_ENTRY_NAME = 'ui-reload-client';
