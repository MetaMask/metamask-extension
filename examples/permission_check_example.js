/**
 * Example permission check for MetaMask extension.
 * Demonstrates how to verify basic extension permissions.
 */

export function hasBasicPermissions(permissions = []) {
  return permissions.includes('storage');
}
