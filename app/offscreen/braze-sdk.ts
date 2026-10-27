import {
  changeUser,
  destroy,
  getUser,
  initialize,
  isInitialized,
  requestImmediateDataFlush,
  wipeData,
} from '@braze/web-sdk';

/**
 * The Braze SDK surface used by the offscreen document. Loaded on demand, and
 * named imports let webpack tree-shake unused SDK features out of the chunk.
 */
export const brazeSdk = {
  changeUser,
  destroy,
  getUser,
  initialize,
  isInitialized,
  requestImmediateDataFlush,
  wipeData,
};

export type BrazeSdk = typeof brazeSdk;
