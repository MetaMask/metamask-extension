export function hasConsoleAccess() {
  return (
    typeof console !== 'undefined' &&
    console !== null &&
    typeof console.log === 'function'
  );
}
