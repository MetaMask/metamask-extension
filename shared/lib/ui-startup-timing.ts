import { BACKGROUND_INITIALIZED_METHOD } from '../constants/ui-initialization';

let backgroundInitializedAt: number | undefined;

/**
 * Read the background's initialization timestamp from the existing liveness port.
 *
 * @param message - A raw extension port message.
 */
export function recordBackgroundInitializationTiming(message: unknown): void {
  const { data } = message as {
    data?: { method?: string; params?: { initializedAt: number } };
  };
  if (data?.method === BACKGROUND_INITIALIZED_METHOD) {
    backgroundInitializedAt = data.params?.initializedAt;
  }
}

/** Return the background's initialization time, or undefined before it arrives. */
export function getBackgroundInitializedAt(): number | undefined {
  return backgroundInitializedAt;
}
