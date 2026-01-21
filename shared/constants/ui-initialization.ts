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
