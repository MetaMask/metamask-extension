/**
 * Synchronous, in-process marker for "the user just left `/perps/*` in-app".
 *
 * `PerpsLayout` clears the perps `lastVisitedRoute` in a passive-effect cleanup,
 * which runs after the next screen's `componentDidMount`. This marker bridges
 * that gap for in-app navigation but naturally disappears when the popup JS
 * context is destroyed and reopened.
 */

let lastPerpsInAppUnmountAt = 0;

/**
 * Record that `PerpsLayout` just unmounted in-app. Must be called *synchronously*
 * in the cleanup phase before any async dispatch.
 */
export function markPerpsUnmountInApp(): void {
  lastPerpsInAppUnmountAt = Date.now();
}

/**
 * @param withinMs - Maximum age in ms that still counts as "recent".
 * @returns true if `markPerpsUnmountInApp` fired within `withinMs`.
 */
export function wasPerpsUnmountedInAppRecently(withinMs: number): boolean {
  return (
    lastPerpsInAppUnmountAt > 0 &&
    Date.now() - lastPerpsInAppUnmountAt < withinMs
  );
}

/** Test-only reset. */
function resetPerpsInAppLeaveMarkerForTests(): void {
  lastPerpsInAppUnmountAt = 0;
}

export { resetPerpsInAppLeaveMarkerForTests as __resetPerpsInAppLeaveMarkerForTests };
