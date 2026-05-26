/**
 * This is the method name used for an app-init liveness check. This is sent from app-init to the UI
 * as soon as a port is connected to prove that the message pipeline is working.
 *
 * Used in `app-init.js` and `service-worker.ts`.
 */
export const APP_INIT_LIVENESS_METHOD = 'APP_INIT_ALIVE';

/**
 * This is the method name used for a UI liveness check. This is sent from the background to the UI
 * automatically upon connection to prove that the connection is active.
 */
export const BACKGROUND_LIVENESS_METHOD = 'ALIVE';

/**
 * This method tells the UI that the background is ready to receive messages, and it includes the
 * initial background state for the UI process.
 */
export const START_UI_SYNC = 'START_UI_SYNC';
