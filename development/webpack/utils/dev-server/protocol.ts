/**
 * WebSocket message type the dev server uses to announce the fingerprint of
 * the current build's background code.
 */
export const BACKGROUND_UPDATE_MESSAGE_TYPE =
  'mm:background-update-fingerprint';

/**
 * Entry name for the background client bundle on MV2 (Firefox), where
 * it is injected as a `<script>` into the background page by
 * `HtmlBundlerPlugin`. On MV3 the client is bundled directly into the service
 * worker instead.
 */
export const BACKGROUND_CLIENT_ENTRY_NAME = 'background-client';

/**
 * WebSocket message type the dev server uses to announce the hash of the
 * current build's UI pages.
 */
export const UI_UPDATE_MESSAGE_TYPE = 'mm:ui-update-hash';
