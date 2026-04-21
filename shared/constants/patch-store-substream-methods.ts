export const PATCH_STORE_SUBSTREAM_METHODS = {
  /**
   * Used by a UI process to retrieve the latest batch of state updates from the
   * background.
   */
  GetStatePatches: 'getStatePatches',

  /**
   * Used by the background process to send a batch of controller state updates
   * to a UI process, where they are then loaded into Redux.
   */
  SendUpdate: 'sendUpdate',

  /**
   * Used by a UI process to ask the background process to begin sending state
   * updates.
   */
  StartSendingPatches: 'startSendingPatches',
} as const;
