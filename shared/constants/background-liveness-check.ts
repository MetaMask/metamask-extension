/**
 * This is the method name used for a UI liveness check. This is sent from the background to the UI
 * automatically upon connection to prove that the connection is active.
 */
export const BACKGROUND_LIVENESS_METHOD = 'ALIVE';

/**
 * This is the method name used for an app-init liveness check. This is sent from app-init to the UI
 * as soon as a port is connected to prove that the message pipeline is working.
 */
export const APP_INIT_LIVENESS_METHOD = 'APP_INIT_ALIVE';

/**
 * This is the method name used by the UI to request an app-init liveness response.
 */
export const APP_INIT_LIVENESS_PING_METHOD = 'APP_INIT_PING';
