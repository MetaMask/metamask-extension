import {
  hideLoadingIndication,
  showLoadingIndication,
  forceUpdateMetamaskState,
} from '../actions';
import { submitRequestToBackground } from '../background-connection';
import {
  mmiActionsFactory,
  showInteractiveReplacementTokenBanner,
  setCustodianDeepLink,
  setNoteToTraderMessage,
  setTypedMessageInProgress,
  setPersonalMessageInProgress,
  logAndStoreApiRequest,
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

  describe('#logAndStoreApiRequest', () => {
    it('should call submitRequestToBackground with correct parameters', async () => {
      const mockLogData = {
        id: '123',
        method: 'GET',
        request: {
          url: 'https://api.example.com/data',
          headers: { 'Content-Type': 'application/json' },
        },
        response: {
          status: 200,
          body: '{"success": true}',
        },
        timestamp: 1234567890,
      };

      await logAndStoreApiRequest(mockLogData);

      expect(submitRequestToBackground).toHaveBeenCalledWith(
        'logAndStoreApiRequest',
        [mockLogData],
      );
    });

    it('should return the result from submitRequestToBackground', async () => {
      const mockLogData = {
        id: '456',
        method: 'POST',
        request: {
          url: 'https://api.example.com/submit',
          headers: { 'Content-Type': 'application/json' },
          body: '{"data": "test"}',
        },
        response: {
          status: 201,
          body: '{"id": "789"}',
        },
        timestamp: 1234567890,
      };

      submitRequestToBackground.mockResolvedValue('success');

      const result = await logAndStoreApiRequest(mockLogData);

      expect(result).toBe('success');
    });

    it('should throw an error if submitRequestToBackground fails', async () => {
      const mockLogData = {
        id: '789',
        method: 'GET',
        request: {
          url: 'https://api.example.com/error',
          headers: { 'Content-Type': 'application/json' },
        },
        response: {
          status: 500,
          body: '{"error": "Internal Server Error"}',
        },
        timestamp: 1234567890,
      };

      const mockError = new Error('Background request failed');
      submitRequestToBackground.mockRejectedValue(mockError);

      await expect(logAndStoreApiRequest(mockLogData)).rejects.toThrow(
        'Background request failed',
      );
    });
  });
});
