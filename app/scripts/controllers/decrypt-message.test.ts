import {
  DecryptMessageManager,
  DecryptMessageParams,
} from '@metamask/message-manager';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import DecryptMessageController, {
  DecryptMessageControllerMessenger,
  DecryptMessageControllerOptions,
  getDefaultState,
} from './decrypt-message';

const messageIdMock = '12345';
const messageDataMock =
  '0x7b2276657273696f6e223a227832353531392d7873616c736132302d706f6c7931333035222c226e6f6e6365223a226b45586143524c3045646142766f77756e35675979357175784a4a6967304548222c22657068656d5075626c69634b6579223a224863334636506d314734385a567955424763365866537839682b77784b6958587238456a51434253466e553d222c2263697068657274657874223a22546a41556b68554a5968656e7a2f655a6e57454a2b31456c7861354f77765939613830507a62746c7a7a48746934634175525941227d';
const messageMock = {
  metamaskId: messageIdMock,
  time: 123,
  status: 'unapproved',
  type: 'testType',
  rawSig: undefined,
  data: messageDataMock,
  from: '0x0',
} as DecryptMessageParams & { metamaskId: string };

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
    registerInitialEventPayload: jest.fn(),
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
    setMessageStatusAndResult: jest.fn(),
    rejectMessage: jest.fn(),
    update: jest.fn(),
    subscribe: jest.fn(),
    updateMessage: jest.fn(),
    updateMessageErrorInline: jest.fn(),
    setResult: jest.fn(),
    hub: {
      on: jest.fn(),
    },
  } as any as jest.Mocked<T>);

describe('DecryptMessageController', () => {
  class MockDecryptMessageController extends DecryptMessageController {
    // update is protected, so we expose it for typechecking here
    public update(callback: Parameters<DecryptMessageController['update']>[0]) {
      return super.update(callback);
    }
  }

  let decryptMessageController: MockDecryptMessageController;

  const decryptMessageManagerConstructorMock =
    DecryptMessageManager as jest.MockedClass<typeof DecryptMessageManager>;
  const getStateMock = jest.fn();
  const keyringControllerMock = createKeyringControllerMock();
  const messengerMock = createMessengerMock();
  const metricsEventMock = jest.fn();

  const decryptMessageManagerMock =
    createDecryptMessageManagerMock<DecryptMessageManager>();

  const mockMessengerAction = (
    action: string,
    callback: (actionName: string, ...args: any[]) => any,
  ) => {
    messengerMock.call.mockImplementation((actionName, ...rest) => {
      if (actionName === action) {
        return callback(actionName, ...rest);
      }

      return Promise.resolve();
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();

    decryptMessageManagerConstructorMock.mockReturnValue(
      decryptMessageManagerMock,
    );

    decryptMessageController = new MockDecryptMessageController({
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
    await decryptMessageController.newRequestDecryptMessage(
      messageMock,
      undefined as any,
    );

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
      data: messageDataMock,
    };
    const decryptMessageActionCallbackMock = jest
      .fn()
      .mockReturnValue('decryptedMessage');
    decryptMessageManagerMock.approveMessage.mockResolvedValue(
      messageToDecrypt,
    );
    mockMessengerAction(
      'KeyringController:decryptMessage',
      decryptMessageActionCallbackMock,
    );
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.decryptMessage(
      messageToDecrypt,
    );

    expect(decryptMessageManagerMock.approveMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.approveMessage).toBeCalledWith(
      messageToDecrypt,
    );
    expect(decryptMessageActionCallbackMock).toBeCalledTimes(1);
    expect(decryptMessageActionCallbackMock).toBeCalledWith(
      'KeyringController:decryptMessage',
      messageToDecrypt,
    );
    expect(decryptMessageManagerMock.setMessageStatusAndResult).toBeCalledTimes(
      1,
    );
    expect(decryptMessageManagerMock.setMessageStatusAndResult).toBeCalledWith(
      messageIdMock,
      'decryptedMessage',
      'decrypted',
    );
    expect(result).toBe(mockExtState);
  });

  it('should throw when decrypting invalid message', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: '0x7b2022666f6f223a202262617222207d',
    };
    decryptMessageManagerMock.approveMessage.mockResolvedValue(
      messageToDecrypt,
    );

    expect(
      decryptMessageController.decryptMessage(messageToDecrypt),
    ).rejects.toThrow('Invalid encrypted data.');
  });

  it('should cancel decrypt request', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: messageDataMock,
    };
    decryptMessageManagerMock.approveMessage.mockResolvedValue(
      messageToDecrypt,
    );
    mockMessengerAction('KeyringController:decryptMessage', async () => {
      throw new Error('error');
    });
    getStateMock.mockReturnValue(mockExtState);

    return expect(
      decryptMessageController.decryptMessage(messageToDecrypt),
    ).rejects.toThrow('error');
  });

  it('should decrypt message inline', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: messageDataMock,
    } as any;
    decryptMessageManagerMock.getMessage.mockReturnValue(messageToDecrypt);
    mockMessengerAction(
      'KeyringController:decryptMessage',
      async () => 'decryptedMessage',
    );
    getStateMock.mockReturnValue(mockExtState);

    const result = await decryptMessageController.decryptMessageInline(
      messageToDecrypt,
    );

    expect(decryptMessageManagerMock.setResult).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.setResult).toBeCalledWith(
      messageMock.metamaskId,
      'decryptedMessage',
    );
    expect(result).toBe(mockExtState);
  });

  it('should throw when decrypting invalid message inline', async () => {
    const messageToDecrypt = {
      ...messageMock,
      data: '0x7b2022666f6f223a202262617222207d',
    };

    expect(
      decryptMessageController.decryptMessageInline(messageToDecrypt),
    ).rejects.toThrow('Invalid encrypted data.');
  });

  it('should be able to cancel decrypt message', async () => {
    decryptMessageManagerMock.rejectMessage.mockResolvedValue(
      messageMock as never,
    );
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
    } as any);

    await decryptMessageController.rejectUnapproved('reason to cancel');

    expect(decryptMessageManagerMock.rejectMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.rejectMessage).toBeCalledWith(
      messageIdMock,
    );
    expect(metricsEventMock).toBeCalledTimes(1);
    expect(metricsEventMock).toBeCalledWith({
      event: 'reason to cancel',
      category: MetaMetricsEventCategory.Messages,
      properties: {
        action: 'Decrypt Message Request',
      },
    });
  });
});
