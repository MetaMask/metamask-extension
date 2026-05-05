import { Rule } from '@metamask/7715-permission-types';

export function extractPayeeAddressesFromRules(
  rules: Rule[] | null | undefined,
): string[] | null {
  if (!rules?.length) {
    return null;
  }
  const payee = rules.find((rule) => rule.type === 'payee');
  if (!payee) {
    return null;
  }
  const { addresses } = payee.data;
  if (!Array.isArray(addresses)) {
    return null;
  }
  const validAddresses = addresses.filter(
    (address): address is string => typeof address === 'string',
  );
  return validAddresses.length ? validAddresses : null;
}
