/**
 * Custom util to extract a specific identifier from the URL pathname.
 * Assumes the URL hash follows a structure like "#/somePrefix/identifier".
 * Handles undefined or non-string input gracefully by returning an empty string.
 *
 * @param pathname - The URL pathname to extract the identifier from.
 */
export function getExtractIdentifier(pathname: string | undefined): string {
  if (typeof pathname !== 'string') {
    return '';
  }
  const parts = pathname.split('/');
  return parts.length > 2 ? parts[2] : '';
}
