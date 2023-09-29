type Custodian = {
  type: string;
  iconUrl: string;
  name: string;
  website: string;
  envName: string;
  apiUrl: string | null;
  displayName: string | null;
  production: boolean;
  refreshTokenUrl: string | null;
  websocketApiUrl: string;
  isNoteToTraderSupported: boolean;
  version: number;
};

export function findCustodianByDisplayName(
  displayName: string,
  custodians: Custodian[],
): Custodian | null {
  const formatedDisplayName = displayName.toLowerCase();

  if (!custodians) {
    return null;
  }

  for (const custodian of custodians) {
    const custodianName = custodian.name.toLowerCase();

    if (
      custodianName.length !== 0 &&
      formatedDisplayName.includes(custodianName)
    ) {
      return custodian;
    }
  }

  return null; // no matching custodian is found
}
