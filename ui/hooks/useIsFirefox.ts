import { PLATFORM_FIREFOX } from '../../shared/constants/app';
import { getBrowserName } from '../../shared/lib/browser-runtime.utils';

/**
 * Returns true when the extension is running inside Firefox.
 *
 * `getBrowserName()` is synchronous and never changes at runtime, so the
 * result is stable across renders and safe to use as a dependency.
 */
export function useIsFirefox(): boolean {
  return getBrowserName() === PLATFORM_FIREFOX;
}
