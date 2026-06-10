/**
 * Custom WebSocket message type the dev server uses to announce the fingerprint of
 * the current build's privileged code (background, service worker, content scripts, offscreen).
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
