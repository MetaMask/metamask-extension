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
  isManualTokenInputSupported?: boolean;
  isQRCodeSupported: boolean;
};

export function findCustodianByEnvName(
  envName: string,
  custodians: Custodian[] | undefined,
): Custodian | null {
  const formatedEnvName = envName.toLowerCase();

  if (!custodians) {
    return null;
  }

  for (const custodian of custodians) {
    const custodianName = custodian.envName.toLowerCase();

    if (custodianName.length !== 0 && formatedEnvName.includes(custodianName)) {
      return custodian;
    }
  }

  return null; // no matching custodian is found
}
