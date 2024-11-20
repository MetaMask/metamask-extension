import { findCustodianByEnvName } from './find-by-custodian-name';

describe('findCustodianByEnvName', () => {
  const custodians = [
    {
      type: 'JSONRPC',
      iconUrl: '',
      name: 'Qredo',
      website: 'https://www.qredo.com/',
      envName: 'qredo',
      apiUrl: null,
      displayName: null,
      production: false,
      refreshTokenUrl: null,
      websocketApiUrl: 'wss://websocket.dev.metamask-institutional.io/v1/ws',
      isNoteToTraderSupported: true,
      isQRCodeSupported: false,
      version: 2,
    },
    {
      type: 'JSONRPC',
      iconUrl:
        'https://saturn-custody-ui.dev.metamask-institutional.io/saturn.svg',
      name: 'Saturn Custody',
      website: 'https://saturn-custody-ui.dev.metamask-institutional.io/',
      envName: 'saturn',
      apiUrl: 'https://saturn-custody.dev.metamask-institutional.io/eth',
      displayName: null,
      production: false,
      refreshTokenUrl:
        'https://saturn-custody.dev.metamask-institutional.io/oauth/token',
      websocketApiUrl: 'wss://websocket.dev.metamask-institutional.io/v1/ws',
      isNoteToTraderSupported: true,
      isQRCodeSupported: false,
      version: 2,
    },
  ];
  it('should return the custodian if the env name is found in custodianKey', () => {
    const envName = 'Qredo';
    const custodian = findCustodianByEnvName(envName, custodians);
    expect(custodian?.envName).toBe('qredo');
  });

  it('should return the custodian if the env name is found in custodianDisplayName', () => {
    const envName = 'Saturn Custody';
    const custodian = findCustodianByEnvName(envName, custodians);
    expect(custodian?.envName).toContain('saturn');
  });

  it('should return null if no matching custodian is found', () => {
    const envName = 'Non-existent Custodian';
    const custodian = findCustodianByEnvName(envName, custodians);
    expect(custodian).toBeNull();
  });
});
