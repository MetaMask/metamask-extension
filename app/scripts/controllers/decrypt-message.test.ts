import { DecryptMessageManager } from '@metamask/message-manager';
import { AbstractMessage } from '@metamask/message-manager/dist/AbstractMessageManager';
import { EVENT } from '../../../shared/constants/metametrics';
import DecryptMessageController, {
  DecryptMessageControllerMessenger,
  DecryptMessageControllerOptions,
  getDefaultState,
} from './decrypt-message';

const messageIdMock = '12345';
const messageMock = {
  metamaskId: messageIdMock,
  time: 123,
  status: 'unapproved',
  type: 'testType',
  rawSig: undefined,
} as any as AbstractMessage;

const mockExtState = {};

jest.mock('@metamask/message-manager', () => ({
  DecryptMessageManager: jest.fn(),
}));

const createKeyringControllerMock = () => ({
  decryptMessage: jest.fn(),
});

const createMessengerMock = () =>
  ({
    registerActionHandler: jest.fn(),
    publish: jest.fn(),
    call: jest.fn(),
  } as any as jest.Mocked<DecryptMessageControllerMessenger>);

const createDecryptMessageManagerMock = <T>() =>
  ({
    getUnapprovedMessages: jest.fn(),
    getUnapprovedMessagesCount: jest.fn(),
    getMessage: jest.fn(),
    addUnapprovedMessageAsync: jest.fn(),
    approveMessage: jest.fn(),
    setMessageStatusDecrypted: jest.fn(),
    rejectMessage: jest.fn(),
    update: jest.fn(),
    subscribe: jest.fn(),
    updateMessage: jest.fn(),
    hub: {
      on: jest.fn(),
    },
  } as any as jest.Mocked<T>);

