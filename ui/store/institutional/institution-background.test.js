import {
  hideLoadingIndication,
  showLoadingIndication,
} from '../actions';
import { submitRequestToBackground } from '../background-connection';
import {
  mmiActionsFactory,
  showInteractiveReplacementTokenBanner,
  setCustodianDeepLink,
  setNoteToTraderMessage,
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
        getCustodianTransactionDeepLink: jest.fn(),
        getCustodianConfirmDeepLink: jest.fn(),
        getCustodianSignMessageDeepLink: jest.fn(),
        getCustodianToken: jest.fn(),
        getCustodianJWTList: jest.fn(),
        removeAddTokenConnectRequest: jest.fn(),
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
        'envName',
        'custody',
        'getNonImportedAccounts',
        {},
      );
      mmiActions.getMmiConfiguration({
        portfolio: {
          enabled: true,
          url: 'https://portfolio.io',
        },
        custodians: [],
      });
      mmiActions.getCustodianToken({});
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
        token: 'token',
        environment: 'saturn',
      });
      const setWaitForConfirmDeepLinkDialog =
        mmiActions.setWaitForConfirmDeepLinkDialog(true);
      mmiActions.setCustodianNewRefreshToken('address', 'refreshToken');
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

  describe('#setCustodianDeepLink', () => {
    it('should test setCustodianDeepLink action', async () => {
      const dispatch = jest.fn();

      await setCustodianDeepLink({
        fromAddress: '0x',
        custodyId: 'custodyId',
      })(dispatch);

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'setCustodianDeepLink',
        [{ fromAddress: '0x', custodyId: 'custodyId' }],
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
      expect(hideLoadingIndication).toHaveBeenCalled();
    });
  });

  describe('#setNoteToTraderMessage', () => {
    it('should test setNoteToTraderMessage action', async () => {
      const dispatch = jest.fn();

      await setNoteToTraderMessage('some message')(dispatch);

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'setNoteToTraderMessage',
        ['some message'],
      );
    });
  });
});
