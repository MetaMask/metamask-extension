import {
  MessageManager,
  PersonalMessageManager,
  TypedMessageManager,
} from '@metamask/message-manager';
import {
  AbstractMessage,
  OriginalRequest,
} from '@metamask/message-manager/dist/AbstractMessageManager';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import SignController, {
  SignControllerMessenger,
  SignControllerOptions,
} from './sign';

jest.mock('@metamask/message-manager', () => ({
  MessageManager: jest.fn(),
  PersonalMessageManager: jest.fn(),
  TypedMessageManager: jest.fn(),
}));

const messageIdMock = '123';
const messageIdMock2 = '456';
const versionMock = '1';
const signatureMock = '0xAABBCC';
const stateMock = { test: 123 };
const securityProviderResponseMock = { test2: 345 };

const messageParamsMock = {
  from: '0x123',
  origin: 'http://test.com',
  data: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  metamaskId: messageIdMock,
  version: 'V1',
};

const messageParamsMock2 = {
  from: '0x124',
  origin: 'http://test4.com',
  data: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA',
  metamaskId: messageIdMock,
};

const messageMock = {
  id: messageIdMock,
  time: 123,
  status: 'unapproved',
  type: 'testType',
  rawSig: undefined,
} as any as AbstractMessage;

const coreMessageMock = {
  ...messageMock,
  messageParams: messageParamsMock,
};

const stateMessageMock = {
  ...messageMock,
  msgParams: messageParamsMock,
  securityProviderResponse: securityProviderResponseMock,
};

const requestMock = {
  origin: 'http://test2.com',
} as OriginalRequest;

const createMessengerMock = () =>
  ({
    registerActionHandler: jest.fn(),
    publish: jest.fn(),
    call: jest.fn(),
  } as any as jest.Mocked<SignControllerMessenger>);

const createMessageManagerMock = <T>() =>
  ({
    getUnapprovedMessages: jest.fn(),
    getUnapprovedMessagesCount: jest.fn(),
    addUnapprovedMessageAsync: jest.fn(),
    approveMessage: jest.fn(),
    setMessageStatusSigned: jest.fn(),
    rejectMessage: jest.fn(),
    subscribe: jest.fn(),
    update: jest.fn(),
    hub: {
      on: jest.fn(),
    },
  } as any as jest.Mocked<T>);

const createPreferencesControllerMock = () => ({
  store: {
    getState: jest.fn(),
  },
});

const createKeyringControllerMock = () => ({
  signMessage: jest.fn(),
  signPersonalMessage: jest.fn(),
  signTypedMessage: jest.fn(),
});

