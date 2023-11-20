import {
  hideLoadingIndication,
  showLoadingIndication,
  forceUpdateMetamaskState,
} from '../actions';
import { submitRequestToBackground } from '../background-connection';
import {
  mmiActionsFactory,
  showInteractiveReplacementTokenBanner,
  setTypedMessageInProgress,
  setPersonalMessageInProgress,
} from './institution-background';

jest.mock('../actions', () => ({
  displayWarning: jest.fn(),
  showLoadingIndication: jest.fn(),
  hideLoadingIndication: jest.fn(),
  forceUpdateMetamaskState: jest.fn(),
}));

jest.mock('../background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../shared/modules/error', () => ({
  isErrorWithMessage: jest.fn(),
}));

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
      expect(connectCustodyAddresses).toBeDefined();
      expect(setWaitForConfirmDeepLinkDialog).toBeDefined();
    });
  });

  describe('#showInteractiveReplacementTokenBanner', () => {
    it('should test showInteractiveReplacementTokenBanner action', async () => {
      const dispatch = jest.fn();

      await showInteractiveReplacementTokenBanner({
        url: 'testUrl',
        oldRefreshToken: 'testToken',
      })(dispatch);

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'showInteractiveReplacementTokenBanner',
        [{ url: 'testUrl', oldRefreshToken: 'testToken' }],
      );
    });
  });

  describe('#setTypedMessageInProgress', () => {
    it('should test setTypedMessageInProgress action', async () => {
      const dispatch = jest.fn();

      await setTypedMessageInProgress('testMsgId')(dispatch);

      expect(showLoadingIndication).toHaveBeenCalled();
      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'setTypedMessageInProgress',
        ['testMsgId'],
      );
      expect(forceUpdateMetamaskState).toHaveBeenCalledWith(dispatch);
      expect(hideLoadingIndication).toHaveBeenCalled();
    });
  });

  describe('#setPersonalMessageInProgress', () => {
    it('should test setPersonalMessageInProgress action', async () => {
      const dispatch = jest.fn();

      await setPersonalMessageInProgress('testMsgId')(dispatch);

      expect(showLoadingIndication).toHaveBeenCalled();
      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'setPersonalMessageInProgress',
        ['testMsgId'],
      );
      expect(forceUpdateMetamaskState).toHaveBeenCalledWith(dispatch);
      expect(hideLoadingIndication).toHaveBeenCalled();
    });
  });
});
