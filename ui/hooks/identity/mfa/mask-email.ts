/**
 * Shows an email's first letter and domain only, as in `c•••@metamask.com`.
 *
 * @param email - The full address.
 * @returns The masked address.
 */
export const maskEmail = (email: string): string =>
  `${email[0]}•••${email.slice(email.indexOf('@'))}`;
