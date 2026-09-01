import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import {
  TransactionControllerGetNonceLockAction,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionMeta,
  decodeAuthorizationSignature,
} from '@metamask/transaction-controller';
import {
  createExactExecutionBatchTerms,
  createExactExecutionTerms,
  createLimitedCallsTerms,
  ANY_BENEFICIARY,
  ROOT_AUTHORITY,
  type Hex,
} from '@metamask/delegation-core';
import { bytesToHex } from '@metamask/utils';
import {
  BATCH_DEFAULT_MODE,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  encodeRedeemDelegations,
  getDeleGatorEnvironment,
} from '../../../../shared/lib/delegation';

import {
  convertTransactionToRedeemDelegations,
  DelegationMessenger,
  getDelegationTransaction,
  normalizeCallData,
  SUBSIDIZED_ORDER_ID_PLACEHOLDER,
} from './delegation';

jest.mock('../../../../shared/lib/delegation', () => ({
  ...jest.requireActual('../../../../shared/lib/delegation'),
  encodeRedeemDelegations: jest.fn(),
  getDeleGatorEnvironment: jest.fn(),
}));

jest.mock('@metamask/delegation-core', () => ({
  ...jest.requireActual('@metamask/delegation-core'),
  createLimitedCallsTerms: jest.fn(),
  createExactExecutionTerms: jest.fn(),
  createExactExecutionBatchTerms: jest.fn(),
}));

jest.mock('@metamask/transaction-controller', () => ({
  ...jest.requireActual('@metamask/transaction-controller'),
  decodeAuthorizationSignature: jest.fn(),
}));

const DELEGATION_MANAGER_ADDRESS_MOCK = '0xDelegationManagerAddress' as Hex;

const LIMITED_CALLS_ENFORCER_MOCK =
  '0xLimitedCallsEnforcer0000000000000000000000' as Hex;
const EXACT_EXECUTION_ENFORCER_MOCK =
  '0xExactExecutionEnforcer00000000000000000000' as Hex;
const EXACT_EXECUTION_BATCH_ENFORCER_MOCK =
  '0xExactExecutionBatchEnforcer00000000000000' as Hex;
const ALLOWED_TARGETS_ENFORCER_MOCK =
  '0xAllowedTargetsEnforcer0000000000000000000' as Hex;
const ALLOWED_CALLDATA_ENFORCER_MOCK =
  '0xAllowedCalldataEnforcer000000000000000000' as Hex;

const TERMS_LIMITED_MOCK = '0xterms-limited' as Hex;
const TERMS_EXACT_MOCK = '0xterms-exact' as Hex;
const TERMS_BATCH_MOCK = '0xterms-batch' as Hex;

const AUTHORIZATION_SIGNATURE_MOCK = `0x${'1'.repeat(130)}` as Hex;

const UPGRADE_CONTRACT_ADDRESS_MOCK =
  '0x1234567890123456789012345678901234567899' as Hex;

const SIGNATURE_MOCK = '0xsignature' as Hex;
const ENCODED_MOCK = '0xencoded' as Hex;

const CAVEATS_OVERRIDE_MOCK = [
  { enforcer: '0xaa', terms: '0xbb', args: '0xcc' },
];

const ADDITIONAL_EXECUTION_MOCK: ExecutionStruct = {
  target: '0x9999999999999999999999999999999999999999',
  value: 7n,
  callData: '0xabcdef',
};

const TRANSACTION_META_MOCK = {
  chainId: '0x1',
  networkClientId: 'mainnet',
  txParams: {
    from: '0x1234567890123456789012345678901234567890',
    to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    value: '0x100',
    data: '0xdeadbeef',
  },
} as unknown as TransactionMeta;

