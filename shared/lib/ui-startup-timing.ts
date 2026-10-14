import { isObject } from '@metamask/utils';
import { BACKGROUND_INITIALIZED_METHOD } from '../constants/ui-initialization';

let backgroundInitializedAt: number | undefined;

/**
 * Read an optional initialization timestamp from the existing liveness port.
 * Missing or malformed metadata leaves background warmness unknown.
 *
 * @param message - A raw extension port message.
 */
export function recordBackgroundInitializationTiming(message: unknown): void {
  if (
    !isObject(message) ||
    !isObject(message.data) ||
    message.data.method !== BACKGROUND_INITIALIZED_METHOD ||
    !isObject(message.data.params)
  ) {
    return;
  }
  const { initializedAt } = message.data.params;
  if (
    typeof initializedAt === 'number' &&
    Number.isFinite(initializedAt) &&
    initializedAt > 0
  ) {
    backgroundInitializedAt = initializedAt;
  }
}

/** Return the background's initialization time, or undefined for older senders. */
export function getBackgroundInitializedAt(): number | undefined {
  return backgroundInitializedAt;
}
