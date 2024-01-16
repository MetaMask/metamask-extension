export function usePetnamesEnabled(): boolean {
  let enabled = false;

  ///: BEGIN:ONLY_INCLUDE_IF(petnames)
  enabled = true;
  ///: END:ONLY_INCLUDE_IF

  return enabled;
}
