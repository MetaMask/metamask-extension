/**
 * Capitalizes the first letter of a string.
 *
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export const capitalizeStr = (str: string) => {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};
