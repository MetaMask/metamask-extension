/**
 * Perps Providers
 *
 * This module exports the stream manager and React context provider
 * for real-time Perps data subscriptions.
 */

// Controller access
export {
  getPerpsController,
  resetPerpsController,
  type PerpsControllerState,
} from './getPerpsController';

// Stream Manager
export {
  PerpsStreamManager,
  getStreamManagerInstance,
  type StreamSubscriptionParams,
  type TopOfBookData,
} from './PerpsStreamManager';

// React Provider
export {
  PerpsStreamProvider,
  usePerpsStream,
  PerpsStreamContext,
  type PerpsStreamProviderProps,
} from './PerpsStreamProvider';

// Route Wrapper
export {
  PerpsRouteWrapper,
  type PerpsRouteWrapperProps,
} from './PerpsRouteWrapper';
