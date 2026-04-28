import { Rule } from "@metamask/7715-permission-types";


/**
 * Extracts redeemer addresses from an array of rules.
 * @param rules
 * @returns
 */
export function extractRedeemerAddressesFromRules(
  rules: Rule[] | null | undefined,
): string[] | null {
  if (!rules?.length) {
    return null;
  }
  const redeemer = rules.find((rule) => rule.type === 'redeemer');
  if (!redeemer) {
    return null;
  }
  const { addresses } = redeemer.data;
  if (!Array.isArray(addresses) || addresses.some((address) => typeof address !== 'string')) {
    return null;
  }
  return addresses;
}
