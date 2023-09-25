export function usePetnamesEnabled(): boolean {
  let enabled = false;

  ///: BEGIN:ONLY_INCLUDE_IN(petnames)
  enabled = true;
  ///: END:ONLY_INCLUDE_IN

  return enabled;
}