describe('SignController', () => {
  let signController: SignController;

  const messageManagerConstructorMock = MessageManager as jest.MockedClass<
    typeof MessageManager
  >;
  const personalMessageManagerConstructorMock =
    PersonalMessageManager as jest.MockedClass<typeof PersonalMessageManager>;
  const typedMessageManagerConstructorMock =
    TypedMessageManager as jest.MockedClass<typeof TypedMessageManager>;
  const messageManagerMock = createMessageManagerMock<MessageManager>();
  const personalMessageManagerMock =
    createMessageManagerMock<PersonalMessageManager>();
  const typedMessageManagerMock =
    createMessageManagerMock<TypedMessageManager>();
  const messengerMock = createMessengerMock();
  const preferencesControllerMock = createPreferencesControllerMock();
  const keyringControllerMock = createKeyringControllerMock();
  const getStateMock = jest.fn();
  const securityProviderRequestMock = jest.fn();
  const metricsEventMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    messageManagerConstructorMock.mockReturnValue(messageManagerMock);
    personalMessageManagerConstructorMock.mockReturnValue(
      personalMessageManagerMock,
    );

    typedMessageManagerConstructorMock.mockReturnValue(typedMessageManagerMock);

    preferencesControllerMock.store.getState.mockReturnValue({
      disabledRpcMethodPreferences: { eth_sign: true },
    });

    signController = new SignController({
      messenger: messengerMock as any,
      preferencesController: preferencesControllerMock as any,
      keyringController: keyringControllerMock as any,
      getState: getStateMock as any,
      securityProviderRequest: securityProviderRequestMock as any,
      metricsEvent: metricsEventMock as any,
    } as SignControllerOptions);
  });

  describe('unapprovedMsgCount', () => {
    it('returns value from message manager getter', () => {
      messageManagerMock.getUnapprovedMessagesCount.mockReturnValueOnce(10);
      expect(signController.unapprovedMsgCount).toBe(10);
    });
  });

  describe('unapprovedPersonalMessagesCount', () => {
    it('returns value from personal message manager getter', () => {
      personalMessageManagerMock.getUnapprovedMessagesCount.mockReturnValueOnce(
        11,
      );
      expect(signController.unapprovedPersonalMessagesCount).toBe(11);
    });
  });

  describe('unapprovedTypedMessagesCount', () => {
    it('returns value from typed message manager getter', () => {
      typedMessageManagerMock.getUnapprovedMessagesCount.mockReturnValueOnce(
        12,
      );
      expect(signController.unapprovedTypedMessagesCount).toBe(12);
    });
  });

  describe('resetState', () => {
    it('sets state to initial state', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      signController.update(() => ({
        unapprovedMsgs: { [messageIdMock]: messageMock } as any,
        unapprovedPersonalMsgs: { [messageIdMock]: messageMock } as any,
        unapprovedTypedMessages: { [messageIdMock]: messageMock } as any,
        unapprovedMsgCount: 1,
        unapprovedPersonalMsgCount: 2,
        unapprovedTypedMessagesCount: 3,
      }));

      signController.resetState();

      expect(signController.state).toEqual({
        unapprovedMsgs: {},
        unapprovedPersonalMsgs: {},
        unapprovedTypedMessages: {},
        unapprovedMsgCount: 0,
        unapprovedPersonalMsgCount: 0,
        unapprovedTypedMessagesCount: 0,
      });
    });
  });

  describe('rejectUnapproved', () => {
    beforeEach(() => {
      const messages = {
        [messageIdMock]: messageMock,
        [messageIdMock2]: messageMock,
      };

      messageManagerMock.getUnapprovedMessages.mockReturnValueOnce(
        messages as any,
      );
      personalMessageManagerMock.getUnapprovedMessages.mockReturnValueOnce(
        messages as any,
      );
      typedMessageManagerMock.getUnapprovedMessages.mockReturnValueOnce(
        messages as any,
      );

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      signController.update(() => ({
        unapprovedMsgs: messages as any,
        unapprovedPersonalMsgs: messages as any,
        unapprovedTypedMessages: messages as any,
      }));
    });

    it('rejects all messages in all message managers', () => {
      signController.rejectUnapproved('Test Reason');

      expect(messageManagerMock.rejectMessage).toHaveBeenCalledTimes(2);
      expect(messageManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock,
      );
      expect(messageManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock2,
      );

      expect(personalMessageManagerMock.rejectMessage).toHaveBeenCalledTimes(2);
      expect(personalMessageManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock,
      );
      expect(personalMessageManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock2,
      );

      expect(typedMessageManagerMock.rejectMessage).toHaveBeenCalledTimes(2);
      expect(typedMessageManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock,
      );
      expect(typedMessageManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock2,
      );
    });

    it('fires metrics event with reject reason', () => {
      signController.rejectUnapproved('Test Reason');

      expect(metricsEventMock).toHaveBeenCalledTimes(6);
      expect(metricsEventMock).toHaveBeenLastCalledWith({
        event: 'Test Reason',
        category: MetaMetricsEventCategory.Transactions,
        properties: {
          action: 'Sign Request',
          type: messageMock.type,
        },
      });
    });
  });

  describe('clearUnapproved', () => {
    it('resets state in all message managers', () => {
      signController.clearUnapproved();

      const defaultState = {
        unapprovedMessages: {},
        unapprovedMessagesCount: 0,
      };

      expect(messageManagerMock.update).toHaveBeenCalledTimes(1);
      expect(messageManagerMock.update).toHaveBeenCalledWith(defaultState);

      expect(personalMessageManagerMock.update).toHaveBeenCalledTimes(1);
      expect(personalMessageManagerMock.update).toHaveBeenCalledWith(
        defaultState,
      );

      expect(typedMessageManagerMock.update).toHaveBeenCalledTimes(1);
      expect(typedMessageManagerMock.update).toHaveBeenCalledWith(defaultState);
    });
  });

  describe('newUnsignedMessage', () => {
    it('throws if eth_sign disabled in preferences', async () => {
      preferencesControllerMock.store.getState.mockReturnValueOnce({
        disabledRpcMethodPreferences: { eth_sign: false },
      });

      await expect(
        signController.newUnsignedMessage(messageParamsMock, requestMock),
      ).rejects.toThrowError(
        'eth_sign has been disabled. You must enable it in the advanced settings',
      );
    });

    it('throws if data has wrong length', async () => {
      await expect(
        signController.newUnsignedMessage(
          { ...messageParamsMock, data: '0xFF' },
          requestMock,
        ),
      ).rejects.toThrowError('eth_sign requires 32 byte message hash');
    });

    it('adds message to message manager', async () => {
      await signController.newUnsignedMessage(messageParamsMock, requestMock);

      expect(
        messageManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledTimes(1);
      expect(messageManagerMock.addUnapprovedMessageAsync).toHaveBeenCalledWith(
        messageParamsMock,
        requestMock,
      );
    });
  });

  describe('newUnsignedPersonalMessage', () => {
    it('adds message to personal message manager', async () => {
      await signController.newUnsignedPersonalMessage(
        messageParamsMock,
        requestMock,
      );

      expect(
        personalMessageManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledTimes(1);

      expect(
        personalMessageManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledWith(
        expect.objectContaining(messageParamsMock),
        requestMock,
      );
    });
  });

  describe('newUnsignedTypedMessage', () => {
    it('adds message to typed message manager', async () => {
      signController.newUnsignedTypedMessage(
        messageParamsMock,
        requestMock,
        versionMock,
      );

      expect(
        typedMessageManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledTimes(1);
      expect(
        typedMessageManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledWith(messageParamsMock, versionMock, requestMock);
    });
  });

  describe.each([
    ['signMessage', messageManagerMock],
    ['signPersonalMessage', personalMessageManagerMock],
    ['signTypedMessage', typedMessageManagerMock],
  ])('%s', (signMethodName, messageManager) => {
    beforeEach(() => {
      messageManager.approveMessage.mockResolvedValueOnce(messageParamsMock2);

      keyringControllerMock[signMethodName].mockResolvedValueOnce(
        signatureMock,
      );
    });

    it('approves message and signs', async () => {
      await signController[signMethodName](messageParamsMock);

      const keyringControllerExtraArgs =
        signMethodName === 'signTypedMessage'
          ? [{ version: messageParamsMock.version }]
          : [];

      expect(keyringControllerMock[signMethodName]).toHaveBeenCalledTimes(1);
      expect(keyringControllerMock[signMethodName]).toHaveBeenCalledWith(
        messageParamsMock2,
        ...keyringControllerExtraArgs,
      );

      expect(messageManager.setMessageStatusSigned).toHaveBeenCalledTimes(1);
      expect(messageManager.setMessageStatusSigned).toHaveBeenCalledWith(
        messageParamsMock2.metamaskId,
        signatureMock,
      );
    });

    it('returns current state', async () => {
      getStateMock.mockReturnValueOnce(stateMock);
      expect(await signController[signMethodName](messageParamsMock)).toEqual(
        stateMock,
      );
    });

    it('accepts approval', async () => {
      await signController[signMethodName](messageParamsMock);

      expect(messengerMock.call).toHaveBeenCalledTimes(1);
      expect(messengerMock.call).toHaveBeenCalledWith(
        'ApprovalController:acceptRequest',
        messageParamsMock.metamaskId,
      );
    });

    it('rejects message on error', async () => {
      keyringControllerMock[signMethodName].mockReset();
      keyringControllerMock[signMethodName].mockRejectedValue(
        new Error('Test Error'),
      );

      await expect(
        signController[signMethodName](messageParamsMock),
      ).rejects.toThrow('Test Error');

      expect(messageManager.rejectMessage).toHaveBeenCalledTimes(1);
      expect(messageManager.rejectMessage).toHaveBeenCalledWith(
        messageParamsMock.metamaskId,
      );
    });

    it('rejects approval on error', async () => {
      keyringControllerMock[signMethodName].mockReset();
      keyringControllerMock[signMethodName].mockRejectedValue(
        new Error('Test Error'),
      );

      await expect(
        signController[signMethodName](messageParamsMock),
      ).rejects.toThrow('Test Error');

      expect(messengerMock.call).toHaveBeenCalledTimes(1);
      expect(messengerMock.call).toHaveBeenCalledWith(
        'ApprovalController:rejectRequest',
        messageParamsMock.metamaskId,
        'Cancel',
      );
    });
  });

  describe.each([
    ['cancelMessage', messageManagerMock],
    ['cancelPersonalMessage', personalMessageManagerMock],
    ['cancelTypedMessage', typedMessageManagerMock],
  ])('%s', (cancelMethodName, messageManager) => {
    it('rejects message using message manager', async () => {
      signController[cancelMethodName](messageIdMock);

      expect(messageManager.rejectMessage).toHaveBeenCalledTimes(1);
      expect(messageManager.rejectMessage).toHaveBeenCalledWith(
        messageParamsMock.metamaskId,
      );
    });

    it('rejects approval using approval controller', async () => {
      signController[cancelMethodName](messageIdMock);

      expect(messengerMock.call).toHaveBeenCalledTimes(1);
      expect(messengerMock.call).toHaveBeenCalledWith(
        'ApprovalController:rejectRequest',
        messageParamsMock.metamaskId,
        'Cancel',
      );
    });
  });

  describe('message manager events', () => {
    it.each([
      ['message manager', messageManagerMock],
      ['personal message manager', personalMessageManagerMock],
      ['typed message manager', typedMessageManagerMock],
    ])('bubbles update badge event from %s', (_, messageManager) => {
      const mockListener = jest.fn();

      signController.hub.on('updateBadge', mockListener);
      messageManager.hub.on.mock.calls[0][1]();

      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['message manager', messageManagerMock, 'eth_sign'],
      ['personal message manager', personalMessageManagerMock, 'personal_sign'],
      ['typed message manager', typedMessageManagerMock, 'eth_signTypedData'],
    ])(
      'requires approval on unapproved message event from %s',
      (_, messageManager, methodName) => {
        messengerMock.call.mockResolvedValueOnce({});

        messageManager.hub.on.mock.calls[1][1](messageParamsMock);

        expect(messengerMock.call).toHaveBeenCalledTimes(1);
        expect(messengerMock.call).toHaveBeenCalledWith(
          'ApprovalController:addRequest',
          {
            id: messageIdMock,
            origin: messageParamsMock.origin,
            type: methodName,
          },
          true,
        );
      },
    );

    it('updates state on message manager state change', async () => {
      securityProviderRequestMock.mockResolvedValue(
        securityProviderResponseMock,
      );

      await messageManagerMock.subscribe.mock.calls[0][0]({
        unapprovedMessages: { [messageIdMock]: coreMessageMock as any },
        unapprovedMessagesCount: 3,
      });

      expect(await signController.state).toEqual({
        unapprovedMsgs: { [messageIdMock]: stateMessageMock as any },
        unapprovedPersonalMsgs: {},
        unapprovedTypedMessages: {},
        unapprovedMsgCount: 3,
        unapprovedPersonalMsgCount: 0,
        unapprovedTypedMessagesCount: 0,
      });
    });

    it('updates state on personal message manager state change', async () => {
      securityProviderRequestMock.mockResolvedValue(
        securityProviderResponseMock,
      );

      await personalMessageManagerMock.subscribe.mock.calls[0][0]({
        unapprovedMessages: { [messageIdMock]: coreMessageMock as any },
        unapprovedMessagesCount: 4,
      });

      expect(await signController.state).toEqual({
        unapprovedMsgs: {},
        unapprovedPersonalMsgs: { [messageIdMock]: stateMessageMock as any },
        unapprovedTypedMessages: {},
        unapprovedMsgCount: 0,
        unapprovedPersonalMsgCount: 4,
        unapprovedTypedMessagesCount: 0,
      });
    });

    it('updates state on typed message manager state change', async () => {
      securityProviderRequestMock.mockResolvedValue(
        securityProviderResponseMock,
      );

      await typedMessageManagerMock.subscribe.mock.calls[0][0]({
        unapprovedMessages: { [messageIdMock]: coreMessageMock as any },
        unapprovedMessagesCount: 5,
      });

      expect(await signController.state).toEqual({
        unapprovedMsgs: {},
        unapprovedPersonalMsgs: {},
        unapprovedTypedMessages: { [messageIdMock]: stateMessageMock as any },
        unapprovedMsgCount: 0,
        unapprovedPersonalMsgCount: 0,
        unapprovedTypedMessagesCount: 5,
      });
    });
  });
});
