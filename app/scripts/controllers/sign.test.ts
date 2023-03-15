import {
  MessageManager,
  MessageParamsMetamask,
  PersonalMessageManager,
  TypedMessageManager,
} from '@metamask/message-manager';
import {
  AbstractMessage,
  OriginalRequest,
} from '@metamask/message-manager/dist/AbstractMessageManager';
import SignController, {
  SignControllerMessenger,
  SignControllerOptions,
} from './sign';

jest.mock('@metamask/message-manager', () => ({
  MessageManager: jest.fn(),
  PersonalMessageManager: jest.fn(),
  TypedMessageManager: jest.fn(),
}));

const messengerMock = {
  registerActionHandler: jest.fn(),
  publish: jest.fn(),
} as any as SignControllerMessenger;

const messageIdMock = '123';
const versionMock = '1';

const messageParamsMock = {
  from: '0x123',
  origin: 'test.com',
  data: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
} as MessageParamsMetamask;

const messageMock = {
  id: messageIdMock,
  time: 123,
  status: 'unapproved',
  type: 'testType',
  rawSig: undefined,
} as any as AbstractMessage;

const requestMock = {
  origin: 'test2.com',
} as OriginalRequest;

const createMessageManagerMock = <T>() =>
  ({
    getUnapprovedMessagesCount: jest.fn(),
    addUnapprovedMessageAsync: jest.fn(),
    subscribe: jest.fn(),
    hub: {
      on: jest.fn(),
    },
  } as any as jest.Mocked<T>);

const createPreferencesControllerMock = () => ({
  store: {
    getState: jest.fn(),
  },
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
  const preferencesControllerMock = createPreferencesControllerMock();

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
      signController.newUnsignedMessage(messageParamsMock, requestMock);

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
      signController.newUnsignedPersonalMessage(messageParamsMock, requestMock);

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
});