describe('delegation', () => {
  const getDeleGatorEnvironmentMock = jest.mocked(getDeleGatorEnvironment);
  const encodeRedeemDelegationsMock = jest.mocked(encodeRedeemDelegations);
  const decodeAuthorizationSignatureMock = jest.mocked(
    decodeAuthorizationSignature,
  );
  const createLimitedCallsTermsMock = jest.mocked(createLimitedCallsTerms);
  const createExactExecutionTermsMock = jest.mocked(createExactExecutionTerms);
  const createExactExecutionBatchTermsMock = jest.mocked(
    createExactExecutionBatchTerms,
  );

  const signDelegationMock: jest.MockedFn<
    DelegationControllerSignDelegationAction['handler']
  > = jest.fn();

  const signEip7702AuthorizationMock: jest.MockedFn<
    KeyringControllerSignEip7702AuthorizationAction['handler']
  > = jest.fn();

  const getNonceLockMock: jest.MockedFn<
    TransactionControllerGetNonceLockAction['handler']
  > = jest.fn();

  const isAtomicBatchSupportedMock: jest.MockedFn<
    TransactionControllerIsAtomicBatchSupportedAction['handler']
  > = jest.fn();

  let messenger: DelegationMessenger;

  beforeEach(() => {
    jest.resetAllMocks();

    jest.spyOn(crypto, 'getRandomValues').mockImplementation((array) => {
      if (array) {
        new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(
          0x42,
        );
      }
      return array as ArrayBufferView;
    });

    const baseMessenger = new Messenger<
      MockAnyNamespace,
      | DelegationControllerSignDelegationAction
      | KeyringControllerSignEip7702AuthorizationAction
      | TransactionControllerGetNonceLockAction
      | TransactionControllerIsAtomicBatchSupportedAction,
      never
    >({
      namespace: MOCK_ANY_NAMESPACE,
    });

    const childMessenger = new Messenger<
      'TestDelegation',
      | DelegationControllerSignDelegationAction
      | KeyringControllerSignEip7702AuthorizationAction
      | TransactionControllerGetNonceLockAction
      | TransactionControllerIsAtomicBatchSupportedAction,
      never,
      typeof baseMessenger
    >({
      namespace: 'TestDelegation',
      parent: baseMessenger,
    });

    baseMessenger.delegate({
      messenger: childMessenger,
      actions: [
        'DelegationController:signDelegation',
        'KeyringController:signEip7702Authorization',
        'TransactionController:getNonceLock',
        'TransactionController:isAtomicBatchSupported',
      ] as never,
    });

    baseMessenger.registerActionHandler(
      'DelegationController:signDelegation',
      signDelegationMock,
    );

    baseMessenger.registerActionHandler(
      'KeyringController:signEip7702Authorization',
      signEip7702AuthorizationMock,
    );

    baseMessenger.registerActionHandler(
      'TransactionController:getNonceLock',
      getNonceLockMock,
    );

    baseMessenger.registerActionHandler(
      'TransactionController:isAtomicBatchSupported',
      isAtomicBatchSupportedMock,
    );

    messenger = childMessenger as DelegationMessenger;

    getDeleGatorEnvironmentMock.mockReturnValue({
      DelegationManager: DELEGATION_MANAGER_ADDRESS_MOCK,
      caveatEnforcers: {
        LimitedCallsEnforcer: LIMITED_CALLS_ENFORCER_MOCK,
        ExactExecutionEnforcer: EXACT_EXECUTION_ENFORCER_MOCK,
        ExactExecutionBatchEnforcer: EXACT_EXECUTION_BATCH_ENFORCER_MOCK,
        AllowedTargetsEnforcer: ALLOWED_TARGETS_ENFORCER_MOCK,
        AllowedCalldataEnforcer: ALLOWED_CALLDATA_ENFORCER_MOCK,
      },
    } as never);

    createLimitedCallsTermsMock.mockReturnValue(TERMS_LIMITED_MOCK as never);
    createExactExecutionTermsMock.mockReturnValue(TERMS_EXACT_MOCK as never);
    createExactExecutionBatchTermsMock.mockReturnValue(
      TERMS_BATCH_MOCK as never,
    );

    encodeRedeemDelegationsMock.mockReturnValue(ENCODED_MOCK);
    signDelegationMock.mockResolvedValue(SIGNATURE_MOCK);

    signEip7702AuthorizationMock.mockResolvedValue(
      AUTHORIZATION_SIGNATURE_MOCK,
    );

    getNonceLockMock.mockResolvedValue({
      nextNonce: 9,
      releaseLock: jest.fn(),
    } as never);

    decodeAuthorizationSignatureMock.mockReturnValue({
      r: `0x${'1'.repeat(64)}` as Hex,
      s: `0x${'1'.repeat(64)}` as Hex,
      yParity: '0x1' as Hex,
    });
  });

  describe('convertTransactionToRedeemDelegations', () => {
    it('uses nestedTransactions for executions and caveats when available', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [
          {
            to: '0x1111111111111111111111111111111111111111',
            value: '0x2',
            data: '0xaaaa',
          },
          {
            to: '0x2222222222222222222222222222222222222222',
            value: '0x3',
            data: '0xbbbb',
          },
        ],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(createLimitedCallsTermsMock).toHaveBeenCalledWith({ limit: 1 });
      expect(createExactExecutionBatchTermsMock).toHaveBeenCalledWith({
        executions: [
          {
            target: '0x1111111111111111111111111111111111111111',
            value: 2n,
            callData: '0xaaaa',
          },
          {
            target: '0x2222222222222222222222222222222222222222',
            value: 3n,
            callData: '0xbbbb',
          },
        ],
      });
      expect(createExactExecutionTermsMock).not.toHaveBeenCalled();

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: '0x1111111111111111111111111111111111111111',
                value: 2n,
                callData: '0xaaaa',
              },
              {
                target: '0x2222222222222222222222222222222222222222',
                value: 3n,
                callData: '0xbbbb',
              },
            ],
          ],
        }),
      );
    });

    it('uses the parent txParams execution when useParentExecution is set, even with nestedTransactions', async () => {
      // Mirrors the mobile publish hook: sponsored Money Account withdrawals
      // must relay the parent `execute()` as a single execution — redeeming
      // the nested calls directly mined on Monad without moving funds.
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [
          {
            to: '0x1111111111111111111111111111111111111111',
            value: '0x2',
            data: '0xaaaa',
          },
          {
            to: '0x2222222222222222222222222222222222222222',
            value: '0x3',
            data: '0xbbbb',
          },
        ],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({
        transaction,
        messenger,
        useParentExecution: true,
      });

      expect(createExactExecutionTermsMock).toHaveBeenCalledWith({
        execution: {
          target: TRANSACTION_META_MOCK.txParams.to,
          value: 256n,
          callData: '0xdeadbeef',
        },
      });
      expect(createExactExecutionBatchTermsMock).not.toHaveBeenCalled();

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('normalizes nestedTransactions callData', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [
          {
            to: '0x1111111111111111111111111111111111111111',
            value: '0x0',
          },
        ],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              expect.objectContaining({
                callData: '0x',
              }),
            ],
          ],
        }),
      );
    });

    it('falls back to txParams when nestedTransactions is empty', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('falls back to txParams when nestedTransactions is absent', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('falls back to txParams when nestedTransactions have no to field', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        nestedTransactions: [{ type: 'swap' }],
      } as unknown as TransactionMeta;

      await convertTransactionToRedeemDelegations({ transaction, messenger });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
            ],
          ],
        }),
      );
    });

    it('appends additionalExecutions to default executions', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
                callData: '0xdeadbeef',
              },
              ADDITIONAL_EXECUTION_MOCK,
            ],
          ],
        }),
      );
    });

    it('includes additionalExecutions in default caveats', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(createExactExecutionBatchTermsMock).toHaveBeenCalledWith({
        executions: expect.arrayContaining([
          expect.objectContaining({
            target: ADDITIONAL_EXECUTION_MOCK.target,
            value: ADDITIONAL_EXECUTION_MOCK.value,
            callData: ADDITIONAL_EXECUTION_MOCK.callData,
          }),
        ]),
      });
    });

    it('uses provided caveats override instead of defaults', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        caveats: CAVEATS_OVERRIDE_MOCK as never,
      });

      expect(createLimitedCallsTermsMock).not.toHaveBeenCalled();
      expect(createExactExecutionTermsMock).not.toHaveBeenCalled();
      expect(createExactExecutionBatchTermsMock).not.toHaveBeenCalled();

      expect(signDelegationMock).toHaveBeenCalledWith(
        expect.objectContaining({
          delegation: expect.objectContaining({
            caveats: CAVEATS_OVERRIDE_MOCK,
          }),
        }),
      );
    });

    it('uses SINGLE_DEFAULT_MODE for single execution', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modes: [SINGLE_DEFAULT_MODE],
        }),
      );
    });

    it('uses BATCH_DEFAULT_MODE for multiple executions', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modes: [BATCH_DEFAULT_MODE],
        }),
      );
    });

    it('signs delegation via DelegationController:signDelegation messenger action', async () => {
      const expectedSalt = bytesToHex(new Uint8Array(32).fill(0x42));

      const expectedUnsignedDelegation = {
        delegator: TRANSACTION_META_MOCK.txParams.from,
        delegate: ANY_BENEFICIARY,
        authority: ROOT_AUTHORITY,
        salt: expectedSalt,
        caveats: [
          {
            enforcer: LIMITED_CALLS_ENFORCER_MOCK,
            terms: TERMS_LIMITED_MOCK,
            args: '0x',
          },
          {
            enforcer: EXACT_EXECUTION_ENFORCER_MOCK,
            terms: TERMS_EXACT_MOCK,
            args: '0x',
          },
        ],
      };

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(createLimitedCallsTermsMock).toHaveBeenCalledWith({ limit: 1 });
      expect(createExactExecutionTermsMock).toHaveBeenCalledWith({
        execution: {
          target: TRANSACTION_META_MOCK.txParams.to,
          value: 256n,
          callData: '0xdeadbeef',
        },
      });
      expect(createExactExecutionBatchTermsMock).not.toHaveBeenCalled();

      expect(signDelegationMock).toHaveBeenCalledWith({
        chainId: '0x1',
        delegation: expectedUnsignedDelegation,
      });
      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          delegations: [
            [{ ...expectedUnsignedDelegation, signature: SIGNATURE_MOCK }],
          ],
        }),
      );
    });

    it('uses a random salt for each delegation', async () => {
      const randomSalt1 = new Uint8Array(32).fill(0x5a);
      const randomSalt2 = new Uint8Array(32).fill(0x5b);

      const getRandomValuesSpy = jest
        .spyOn(crypto, 'getRandomValues')
        .mockImplementationOnce((array) => {
          if (!array) {
            throw new Error('getRandomValues expected a buffer');
          }
          new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(
            randomSalt1,
          );
          return array;
        })
        .mockImplementationOnce((array) => {
          if (!array) {
            throw new Error('getRandomValues expected a buffer');
          }
          new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(
            randomSalt2,
          );
          return array;
        });

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      const firstSalt = signDelegationMock.mock.calls[0][0].delegation.salt;
      const secondSalt = signDelegationMock.mock.calls[1][0].delegation.salt;

      expect(firstSalt).toBe(bytesToHex(randomSalt1));
      expect(secondSalt).toBe(bytesToHex(randomSalt2));
      expect(firstSalt).not.toBe(secondSalt);

      getRandomValuesSpy.mockRestore();
    });

    it('returns delegation manager address as to', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(result.to).toBe(DELEGATION_MANAGER_ADDRESS_MOCK);
    });

    it('builds authorization list when authorization.upgradeContractAddress is provided', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      });

      expect(getNonceLockMock).toHaveBeenCalledWith(
        TRANSACTION_META_MOCK.txParams.from,
        'mainnet',
      );
      expect(signEip7702AuthorizationMock).toHaveBeenCalledWith({
        chainId: 1,
        contractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        from: TRANSACTION_META_MOCK.txParams.from,
        nonce: 9,
      });
      expect(decodeAuthorizationSignatureMock).toHaveBeenCalledWith(
        AUTHORIZATION_SIGNATURE_MOCK,
      );
      expect(result.authorizationList).toEqual([
        {
          address: UPGRADE_CONTRACT_ADDRESS_MOCK,
          chainId: '0x1',
          nonce: '0x9',
          r: `0x${'1'.repeat(64)}`,
          s: `0x${'1'.repeat(64)}`,
          yParity: '0x1',
        },
      ]);
    });

    it('strips all leading zero nibbles from r, s, yParity via upstream util', async () => {
      decodeAuthorizationSignatureMock.mockReturnValue({
        r: '0x1' as Hex,
        s: '0x2' as Hex,
        yParity: '0x0' as Hex,
      });

      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      });

      expect(result.authorizationList).toEqual([
        {
          address: UPGRADE_CONTRACT_ADDRESS_MOCK,
          chainId: '0x1',
          nonce: '0x9',
          r: '0x1',
          s: '0x2',
          yParity: '0x0',
        },
      ]);
    });

    it('skips authorization list when authorization is omitted', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(result.authorizationList).toBeUndefined();
      expect(getNonceLockMock).not.toHaveBeenCalled();
      expect(signEip7702AuthorizationMock).not.toHaveBeenCalled();
    });

    it('returns minimal authorization list with only address when minimal is true', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: { minimal: true },
      });

      expect(result.authorizationList).toEqual([
        { address: UPGRADE_CONTRACT_ADDRESS_MOCK },
      ]);
      expect(getNonceLockMock).not.toHaveBeenCalled();
      expect(signEip7702AuthorizationMock).not.toHaveBeenCalled();
    });

    it('returns setCode transaction type when authorization list is present', async () => {
      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      });

      expect(result.type).toBe('0x4');
    });

    it('returns original transaction type when no authorization list', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        txParams: { ...TRANSACTION_META_MOCK.txParams, type: '0x2' },
      } as unknown as TransactionMeta;

      const result = await convertTransactionToRedeemDelegations({
        transaction,
        messenger,
      });

      expect(result.type).toBe('0x2');
    });

    it('resolves authorization via messenger isAtomicBatchSupported', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {},
      });

      expect(isAtomicBatchSupportedMock).toHaveBeenCalledWith({
        address: TRANSACTION_META_MOCK.txParams.from,
        chainIds: ['0x1'],
      });

      expect(signEip7702AuthorizationMock).toHaveBeenCalledTimes(1);
    });

    it('throws when isAtomicBatchSupported returns no upgradeContractAddress', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        { chainId: '0x1', isSupported: false },
      ] as never);

      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {},
        }),
      ).rejects.toThrow('Upgrade contract address not found');
    });

    it('throws when chain is not in isAtomicBatchSupported result', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        { chainId: '0x999', isSupported: false },
      ] as never);

      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {},
        }),
      ).rejects.toThrow('Chain does not support EIP-7702');
    });

    it('skips authorization when already upgraded and isSupported', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: true,
          delegationAddress: '0xexisting',
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {},
      });

      expect(result.authorizationList).toBeUndefined();
      expect(signEip7702AuthorizationMock).not.toHaveBeenCalled();
    });

    it('throws when upgraded to different address and upgradeExistingDelegation is false', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          delegationAddress: '0xdifferent',
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      await expect(
        convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          authorization: {
            upgradeExistingDelegation: false,
          },
        }),
      ).rejects.toThrow(
        'Account is already upgraded to a different delegation address',
      );
    });

    it('overwrites delegation when upgraded to different address by default', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          delegationAddress: '0xdifferent',
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {},
      });

      expect(result.authorizationList).toBeDefined();
      expect(signEip7702AuthorizationMock).toHaveBeenCalledTimes(1);
    });

    it('overwrites delegation when upgraded to different address and upgradeExistingDelegation is true', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          delegationAddress: '0xdifferent',
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      const result = await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        authorization: {
          upgradeExistingDelegation: true,
        },
      });

      expect(result.authorizationList).toBeDefined();
      expect(signEip7702AuthorizationMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('subsidized Relay execute', () => {
    const PLACEHOLDER_BODY = SUBSIDIZED_ORDER_ID_PLACEHOLDER.slice(2);
    const SELF_TARGET = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Hex;
    const APPROVE_SELECTOR = '095ea7b3';
    const DEPOSIT_SELECTOR = 'f9e4bab4';
    const EXECUTE_SELECTOR = '1a2b3c4d';
    const APPROVE_DATA = `${APPROVE_SELECTOR}${'22'.repeat(28)}`;
    const DEPOSIT_DATA = `${DEPOSIT_SELECTOR}${APPROVE_SELECTOR}${'33'.repeat(
      12,
    )}${PLACEHOLDER_BODY}${APPROVE_SELECTOR}${'33'.repeat(12)}`;

    const buildBatchData = (occurrences = 1): Hex => {
      const fill = (byte: string) => byte.repeat(16);
      const header = `${EXECUTE_SELECTOR}${fill('11')}${APPROVE_DATA}${DEPOSIT_DATA}`;
      const windows = Array.from(
        { length: occurrences },
        (_, index) => `${PLACEHOLDER_BODY}${fill(index === 0 ? '44' : '55')}`,
      ).join('');
      return `0x${header}${windows}${fill('cd')}` as Hex;
    };

    const buildSubsidizedTransaction = (data: Hex): TransactionMeta =>
      ({
        ...TRANSACTION_META_MOCK,
        txParams: {
          ...TRANSACTION_META_MOCK.txParams,
          to: SELF_TARGET,
          data,
          value: '0x0',
        },
        nestedTransactions: [
          {
            data: `0x${APPROVE_DATA}` as Hex,
            to: '0x1111111111111111111111111111111111111111' as Hex,
            value: '0x0' as Hex,
          },
          {
            data: `0x${DEPOSIT_DATA}` as Hex,
            to: '0x2222222222222222222222222222222222222222' as Hex,
            value: '0x0' as Hex,
          },
        ],
      }) as TransactionMeta;

    const parseAllowedCalldata = (terms: string) => ({
      startIndex: parseInt(terms.slice(2, 2 + 64), 16),
      value: terms.slice(2 + 64).toLowerCase(),
    });

    const getAllowedCalldataTerms = () => {
      const { caveats } = signDelegationMock.mock.calls[0][0].delegation;
      return caveats
        .map((caveat) => caveat.terms)
        .filter((terms) => terms.length > 2 + 64)
        .map(parseAllowedCalldata);
    };

    it('redeems the batch as a single execution in single mode', async () => {
      const data = buildBatchData(1);

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
      });

      expect(createExactExecutionTermsMock).not.toHaveBeenCalled();
      expect(createExactExecutionBatchTermsMock).not.toHaveBeenCalled();
      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modes: [SINGLE_DEFAULT_MODE],
          executions: [
            [
              {
                target: SELF_TARGET,
                value: 0n,
                callData: data,
              },
            ],
          ],
        }),
      );
    });

    it('does not append additionalExecutions on the subsidized path', async () => {
      const data = buildBatchData(1);

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
        additionalExecutions: [ADDITIONAL_EXECUTION_MOCK],
      });

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                target: SELF_TARGET,
                value: 0n,
                callData: data,
              },
            ],
          ],
        }),
      );
    });

    it('signs allowedTargets and limitedCalls caveats', async () => {
      const data = buildBatchData(1);

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
      });

      const { caveats } = signDelegationMock.mock.calls[0][0].delegation;

      expect(caveats[0]).toStrictEqual({
        enforcer: ALLOWED_TARGETS_ENFORCER_MOCK,
        terms: SELF_TARGET,
        args: '0x',
      });
      expect(caveats[1]).toStrictEqual({
        enforcer: LIMITED_CALLS_ENFORCER_MOCK,
        terms: TERMS_LIMITED_MOCK,
        args: '0x',
      });
      expect(
        caveats
          .slice(2)
          .every(
            (caveat) => caveat.enforcer === ALLOWED_CALLDATA_ENFORCER_MOCK,
          ),
      ).toBe(true);
    });

    it('splits only after order-ID-bearing call selectors', async () => {
      const data = buildBatchData(1);
      const body = data.slice(2).toLowerCase();

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
      });

      const enforced = getAllowedCalldataTerms();
      const approveSplit = body.indexOf(APPROVE_DATA) / 2 + 4;
      const depositSplit = body.indexOf(DEPOSIT_DATA) / 2 + 4;
      const segmentEnds = enforced.map(
        ({ startIndex, value }) => startIndex + value.length / 2,
      );

      expect(segmentEnds).toContain(depositSplit);
      expect(segmentEnds).not.toContain(approveSplit);

      const depositStart = body.indexOf(DEPOSIT_DATA) / 2;
      const innerApprove1 = depositStart + 4 + 4;
      expect(segmentEnds).not.toContain(innerApprove1);
    });

    it('produces far fewer caveats than the per-selector split', async () => {
      const data = buildBatchData(2);

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
      });

      const { caveats } = signDelegationMock.mock.calls[0][0].delegation;
      expect(caveats.length).toBeLessThanOrEqual(7);
    });

    it('leaves the order-ID placeholder window free and enforces the remainder', async () => {
      const data = buildBatchData(1);

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
      });

      const body = data.slice(2).toLowerCase();
      const enforced = getAllowedCalldataTerms();

      for (const { value } of enforced) {
        expect(value).not.toContain(PLACEHOLDER_BODY);
      }

      const rebuilt = Array.from(body);
      for (const { startIndex, value } of enforced) {
        for (let i = 0; i < value.length; i++) {
          rebuilt[startIndex * 2 + i] = value[i];
        }
      }
      expect(rebuilt.join('')).toBe(body);

      const placeholderStart = body.indexOf(PLACEHOLDER_BODY) / 2;
      const covered = enforced.some(
        ({ startIndex, value }) =>
          startIndex <= placeholderStart &&
          placeholderStart < startIndex + value.length / 2,
      );
      expect(covered).toBe(false);
    });

    it('frees every occurrence when the placeholder appears multiple times', async () => {
      const data = buildBatchData(2);

      await convertTransactionToRedeemDelegations({
        transaction: buildSubsidizedTransaction(data),
        messenger,
        isSubsidized: true,
      });

      const enforced = getAllowedCalldataTerms();
      for (const { value } of enforced) {
        expect(value).not.toContain(PLACEHOLDER_BODY);
      }

      const body = data.slice(2).toLowerCase();
      let searchIndex = body.indexOf(PLACEHOLDER_BODY);
      const placeholderStarts: number[] = [];
      while (searchIndex !== -1) {
        placeholderStarts.push(searchIndex / 2);
        searchIndex = body.indexOf(PLACEHOLDER_BODY, searchIndex + 1);
      }
      expect(placeholderStarts).toHaveLength(3);

      for (const start of placeholderStarts) {
        const covered = enforced.some(
          ({ startIndex, value }) =>
            startIndex <= start && start < startIndex + value.length / 2,
        );
        expect(covered).toBe(false);
      }
    });

    it('throws with the subsidized prefix when batch calldata is missing', async () => {
      const transaction = {
        ...TRANSACTION_META_MOCK,
        txParams: {
          ...TRANSACTION_META_MOCK.txParams,
          to: SELF_TARGET,
          data: undefined,
        },
      } as unknown as TransactionMeta;

      await expect(
        convertTransactionToRedeemDelegations({
          transaction,
          messenger,
          isSubsidized: true,
        }),
      ).rejects.toThrow('Subsidized Caveats: Missing batch target or calldata');
    });

    it('forwards isSubsidized from getDelegationTransaction', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: true,
        },
      ]);

      const data = buildBatchData(1);

      await getDelegationTransaction(
        { messenger, isSubsidized: true },
        buildSubsidizedTransaction(data),
      );

      expect(createExactExecutionTermsMock).not.toHaveBeenCalled();
      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          modes: [SINGLE_DEFAULT_MODE],
        }),
      );
    });
  });

  describe('getDelegationTransaction', () => {
    it('adds value 0x0 to converted delegation transaction', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      const result = await getDelegationTransaction(
        { messenger },
        TRANSACTION_META_MOCK,
      );

      expect(result).toEqual(
        expect.objectContaining({
          data: ENCODED_MOCK,
          to: DELEGATION_MANAGER_ADDRESS_MOCK,
          value: '0x0',
        }),
      );
    });

    it('calls isAtomicBatchSupported via messenger', async () => {
      isAtomicBatchSupportedMock.mockResolvedValue([
        {
          chainId: '0x1',
          isSupported: false,
          upgradeContractAddress: UPGRADE_CONTRACT_ADDRESS_MOCK,
        },
      ]);

      await getDelegationTransaction({ messenger }, TRANSACTION_META_MOCK);

      expect(isAtomicBatchSupportedMock).toHaveBeenCalledWith({
        address: TRANSACTION_META_MOCK.txParams.from,
        chainIds: ['0x1'],
      });
    });
  });

  describe('normalizeCallData', () => {
    it('returns 0x for undefined', () => {
      expect(normalizeCallData(undefined)).toBe('0x');
    });

    it('returns 0x for null', () => {
      expect(normalizeCallData(null)).toBe('0x');
    });

    it('returns 0x for empty string', () => {
      expect(normalizeCallData('')).toBe('0x');
    });

    it('returns 0x for 0x', () => {
      expect(normalizeCallData('0x')).toBe('0x');
    });

    it('preserves valid hex data', () => {
      expect(normalizeCallData('0xdeadbeef')).toBe('0xdeadbeef');
    });

    it('lowercases hex', () => {
      expect(normalizeCallData('0xDEADBEEF')).toBe('0xdeadbeef');
    });

    it('adds 0x prefix if missing', () => {
      expect(normalizeCallData('deadbeef')).toBe('0xdeadbeef');
    });

    it('pads odd-length hex body', () => {
      expect(normalizeCallData('0xabc')).toBe('0x0abc');
      expect(normalizeCallData('abc')).toBe('0x0abc');
    });
  });
});
