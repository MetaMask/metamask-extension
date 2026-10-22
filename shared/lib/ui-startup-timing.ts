import { BACKGROUND_INITIALIZED_METHOD } from '../constants/ui-initialization';

let backgroundInitializedAt: number | undefined;

/**
 * Read the background's initialization timestamp from the existing liveness port.
 *
 * @param message - A raw extension port message.
 */
export function recordBackgroundInitializationTiming(message: {
  data?: { method?: string; params?: { initializedAt: number } };
}): void {
  if (message.data?.method === BACKGROUND_INITIALIZED_METHOD) {
    backgroundInitializedAt = message.data.params?.initializedAt;
  }
}

/** Return the background's initialization time, or undefined before it arrives. */
export function getBackgroundInitializedAt(): number | undefined {
  return backgroundInitializedAt;
}
