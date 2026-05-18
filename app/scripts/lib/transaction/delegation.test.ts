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

import { stripSingleLeadingZero } from './util';
import {
  convertTransactionToRedeemDelegations,
  DelegationMessenger,
  getDelegationTransaction,
  normalizeCallData,
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

jest.mock('./util', () => ({
  ...jest.requireActual('./util'),
  stripSingleLeadingZero: jest.fn(),
}));

const DELEGATION_MANAGER_ADDRESS_MOCK = '0xDelegationManagerAddress' as Hex;

const LIMITED_CALLS_ENFORCER_MOCK =
  '0xLimitedCallsEnforcer0000000000000000000000' as Hex;
const EXACT_EXECUTION_ENFORCER_MOCK =
  '0xExactExecutionEnforcer00000000000000000000' as Hex;
const EXACT_EXECUTION_BATCH_ENFORCER_MOCK =
  '0xExactExecutionBatchEnforcer00000000000000' as Hex;

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
  const stripSingleLeadingZeroMock = jest.mocked(stripSingleLeadingZero);
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

    stripSingleLeadingZeroMock.mockImplementation((value) => value as never);
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
      expect(stripSingleLeadingZeroMock).toHaveBeenCalledTimes(2);
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
