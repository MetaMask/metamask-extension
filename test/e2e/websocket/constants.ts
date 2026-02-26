/**
 * Registered WebSocket service names.
 * Use these instead of hardcoded strings when calling registry methods.
 */
export const WEBSOCKET_SERVICES = Object.freeze({
  solana: 'solana',
  accountActivity: 'accountActivity',
} as const);
