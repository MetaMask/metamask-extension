import { mmiActionsFactory } from './institution-background';

describe('Institution Actions', () => {
  describe('#mmiActionsFactory', () => {
    it('returns mmiActions object', async () => {
      const actionsMock = {
        connectCustodyAddresses: jest.fn(),
        getCustodianAccounts: jest.fn(),
        getCustodianAccountsByAddress: jest.fn(),
        getCustodianTransactionDeepLink: jest.fn(),
        getCustodianConfirmDeepLink: jest.fn(),
        getCustodianSignMessageDeepLink: jest.fn(),
        getCustodianToken: jest.fn(),
        getCustodianJWTList: jest.fn(),
        setComplianceAuthData: jest.fn(),
        deleteComplianceAuthData: jest.fn(),
        generateComplianceReport: jest.fn(),
        getComplianceHistoricalReportsByAddress: jest.fn(),
        syncReportsInProgress: jest.fn(),
        removeConnectInstitutionalFeature: jest.fn(),
        removeAddTokenConnectRequest: jest.fn(),
        setCustodianConnectRequest: jest.fn(),
        getCustodianConnectRequest: jest.fn(),
        getMmiConfiguration: jest.fn(),
        getAllCustodianAccountsWithToken: jest.fn(),
        setWaitForConfirmDeepLinkDialog: jest.fn(),
        setCustodianNewRefreshToken: jest.fn(),
      };
      const mmiActions = mmiActionsFactory({
        log: { debug: jest.fn(), error: jest.fn() },
        showLoadingIndication: jest.fn(),
        submitRequestToBackground: jest.fn(() => actionsMock),
        displayWarning: jest.fn(),
        hideLoadingIndication: jest.fn(),
        forceUpdateMetamaskState: jest.fn(),
        showModal: jest.fn(),
        callBackgroundMethod: jest.fn(() => actionsMock),
      });

      const connectCustodyAddresses = mmiActions.connectCustodyAddresses(
        {},
        '0xAddress',
      );
      mmiActions.getCustodianAccounts(
        'token',
        'apiUrl',
        'custody',
        'getNonImportedAccounts',
        {},
      );
      mmiActions.getCustodianAccountsByAddress(
        'jwt',
        'apiUrl',
        'address',
        'custody',
        {},
        4,
      );
      mmiActions.getMmiConfiguration({
        portfolio: {
          enabled: true,
          url: 'https://portfolio.io',
        },
        custodians: [],
      });
      mmiActions.getCustodianToken({});
      mmiActions.getCustodianConnectRequest({
        token: 'token',
        custodianType: 'custodianType',
        custodianName: 'custodianname',
        apiUrl: undefined,
      });
      mmiActions.getCustodianTransactionDeepLink('0xAddress', 'txId');
      mmiActions.getCustodianConfirmDeepLink('txId');
      mmiActions.getCustodianSignMessageDeepLink('0xAddress', 'custodyTxId');
      mmiActions.getCustodianJWTList({});
      mmiActions.getAllCustodianAccountsWithToken({
        custodianType: 'custodianType',
        token: 'token',
      });
      mmiActions.setComplianceAuthData({
        clientId: 'id',
        projectId: 'projectId',
      });
      mmiActions.deleteComplianceAuthData();
      mmiActions.generateComplianceReport('0xAddress');
      mmiActions.getComplianceHistoricalReportsByAddress(
        '0xAddress',
        'projectId',
      );
      mmiActions.syncReportsInProgress({
        address: '0xAddress',
        historicalReports: [],
      });
      mmiActions.removeConnectInstitutionalFeature({
        origin: 'origin',
        projectId: 'projectId',
      });
      mmiActions.removeAddTokenConnectRequest({
        origin: 'origin',
        apiUrl: 'https://jupiter-custody.codefi.network',
        token: 'token',
      });
      mmiActions.setCustodianConnectRequest({
        token: 'token',
        apiUrl: 'https://jupiter-custody.codefi.network',
        custodianType: 'custodianType',
        custodianName: 'custodianname',
      });
      const setWaitForConfirmDeepLinkDialog =
        mmiActions.setWaitForConfirmDeepLinkDialog(true);
      mmiActions.setCustodianNewRefreshToken(
        'address',
        'oldAuthDetails',
        'oldApiUrl',
        'newAuthDetails',
        'newApiUrl',
      );
      connectCustodyAddresses(jest.fn());
      setWaitForConfirmDeepLinkDialog(jest.fn());
      expect(connectCustodyAddresses).toBeDefined();
      expect(setWaitForConfirmDeepLinkDialog).toBeDefined();
    });
  });
});
