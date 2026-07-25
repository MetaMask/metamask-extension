export function hasConsoleAccess() {
  return typeof console !== 'undefined' && typeof console.log === 'function';
}
