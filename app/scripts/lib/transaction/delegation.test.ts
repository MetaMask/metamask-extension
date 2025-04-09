import {
  KeyringControllerSignTypedMessageAction,
  SignTypedDataVersion,
} from '@metamask/keyring-controller';
import { Messenger } from '@metamask/base-controller';
import { TransactionControllerInitMessenger } from '../../controller-init/messengers/transaction-controller-messenger';
import {
  Delegation,
  Execution,
  ExecutionMode,
  encodeRedeemDelegations,
  signDelegation,
} from './delegation';

const FROM_MOCK = '0x123456789012345678901234567890123456789a';
const CHAIN_ID_MOCK = '0x123';

const DELEGATION_MOCK: Delegation = {
  authority:
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  caveats: [
    {
      enforcer: '0x1234567890123456789012345678901234567896',
      terms: '0x1234',
      args: '0x4321',
    },
  ],
  delegate: '0x1234567890123456789012345678901234567892',
  delegator: '0x1234567890123456789012345678901234567893',
  salt: 123,
  signature: '0x7890',
};

const EXECUTION_MOCK: Execution = {
  target: '0x1234567890123456789012345678901234567894',
  value: '0x123',
  callData: '0x1234567890123456789012345678901234567895',
};

describe('Delegation Utils', () => {
  let keyringControllerSignTypedMessageMock: jest.MockedFn<
    KeyringControllerSignTypedMessageAction['handler']
  >;

  let initMessenger: TransactionControllerInitMessenger;

  beforeEach(() => {
    jest.resetAllMocks();

    keyringControllerSignTypedMessageMock = jest.fn();

    const baseMessenger = new Messenger<
      KeyringControllerSignTypedMessageAction,
      never
    >();

    baseMessenger.registerActionHandler(
      'KeyringController:signTypedMessage',
      keyringControllerSignTypedMessageMock,
    );

    initMessenger = baseMessenger.getRestricted({
      name: 'Test',
      allowedActions: ['KeyringController:signTypedMessage'],
      allowedEvents: [],
    });
  });

  describe('signDelegation', () => {
    it('calls keyring controller', async () => {
      await signDelegation({
        chainId: CHAIN_ID_MOCK,
        delegation: DELEGATION_MOCK,
        from: FROM_MOCK,
        messenger: initMessenger,
      });

      expect(keyringControllerSignTypedMessageMock).toHaveBeenCalledTimes(1);
      expect(keyringControllerSignTypedMessageMock).toHaveBeenCalledWith(
        {
          from: FROM_MOCK,
          data: expect.any(Object),
        },
        SignTypedDataVersion.V4,
      );
    });

    it('returns hash from keyring controller', async () => {
      keyringControllerSignTypedMessageMock.mockResolvedValueOnce(
        DELEGATION_MOCK.signature,
      );

      const result = await signDelegation({
        chainId: CHAIN_ID_MOCK,
        delegation: DELEGATION_MOCK,
        from: FROM_MOCK,
        messenger: initMessenger,
      });

      expect(result).toBe(DELEGATION_MOCK.signature);
    });
  });

  describe('encodeRedeemDelegations', () => {
    it('returns encoded hex if single delegation and single execution', () => {
      expect(
        encodeRedeemDelegations(
          [[DELEGATION_MOCK]],
          [ExecutionMode.BATCH_DEFAULT_MODE],
          [[EXECUTION_MOCK]],
        ),
      ).toMatchSnapshot();
    });

    it('returns encoded hex if delegation chains and batch execution', () => {
      expect(
        encodeRedeemDelegations(
          [[DELEGATION_MOCK, DELEGATION_MOCK]],
          [ExecutionMode.BATCH_DEFAULT_MODE],
          [[EXECUTION_MOCK, EXECUTION_MOCK]],
        ),
      ).toMatchSnapshot();
    });

    it('returns encoded hex if multiple delegation chains and multiple batch executions', () => {
      expect(
        encodeRedeemDelegations(
          [
            [DELEGATION_MOCK, DELEGATION_MOCK],
            [DELEGATION_MOCK, DELEGATION_MOCK],
          ],
          [ExecutionMode.BATCH_DEFAULT_MODE, ExecutionMode.BATCH_DEFAULT_MODE],
          [
            [EXECUTION_MOCK, EXECUTION_MOCK],
            [EXECUTION_MOCK, EXECUTION_MOCK],
          ],
        ),
      ).toMatchSnapshot();
    });
  });
});
