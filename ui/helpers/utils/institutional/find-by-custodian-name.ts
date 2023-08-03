import { CUSTODIAN_WEBSITES } from '../../../../shared/constants/institutional/custodian-websites';

export function findCustodianByDisplayName(displayName: string) {
  const formatedDisplayName = displayName.toLowerCase();
  const custodianKeys = Object.keys(
    CUSTODIAN_WEBSITES,
  ) as (keyof typeof CUSTODIAN_WEBSITES)[];

  for (const custodianKey of custodianKeys) {
    const custodian = CUSTODIAN_WEBSITES[custodianKey];
    const custodianDisplayName = custodian.displayName.toLowerCase();

    if (
      formatedDisplayName.includes(custodianKey.toLowerCase()) ||
      formatedDisplayName.includes(custodianDisplayName)
    ) {
      return custodian;
    }
  }

  return null; // no matching custodian is found
}