describe('EncryptionPublicKeyController', () => {
  let decryptMessageController: DecryptMessageController;

  const decryptMessageManagerConstructorMock =
    DecryptMessageManager as jest.MockedClass<typeof DecryptMessageManager>;
  const getStateMock = jest.fn();
  const keyringControllerMock = createKeyringControllerMock();
  const messengerMock = createMessengerMock();
  const metricsEventMock = jest.fn();

  const decryptMessageManagerMock =
    createDecryptMessageManagerMock<DecryptMessageManager>();

  beforeEach(() => {
    jest.resetAllMocks();

    decryptMessageManagerConstructorMock.mockReturnValue(
      decryptMessageManagerMock,
    );

    decryptMessageController = new DecryptMessageController({
      getState: getStateMock as any,
      keyringController: keyringControllerMock as any,
      messenger: messengerMock as any,
      metricsEvent: metricsEventMock as any,
    } as DecryptMessageControllerOptions);
  });

  it('should return unapprovedMsgCount', () => {
    decryptMessageManagerMock.getUnapprovedMessagesCount.mockReturnValue(5);
    expect(decryptMessageController.unapprovedDecryptMsgCount).toBe(5);
  });

  it('should reset state', () => {
    decryptMessageController.update(() => ({
      unapprovedDecryptMsgs: {
        [messageIdMock]: messageMock,
      } as any,
      unapprovedDecryptMsgCount: 1,
    }));
    decryptMessageController.resetState();
    expect(decryptMessageController.state).toStrictEqual(getDefaultState());
  });

  it('should clear unapproved messages', () => {
    decryptMessageController.clearUnapproved();
    expect(decryptMessageController.state).toStrictEqual(getDefaultState());
    expect(decryptMessageManagerMock.update).toBeCalledTimes(1);
  });
  it('should add unapproved messages', async () => {
    await decryptMessageController.newRequestDecryptMessage(messageMock);

    expect(decryptMessageManagerMock.addUnapprovedMessageAsync).toBeCalledTimes(
      1,
    );
    expect(decryptMessageManagerMock.addUnapprovedMessageAsync).toBeCalledWith(
      messageMock,
      undefined,
    );
  });

  it('should decrypt message', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: '0x7b22666f6f223a22626172227d',
    };
    decryptMessageManagerMock.approveMessage.mockResolvedValue(
      messageToDecrypt,
    );
    keyringControllerMock.decryptMessage.mockResolvedValue('decryptedMessage');
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.decryptMessage(
      messageToDecrypt,
    );

    expect(decryptMessageManagerMock.approveMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.approveMessage).toBeCalledWith(
      messageToDecrypt,
    );
    expect(keyringControllerMock.decryptMessage).toBeCalledTimes(1);
    expect(keyringControllerMock.decryptMessage).toBeCalledWith(
      messageToDecrypt,
    );
    expect(decryptMessageManagerMock.setMessageStatusDecrypted).toBeCalledTimes(
      1,
    );
    expect(decryptMessageManagerMock.setMessageStatusDecrypted).toBeCalledWith(
      messageIdMock,
      'decryptedMessage',
    );
    expect(result).toBe(mockExtState);
  });

  it('should cancel decrypt request', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: '0x7b22666f6f223a22626172227d',
    };
    decryptMessageManagerMock.approveMessage.mockResolvedValue(
      messageToDecrypt,
    );
    keyringControllerMock.decryptMessage.mockRejectedValue(new Error('error'));
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.decryptMessage(
      messageToDecrypt,
    );

    expect(decryptMessageManagerMock.rejectMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.rejectMessage).toBeCalledWith(
      messageIdMock,
    );
    expect(result).toBe(mockExtState);
  });

  it('should decrypt message inline', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: '0x7b22666f6f223a22626172227d',
    };
    const decryptedMessage = {
      ...messageToDecrypt,
      rawData: 'decryptedMessage',
      data: {
        foo: 'bar',
      },
    };
    decryptMessageManagerMock.getMessage.mockReturnValue(messageToDecrypt);
    keyringControllerMock.decryptMessage.mockResolvedValue('decryptedMessage');
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.decryptMessageInline(
      messageToDecrypt,
    );

    expect(decryptMessageManagerMock.updateMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.updateMessage).toBeCalledWith(
      decryptedMessage,
    );
    expect(result).toBe(mockExtState);
  });

  it('should extend message if decrypt message inline fails', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: '0x7b22666f6f223a22626172227d',
    };
    decryptMessageManagerMock.getMessage.mockReturnValue(messageToDecrypt);
    keyringControllerMock.decryptMessage.mockRejectedValue(
      new Error('failure on decryption'),
    );
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.decryptMessageInline(
      messageToDecrypt,
    );

    expect(decryptMessageManagerMock.updateMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.updateMessage).toBeCalledWith({
      ...messageToDecrypt,
      error: 'failure on decryption',
    });
    expect(result).toBe(mockExtState);
  });

  it('should be able to cancel decrypt message', async () => {
    decryptMessageManagerMock.rejectMessage.mockResolvedValue(messageMock);
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.cancelDecryptMessage(
      messageIdMock,
    );

    expect(decryptMessageManagerMock.rejectMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.rejectMessage).toBeCalledWith(
      messageIdMock,
    );
    expect(result).toBe(mockExtState);
  });

  it('should be able to reject all unapproved messages', async () => {
    decryptMessageManagerMock.getUnapprovedMessages.mockReturnValue({
      [messageIdMock]: messageMock,
    });

    await decryptMessageController.rejectUnapproved('reason to cancel');

    expect(decryptMessageManagerMock.rejectMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.rejectMessage).toBeCalledWith(
      messageIdMock,
    );
    expect(metricsEventMock).toBeCalledTimes(1);
    expect(metricsEventMock).toBeCalledWith({
      event: 'reason to cancel',
      category: EVENT.CATEGORIES.MESSAGES,
      properties: {
        action: 'Decrypt Message Request',
      },
    });
  });
});
