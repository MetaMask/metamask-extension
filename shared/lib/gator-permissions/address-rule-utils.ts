import type { Rule } from '@metamask/7715-permission-types';

export function extractAddressesFromRuleByType(
  rules: Rule[] | null | undefined,
  type: Rule['type'],
): string[] | null {
  if (!rules?.length) {
    return null;
  }
  const ruleWithAddresses = rules.find((rule) => rule.type === type);
  if (!ruleWithAddresses) {
    return null;
  }
  const { addresses } = ruleWithAddresses.data;
  if (!Array.isArray(addresses)) {
    return null;
  }
  const validAddresses = addresses.filter(
    (address): address is string => typeof address === 'string',
  );
  return validAddresses.length ? validAddresses : null;
}
