import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  DecryptMessageManager,
  DecryptMessageParams,
} from '@metamask/message-manager';
import type { DecryptMessageManagerMessenger } from '@metamask/message-manager';
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
    subscribe: jest.fn(),
    publish: jest.fn(),
    call: jest.fn(),
  }) as unknown as jest.Mocked<DecryptMessageControllerMessenger>;

const createManagerMessengerMock = () =>
  ({
    subscribe: jest.fn(),
  }) as unknown as jest.Mocked<DecryptMessageManagerMessenger>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any as jest.Mocked<T>;

describe('DecryptMessageController', () => {
  let decryptMessageController: DecryptMessageController;

  const decryptMessageManagerConstructorMock =
    DecryptMessageManager as jest.MockedClass<typeof DecryptMessageManager>;
  const getStateMock = jest.fn();
  const keyringControllerMock = createKeyringControllerMock();
  const messengerMock = createMessengerMock();
  const managerMessengerMock = createManagerMessengerMock();
  const metricsEventMock = jest.fn();

  const decryptMessageManagerMock =
    createDecryptMessageManagerMock<DecryptMessageManager>();

  const mockMessengerAction = (
    action: string,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    decryptMessageController = new DecryptMessageController({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getState: getStateMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      keyringController: keyringControllerMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messenger: messengerMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metricsEvent: metricsEventMock as any,
      managerMessenger: managerMessengerMock,
    } as DecryptMessageControllerOptions);
  });

  it('should return unapprovedMsgCount', () => {
    decryptMessageManagerMock.getUnapprovedMessagesCount.mockReturnValue(5);
    expect(decryptMessageController.unapprovedDecryptMsgCount).toBe(5);
  });

  it('should reset state', () => {
    decryptMessageController.resetState();
    expect(decryptMessageController.state).toStrictEqual(getDefaultState());
  });

  it('should add unapproved messages', async () => {
    await decryptMessageController.newRequestDecryptMessage(
      messageMock,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const result =
      await decryptMessageController.decryptMessage(messageToDecrypt);

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

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    decryptMessageManagerMock.getMessage.mockReturnValue(messageToDecrypt);
    mockMessengerAction(
      'KeyringController:decryptMessage',
      async () => 'decryptedMessage',
    );
    getStateMock.mockReturnValue(mockExtState);

    const result =
      await decryptMessageController.decryptMessageInline(messageToDecrypt);

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

    const result =
      await decryptMessageController.cancelDecryptMessage(messageIdMock);

    expect(decryptMessageManagerMock.rejectMessage).toBeCalledTimes(1);
    expect(decryptMessageManagerMock.rejectMessage).toBeCalledWith(
      messageIdMock,
    );
    expect(result).toBe(mockExtState);
  });

  it('should be able to reject all unapproved messages', async () => {
    decryptMessageManagerMock.getUnapprovedMessages.mockReturnValue({
      [messageIdMock]: messageMock,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  describe('metadata', () => {
    it('includes expected state in debug snapshots', () => {
      expect(
        deriveStateFromMetadata(
          decryptMessageController.state,
          decryptMessageController.metadata,
          'anonymous',
        ),
      ).toMatchInlineSnapshot(`{}`);
    });

    it('includes expected state in state logs', () => {
      expect(
        deriveStateFromMetadata(
          decryptMessageController.state,
          decryptMessageController.metadata,
          'includeInStateLogs',
        ),
      ).toMatchInlineSnapshot(`
        {
          "unapprovedDecryptMsgCount": 0,
          "unapprovedDecryptMsgs": {},
        }
      `);
    });

    it('persists expected state', () => {
      expect(
        deriveStateFromMetadata(
          decryptMessageController.state,
          decryptMessageController.metadata,
          'persist',
        ),
      ).toMatchInlineSnapshot(`{}`);
    });

    it('exposes expected state to UI', () => {
      expect(
        deriveStateFromMetadata(
          decryptMessageController.state,
          decryptMessageController.metadata,
          'usedInUi',
        ),
      ).toMatchInlineSnapshot(`
        {
          "unapprovedDecryptMsgCount": 0,
          "unapprovedDecryptMsgs": {},
        }
      `);
    });
  });
});
