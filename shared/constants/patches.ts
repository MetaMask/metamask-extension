/**
 * This method is used by a UI process to retrieve the latest batch of state
 * updates from the background.
 */
export const GET_STATE_PATCHES = 'getStatePatches';

/**
 * This method is used by the background process to send a batch of controller
 * state updates to a UI process, where they are then loaded into Redux.
 */
export const SEND_UPDATE = 'sendUpdate';

/**
 * This method is used by a UI process to ask the background process to
 * begin sending state updates.
 */
export const START_SENDING_PATCHES = 'startSendingPatches';
