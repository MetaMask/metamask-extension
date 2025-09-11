import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  EncryptionPublicKeyManager,
  AbstractMessage,
  OriginalRequest,
  EncryptionPublicKeyManagerMessenger,
} from '@metamask/message-manager';
import { KeyringType } from '../../../shared/constants/keyring';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import EncryptionPublicKeyController, {
  EncryptionPublicKeyControllerMessenger,
  EncryptionPublicKeyControllerOptions,
} from './encryption-public-key';

jest.mock('@metamask/message-manager', () => ({
  EncryptionPublicKeyManager: jest.fn(),
}));

const messageIdMock = '123';
const messageIdMock2 = '456';
const stateMock = { test: 123 };
const addressMock = '0xc38bf1ad06ef69f0c04e29dbeb4152b4175f0a8d';
const publicKeyMock = '32762347862378feb87123781623a=';
const keyringTypeMock = KeyringType.hdKeyTree;

const messageParamsMock = {
  from: addressMock,
  origin: 'http://test.com',
  data: addressMock,
  metamaskId: messageIdMock,
};

const messageMock = {
  id: messageIdMock,
  time: 123,
  status: 'unapproved',
  type: 'testType',
  rawSig: undefined,
} as unknown as AbstractMessage;

const requestMock = {
  origin: 'http://test2.com',
} as OriginalRequest;

const createMessengerMock = () =>
  ({
    registerActionHandler: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    call: jest.fn(),
    registerInitialEventPayload: jest.fn(),
  }) as unknown as jest.Mocked<EncryptionPublicKeyControllerMessenger>;

const createManagerMessengerMock = () =>
  ({
    subscribe: jest.fn(),
  }) as unknown as jest.Mocked<EncryptionPublicKeyManagerMessenger>;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const createEncryptionPublicKeyManagerMock = <T>() =>
  ({
    getUnapprovedMessages: jest.fn(),
    getUnapprovedMessagesCount: jest.fn(),
    addUnapprovedMessageAsync: jest.fn(),
    approveMessage: jest.fn(),
    setMessageStatusAndResult: jest.fn(),
    rejectMessage: jest.fn(),
    subscribe: jest.fn(),
    update: jest.fn(),
    hub: {
      on: jest.fn(),
    },
  }) as unknown as jest.Mocked<T>;

