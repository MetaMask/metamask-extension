import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
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
  createTimestampTerms,
  ANY_BENEFICIARY,
  ROOT_AUTHORITY,
  type Hex,
} from '@metamask/delegation-core';
import { bytesToHex } from '@metamask/utils';
import type { FeatureFlags } from '@metamask/remote-feature-flag-controller';
import {
  BATCH_DEFAULT_MODE,
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  encodeRedeemDelegations,
  getDeleGatorEnvironment,
  type Caveat,
} from '../../../../shared/lib/delegation';

import { CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME } from './caveats';
import { SUBSIDIZED_ORDER_ID_PLACEHOLDER } from './subsidized-caveats';
import {
  convertTransactionToRedeemDelegations,
  DelegationMessenger,
  getDelegationTransaction,
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

jest.mock('@metamask/transaction-controller', () => {
  const actual = jest.requireActual('@metamask/transaction-controller');
  return Object.defineProperty(
    Object.create(actual),
    'decodeAuthorizationSignature',
    {
      enumerable: true,
      value: jest.fn(),
    },
  );
});

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
const REDEEMER_ENFORCER_MOCK =
  '0xRedeemerEnforcer0000000000000000000000000' as Hex;

const REDEEMER_1_MOCK = '0xB01caEa8c6C47bbf4F4b4c5080Ca642043359C2E' as Hex;
const DELEGATEE_MOCK = '0x5555555555555555555555555555555555555555' as Hex;
const TIMESTAMP_ENFORCER_MOCK =
  '0xTimestampEnforcer000000000000000000000000' as Hex;

const TERMS_LIMITED_MOCK = '0xterms-limited' as Hex;
const TERMS_EXACT_MOCK = '0xterms-exact' as Hex;
const TERMS_BATCH_MOCK = '0xterms-batch' as Hex;

const AUTHORIZATION_SIGNATURE_MOCK = `0x${'1'.repeat(130)}` as Hex;
const FIXED_NOW = 1_700_000_000_000;

const UPGRADE_CONTRACT_ADDRESS_MOCK =
  '0x1234567890123456789012345678901234567899' as Hex;

const SIGNATURE_MOCK = '0xsignature' as Hex;
const ENCODED_MOCK = '0xencoded' as Hex;

const CAVEATS_OVERRIDE_MOCK: Caveat[] = [
  { args: '0xcc' as Hex, enforcer: '0xaa' as Hex, terms: '0xbb' as Hex },
];

const ADDITIONAL_EXECUTION_MOCK: ExecutionStruct = {
  callData: '0xabcdef',
  target: '0x9999999999999999999999999999999999999999',
  value: 7n,
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
  let remoteFeatureFlags: FeatureFlags;

  beforeEach(() => {
    jest.resetAllMocks();
    remoteFeatureFlags = {};
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_NOW);

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
      | RemoteFeatureFlagControllerGetStateAction
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
      | RemoteFeatureFlagControllerGetStateAction
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
        'RemoteFeatureFlagController:getState',
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
      'RemoteFeatureFlagController:getState',
      () => ({ cacheTimestamp: 0, remoteFeatureFlags }),
    );

    baseMessenger.registerActionHandler(
      'TransactionController:isAtomicBatchSupported',
      isAtomicBatchSupportedMock,
    );

    messenger = childMessenger as DelegationMessenger;

    getDeleGatorEnvironmentMock.mockReturnValue({
      DelegationManager: DELEGATION_MANAGER_ADDRESS_MOCK,
      caveatEnforcers: {
        AllowedCalldataEnforcer: ALLOWED_CALLDATA_ENFORCER_MOCK,
        AllowedTargetsEnforcer: ALLOWED_TARGETS_ENFORCER_MOCK,
        ExactExecutionBatchEnforcer: EXACT_EXECUTION_BATCH_ENFORCER_MOCK,
        ExactExecutionEnforcer: EXACT_EXECUTION_ENFORCER_MOCK,
        LimitedCallsEnforcer: LIMITED_CALLS_ENFORCER_MOCK,
        RedeemerEnforcer: REDEEMER_ENFORCER_MOCK,
        TimestampEnforcer: TIMESTAMP_ENFORCER_MOCK,
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildTimestampCaveat = (
    nowSeconds: number,
    deadlineSeconds: number,
  ) => ({
    args: '0x',
    enforcer: TIMESTAMP_ENFORCER_MOCK,
    terms: createTimestampTerms({
      afterThreshold: 0,
      beforeThreshold: nowSeconds + deadlineSeconds,
    }),
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
            callData: '0xaaaa',
            target: '0x1111111111111111111111111111111111111111',
            value: 2n,
          },
          {
            callData: '0xbbbb',
            target: '0x2222222222222222222222222222222222222222',
            value: 3n,
          },
        ],
      });
      expect(createExactExecutionTermsMock).not.toHaveBeenCalled();

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                callData: '0xaaaa',
                target: '0x1111111111111111111111111111111111111111',
                value: 2n,
              },
              {
                callData: '0xbbbb',
                target: '0x2222222222222222222222222222222222222222',
                value: 3n,
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
          callData: '0xdeadbeef',
          target: TRANSACTION_META_MOCK.txParams.to,
          value: 256n,
        },
      });
      expect(createExactExecutionBatchTermsMock).not.toHaveBeenCalled();

      expect(encodeRedeemDelegationsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          executions: [
            [
              {
                callData: '0xdeadbeef',
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
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
                callData: '0xdeadbeef',
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
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
                callData: '0xdeadbeef',
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
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
                callData: '0xdeadbeef',
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
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
                callData: '0xdeadbeef',
                target: TRANSACTION_META_MOCK.txParams.to,
                value: 256n,
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
            callData: ADDITIONAL_EXECUTION_MOCK.callData,
            target: ADDITIONAL_EXECUTION_MOCK.target,
            value: ADDITIONAL_EXECUTION_MOCK.value,
          }),
        ]),
      });
    });

    it('uses provided caveats override instead of defaults', async () => {
      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
        caveats: CAVEATS_OVERRIDE_MOCK,
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

    describe('with redeemers', () => {
      const getSignedCaveats = () =>
        signDelegationMock.mock.calls[0][0].delegation.caveats;

      it('includes the delegatee as an allowed redeemer', async () => {
        await convertTransactionToRedeemDelegations({
          transaction: TRANSACTION_META_MOCK,
          messenger,
          delegatee: DELEGATEE_MOCK,
          redeemers: [REDEEMER_1_MOCK],
        });

        expect(getSignedCaveats()).toContainEqual({
          args: '0x',
          enforcer: REDEEMER_ENFORCER_MOCK,
          terms:
            `0x${REDEEMER_1_MOCK.slice(2)}${DELEGATEE_MOCK.slice(2)}`.toLowerCase(),
        });
      });
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
      const nowSeconds = Math.floor(FIXED_NOW / 1000);

      const expectedUnsignedDelegation = {
        authority: ROOT_AUTHORITY,
        caveats: [
          {
            args: '0x',
            enforcer: LIMITED_CALLS_ENFORCER_MOCK,
            terms: TERMS_LIMITED_MOCK,
          },
          buildTimestampCaveat(nowSeconds, 1800),
          {
            args: '0x',
            enforcer: EXACT_EXECUTION_ENFORCER_MOCK,
            terms: TERMS_EXACT_MOCK,
          },
        ],
        delegate: ANY_BENEFICIARY,
        delegator: TRANSACTION_META_MOCK.txParams.from,
        salt: expectedSalt,
      };

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      expect(createLimitedCallsTermsMock).toHaveBeenCalledWith({ limit: 1 });
      expect(createExactExecutionTermsMock).toHaveBeenCalledWith({
        execution: {
          callData: '0xdeadbeef',
          target: TRANSACTION_META_MOCK.txParams.to,
          value: 256n,
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

    it('uses the feature flag override for the delegation deadline', async () => {
      remoteFeatureFlags = {
        [CONFIRMATIONS_DELEGATIONS_FEATURE_FLAG_NAME]: {
          deadlineSeconds: 2700,
        },
      };

      await convertTransactionToRedeemDelegations({
        transaction: TRANSACTION_META_MOCK,
        messenger,
      });

      const nowSeconds = Math.floor(FIXED_NOW / 1000);
      const expectedTimestampCaveat = buildTimestampCaveat(nowSeconds, 2700);

      expect(
        signDelegationMock.mock.calls[0][0].delegation.caveats,
      ).toContainEqual(expectedTimestampCaveat);
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
                callData: data,
                target: SELF_TARGET,
                value: 0n,
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
                callData: data,
                target: SELF_TARGET,
                value: 0n,
              },
            ],
          ],
        }),
      );
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
});
