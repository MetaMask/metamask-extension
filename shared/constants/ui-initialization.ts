/**
 * This is the method name used for a UI liveness check. This is sent from the background to the UI
 * automatically upon connection to prove that the connection is active.
 */
export const BACKGROUND_LIVENESS_METHOD = 'ALIVE';

/**
 * This method tells the UI that background controller initialization is complete.
 * It is sent after the background finishes initializing but before the state is
 * serialized and sent to the UI. This allows the UI to distinguish between
 * "background is still initializing" and "background initialized but state sync failed".
 */
export const BACKGROUND_INITIALIZED_METHOD = 'BACKGROUND_INITIALIZED';

/**
 * This method tells the UI that the background is ready to receive messages, and it includes the
 * initial background state for the UI process.
 */
export const START_UI_SYNC = 'START_UI_SYNC';