describe('EncryptionPublicKeyController', () => {
  let encryptionPublicKeyController: EncryptionPublicKeyController;

  const encryptionPublicKeyManagerConstructorMock =
    EncryptionPublicKeyManager as jest.MockedClass<
      typeof EncryptionPublicKeyManager
    >;
  const encryptionPublicKeyManagerMock =
    createEncryptionPublicKeyManagerMock<EncryptionPublicKeyManager>();
  const messengerMock = createMessengerMock();
  const managerMessengerMock = createManagerMessengerMock();
  const getEncryptionPublicKeyMock = jest.fn();
  const getAccountKeyringTypeMock = jest.fn();
  const getStateMock = jest.fn();
  const metricsEventMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    encryptionPublicKeyManagerConstructorMock.mockReturnValue(
      encryptionPublicKeyManagerMock,
    );

    encryptionPublicKeyController = new EncryptionPublicKeyController({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messenger: messengerMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getEncryptionPublicKey: getEncryptionPublicKeyMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAccountKeyringType: getAccountKeyringTypeMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getState: getStateMock as any,

      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metricsEvent: metricsEventMock as any,
      managerMessenger: managerMessengerMock,
    } as EncryptionPublicKeyControllerOptions);
  });

  describe('unapprovedMsgCount', () => {
    it('returns value from message manager getter', () => {
      encryptionPublicKeyManagerMock.getUnapprovedMessagesCount.mockReturnValueOnce(
        10,
      );
      expect(encryptionPublicKeyController.unapprovedMsgCount).toBe(10);
    });
  });

  describe('resetState', () => {
    it('sets state to initial state', () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      encryptionPublicKeyController.update(() => ({
        unapprovedEncryptionPublicKeyMsgs: {
          [messageIdMock]: messageMock,

          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        unapprovedEncryptionPublicKeyMsgCount: 1,
      }));

      encryptionPublicKeyController.resetState();

      expect(encryptionPublicKeyController.state).toEqual({
        unapprovedEncryptionPublicKeyMsgs: {},
        unapprovedEncryptionPublicKeyMsgCount: 0,
      });
    });
  });

  describe('rejectUnapproved', () => {
    beforeEach(() => {
      const messages = {
        [messageIdMock]: messageMock,
        [messageIdMock2]: messageMock,
      };
      encryptionPublicKeyManagerMock.getUnapprovedMessages.mockReturnValueOnce(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages as any,
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      encryptionPublicKeyController.update(() => ({
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unapprovedEncryptionPublicKeyMsgs: messages as any,
      }));
    });

    it('rejects all messages in the message manager', () => {
      encryptionPublicKeyController.rejectUnapproved('Test Reason');
      expect(
        encryptionPublicKeyManagerMock.rejectMessage,
      ).toHaveBeenCalledTimes(2);
      expect(encryptionPublicKeyManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock,
      );
      expect(encryptionPublicKeyManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageIdMock2,
      );
    });

    it('fires metrics event with reject reason', () => {
      encryptionPublicKeyController.rejectUnapproved('Test Reason');
      expect(metricsEventMock).toHaveBeenCalledTimes(2);
      expect(metricsEventMock).toHaveBeenLastCalledWith({
        event: 'Test Reason',
        category: MetaMetricsEventCategory.Messages,
        properties: {
          action: 'Encryption public key Request',
        },
      });
    });
  });

  describe('newRequestEncryptionPublicKey', () => {
    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([
      ['Ledger', KeyringType.ledger],
      ['Trezor', KeyringType.trezor],
      ['Lattice', KeyringType.lattice],
      ['QR hardware', KeyringType.qr],
    ])(
      'throws if keyring is not supported',
      async (
        keyringName: string,
        keyringType: (typeof KeyringType)[keyof typeof KeyringType],
      ) => {
        getAccountKeyringTypeMock.mockResolvedValueOnce(keyringType);

        await expect(
          encryptionPublicKeyController.newRequestEncryptionPublicKey(
            addressMock,
            requestMock,
          ),
        ).rejects.toThrowError(
          `${keyringName} does not support eth_getEncryptionPublicKey.`,
        );
      },
    );

    it('adds message to message manager', async () => {
      getAccountKeyringTypeMock.mockResolvedValueOnce(keyringTypeMock);

      await encryptionPublicKeyController.newRequestEncryptionPublicKey(
        addressMock,
        requestMock,
      );

      expect(
        encryptionPublicKeyManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledTimes(1);
      expect(
        encryptionPublicKeyManagerMock.addUnapprovedMessageAsync,
      ).toHaveBeenCalledWith({ from: addressMock }, requestMock);
    });
  });

  describe('encryptionPublicKey', () => {
    beforeEach(() => {
      encryptionPublicKeyManagerMock.approveMessage.mockResolvedValueOnce({
        from: messageParamsMock.data,
      });

      getEncryptionPublicKeyMock.mockResolvedValueOnce(publicKeyMock);
    });

    it('approves message and signs', async () => {
      await encryptionPublicKeyController.encryptionPublicKey(
        messageParamsMock,
      );

      expect(getEncryptionPublicKeyMock).toHaveBeenCalledTimes(1);
      expect(getEncryptionPublicKeyMock).toHaveBeenCalledWith(
        messageParamsMock.data,
      );

      expect(
        encryptionPublicKeyManagerMock.setMessageStatusAndResult,
      ).toHaveBeenCalledTimes(1);
      expect(
        encryptionPublicKeyManagerMock.setMessageStatusAndResult,
      ).toHaveBeenCalledWith(
        messageParamsMock.metamaskId,
        publicKeyMock,
        'received',
      );
    });

    it('returns current state', async () => {
      getStateMock.mockReturnValueOnce(stateMock);
      expect(
        await encryptionPublicKeyController.encryptionPublicKey(
          messageParamsMock,
        ),
      ).toEqual(stateMock);
    });

    it('accepts approval', async () => {
      await encryptionPublicKeyController.encryptionPublicKey(
        messageParamsMock,
      );

      expect(messengerMock.call).toHaveBeenCalledTimes(1);
      expect(messengerMock.call).toHaveBeenCalledWith(
        'ApprovalController:acceptRequest',
        messageParamsMock.metamaskId,
      );
    });

    it('rejects message on error', async () => {
      getEncryptionPublicKeyMock.mockReset();
      getEncryptionPublicKeyMock.mockRejectedValue(new Error('Test Error'));

      await expect(
        encryptionPublicKeyController.encryptionPublicKey(messageParamsMock),
      ).rejects.toThrow('Test Error');

      expect(
        encryptionPublicKeyManagerMock.rejectMessage,
      ).toHaveBeenCalledTimes(1);
      expect(encryptionPublicKeyManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageParamsMock.metamaskId,
      );
    });

    it('rejects approval on error', async () => {
      getEncryptionPublicKeyMock.mockReset();
      getEncryptionPublicKeyMock.mockRejectedValue(new Error('Test Error'));

      await expect(
        encryptionPublicKeyController.encryptionPublicKey(messageParamsMock),
      ).rejects.toThrow('Test Error');

      expect(messengerMock.call).toHaveBeenCalledTimes(1);
      expect(messengerMock.call).toHaveBeenCalledWith(
        'ApprovalController:rejectRequest',
        messageParamsMock.metamaskId,
        'Cancel',
      );
    });
  });

  describe('cancelEncryptionPublicKey', () => {
    it('rejects message using message manager', async () => {
      encryptionPublicKeyController.cancelEncryptionPublicKey(messageIdMock);

      expect(
        encryptionPublicKeyManagerMock.rejectMessage,
      ).toHaveBeenCalledTimes(1);
      expect(encryptionPublicKeyManagerMock.rejectMessage).toHaveBeenCalledWith(
        messageParamsMock.metamaskId,
      );
    });

    it('rejects approval using approval controller', async () => {
      encryptionPublicKeyController.cancelEncryptionPublicKey(messageIdMock);

      expect(messengerMock.call).toHaveBeenCalledTimes(1);
      expect(messengerMock.call).toHaveBeenCalledWith(
        'ApprovalController:rejectRequest',
        messageParamsMock.metamaskId,
        'Cancel',
      );
    });

    it('returns current state', async () => {
      getStateMock.mockReturnValueOnce(stateMock);
      expect(
        await encryptionPublicKeyController.cancelEncryptionPublicKey(
          messageIdMock,
        ),
      ).toEqual(stateMock);
    });
  });

  describe('metadata', () => {
    it('includes expected state in debug snapshots', () => {
      expect(
        deriveStateFromMetadata(
          encryptionPublicKeyController.state,
          encryptionPublicKeyController.metadata,
          'anonymous',
        ),
      ).toMatchInlineSnapshot(`{}`);
    });

    it('includes expected state in state logs', () => {
      expect(
        deriveStateFromMetadata(
          encryptionPublicKeyController.state,
          encryptionPublicKeyController.metadata,
          'includeInStateLogs',
        ),
      ).toMatchInlineSnapshot(`
        {
          "unapprovedEncryptionPublicKeyMsgCount": 0,
          "unapprovedEncryptionPublicKeyMsgs": {},
        }
      `);
    });

    it('persists expected state', () => {
      expect(
        deriveStateFromMetadata(
          encryptionPublicKeyController.state,
          encryptionPublicKeyController.metadata,
          'persist',
        ),
      ).toMatchInlineSnapshot(`{}`);
    });

    it('exposes expected state to UI', () => {
      expect(
        deriveStateFromMetadata(
          encryptionPublicKeyController.state,
          encryptionPublicKeyController.metadata,
          'usedInUi',
        ),
      ).toMatchInlineSnapshot(`
        {
          "unapprovedEncryptionPublicKeyMsgCount": 0,
          "unapprovedEncryptionPublicKeyMsgs": {},
        }
      `);
    });
  });
});
