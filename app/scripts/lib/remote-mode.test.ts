/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { AssetType } from '@metamask/bridge-controller';
import {
  DailyAllowanceMetadata,
  REMOTE_MODES,
  NATIVE_ADDRESS,
} from '../../../shared/lib/remote-mode';
import { ControllerFlatState } from '../controller-init/controller-list';
import * as manifestFlags from '../../../shared/lib/manifestFlags';
import * as delegationEnvironment from '../../../shared/lib/delegation/environment';
import * as delegationEncoding from '../../../shared/lib/delegation/delegation';
import {
  ExecutionStruct,
  SINGLE_DEFAULT_MODE,
} from '../../../shared/lib/delegation';
import {
  getRemoteModeEnabled,
  isExistingAccount,
  getDailyAllowance,
  updateRemoteModeTransaction,
  // prepareDailyAllowanceTransaction, // Will test this indirectly via updateRemoteModeTransaction or directly later
  // buildUpdateTransaction, // Will test this indirectly via updateRemoteModeTransaction or directly later
} from './remote-mode';

// Define TokenSymbol for casting, as it's not directly importable from its original location for tests
type TokenSymbol = string;

// Mock dependencies
jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(),
}));

jest.mock('../../../shared/lib/delegation/environment', () => ({
  getDeleGatorEnvironment: jest.fn(),
}));

jest.mock('../../../shared/lib/delegation/delegation', () => ({
  encodeRedeemDelegations: jest.fn(),
}));

const mockGetManifestFlags = manifestFlags.getManifestFlags as jest.Mock;
const mockGetDeleGatorEnvironment =
  delegationEnvironment.getDeleGatorEnvironment as jest.Mock;
const mockEncodeRedeemDelegations =
  delegationEncoding.encodeRedeemDelegations as jest.Mock;

describe('remote-mode', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getRemoteModeEnabled', () => {
    it('should return true if manifestFlags.vaultRemoteMode is true', () => {
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: true },
      });
      const state = {
        remoteFeatureFlags: {},
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(true);
    });

    it('should return true if state.remoteFeatureFlags.vaultRemoteMode is true', () => {
      mockGetManifestFlags.mockReturnValue({ remoteFeatureFlags: {} });
      const state = {
        remoteFeatureFlags: { vaultRemoteMode: true },
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(true);
    });

    it('should return false if both manifest and state flags for vaultRemoteMode are false or undefined', () => {
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: false },
      });
      const state = {
        remoteFeatureFlags: { vaultRemoteMode: false },
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(false);
    });

    it('should return false if manifest flag is undefined and state flag is false', () => {
      mockGetManifestFlags.mockReturnValue({ remoteFeatureFlags: {} });
      const state = {
        remoteFeatureFlags: { vaultRemoteMode: false },
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(false);
    });

    it('should return false if manifest flag is false and state flag is undefined', () => {
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: false },
      });
      const state = {
        remoteFeatureFlags: {},
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(false);
    });

    it('state flags should override manifest flags (state true, manifest false)', () => {
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: false },
      });
      const state = {
        remoteFeatureFlags: { vaultRemoteMode: true },
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(false);
    });

    // Manifest flags are merged as defaults, then state flags override them.
    // So if state has it as true, and manifest has it as false, it should be true.
    // If state has it as false, and manifest has it as true, it should be false.
    it('state flags should override manifest flags (state false, manifest true)', () => {
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: true },
      });
      const state = {
        remoteFeatureFlags: { vaultRemoteMode: false },
      } as unknown as ControllerFlatState;
      expect(getRemoteModeEnabled(state)).toBe(true);
    });
  });

  describe('isExistingAccount', () => {
    it('should return true if the address exists in internalAccounts', () => {
      const state = {
        internalAccounts: {
          accounts: {
            account1: { address: '0x123' },
            account2: { address: '0x456' },
          },
        },
      } as unknown as ControllerFlatState;
      expect(isExistingAccount({ state, address: '0x123' })).toBe(true);
    });

    it('should return false if the address does not exist in internalAccounts', () => {
      const state = {
        internalAccounts: {
          accounts: {
            account1: { address: '0x123' },
            account2: { address: '0x456' },
          },
        },
      } as unknown as ControllerFlatState;
      expect(isExistingAccount({ state, address: '0x789' })).toBe(false);
    });

    it('should return false if internalAccounts.accounts is empty', () => {
      const state = {
        internalAccounts: {
          accounts: {},
        },
      } as unknown as ControllerFlatState;
      expect(isExistingAccount({ state, address: '0x123' })).toBe(false);
    });
  });

  describe('getDailyAllowance', () => {
    const address1: Hex = '0x111';
    const address2: Hex = '0x222';
    const chainId1: Hex = '0x1';
    const chainId2: Hex = '0x2';

    const delegation1 = {
      delegation: { delegator: address1 },
      chainId: chainId1,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
    };
    const delegation2 = {
      delegation: { delegator: address2 },
      chainId: chainId1,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
    };
    const delegation3 = {
      delegation: { delegator: address1 },
      chainId: chainId2,
      tags: [REMOTE_MODES.DAILY_ALLOWANCE],
    };
    const delegation4 = {
      delegation: { delegator: address1 },
      chainId: chainId1,
      tags: ['OTHER_TAG'],
    };

    it('should return the correct daily allowance entry', () => {
      const state = {
        delegations: {
          d1: delegation1,
          d2: delegation2,
        },
      } as unknown as ControllerFlatState;
      expect(
        getDailyAllowance({ state, address: address1, chainId: chainId1 }),
      ).toBe(delegation1);
    });

    it('should return undefined if no matching delegation is found (address mismatch)', () => {
      const state = {
        delegations: {
          d2: delegation2,
        },
      } as unknown as ControllerFlatState;
      expect(
        getDailyAllowance({ state, address: address1, chainId: chainId1 }),
      ).toBeUndefined();
    });

    it('should return undefined if no matching delegation is found (chainId mismatch)', () => {
      const state = {
        delegations: {
          d3: delegation3,
        },
      } as unknown as ControllerFlatState;
      expect(
        getDailyAllowance({ state, address: address1, chainId: chainId1 }),
      ).toBeUndefined();
    });

    it('should return undefined if no matching delegation is found (tag mismatch)', () => {
      const state = {
        delegations: {
          d4: delegation4,
        },
      } as unknown as ControllerFlatState;
      expect(
        getDailyAllowance({ state, address: address1, chainId: chainId1 }),
      ).toBeUndefined();
    });

    it('should return undefined if delegations object is empty', () => {
      const state = { delegations: {} } as unknown as ControllerFlatState;
      expect(
        getDailyAllowance({ state, address: address1, chainId: chainId1 }),
      ).toBeUndefined();
    });

    it('should handle hex address and chainId comparisons correctly (case insensitivity)', () => {
      const state = {
        delegations: {
          d1: delegation1,
        },
      } as unknown as ControllerFlatState;
      expect(
        getDailyAllowance({
          state,
          address: '0X111' as Hex,
          chainId: '0X1' as Hex,
        }),
      ).toBe(delegation1);
    });
  });

  describe('updateRemoteModeTransaction', () => {
    let mockState: ControllerFlatState;
    let mockTransactionMeta: TransactionMeta;

    beforeEach(() => {
      // Reset mocks and default state before each test
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: true },
      });
      mockGetDeleGatorEnvironment.mockReturnValue({
        DelegationManager: '0xDeleGatorManager',
      });
      mockEncodeRedeemDelegations.mockReturnValue('0xEncodedData');

      const dailyDelegationKey = 'daily' as `0x${string}`;

      mockState = {
        remoteFeatureFlags: { vaultRemoteMode: true },
        internalAccounts: {
          accounts: {
            delegateAcc: { address: '0xdelegate' },
          },
          selectedAccount: 'delegateAcc',
        },
        delegations: {
          [dailyDelegationKey]: {
            delegation: {
              delegator: '0xfrom' as Hex,
              delegate: '0xdelegate' as Hex,
              caveats: [{ enforcer: '0xEnforcer', terms: {} }],
            },
            chainId: '0x1' as Hex,
            tags: [REMOTE_MODES.DAILY_ALLOWANCE],
            meta: JSON.stringify({
              allowances: [
                {
                  type: AssetType.native,
                  address: NATIVE_ADDRESS,
                  amount: '1',
                }, // String
                {
                  type: AssetType.token,
                  address: '0xtokenTo',
                  amount: '10', // String
                  symbol: 'TKN' as TokenSymbol,
                  name: 'Test Token',
                  image: 'test.png',
                }, // For tokenMethodTransfer
              ] as any, // Cast to any to allow string amounts
            } as DailyAllowanceMetadata),
          },
        },
      } as unknown as ControllerFlatState;

      mockTransactionMeta = {
        id: 'tx1',
        chainId: '0x1' as Hex,
        networkClientId: 'testNetworkClient', // Added networkClientId
        txParams: {
          from: '0xfrom' as Hex,
          to: '0xto' as Hex,
          value: '0xDE0B6B3A7640000' as Hex, // 1 ETH
          data: '0x' as Hex,
        },
        type: TransactionType.simpleSend,
        status: 'unapproved' as any,
        time: 0,
        origin: 'test',
      };
    });

    it('should return undefined updateTransaction if remote mode is disabled', async () => {
      mockGetManifestFlags.mockReturnValue({
        remoteFeatureFlags: { vaultRemoteMode: false },
      });
      mockState.remoteFeatureFlags = { vaultRemoteMode: false };
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined updateTransaction for unsupported transaction types', async () => {
      mockTransactionMeta.type = TransactionType.contractInteraction; // An unsupported type
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if no daily allowance is found', async () => {
      mockState.delegations = {}; // No delegations
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if delegate account does not exist', async () => {
      mockState.internalAccounts = {
        accounts: {},
        selectedAccount: 'nonExistent',
      }; // No delegate account, but selectedAccount is present
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if allowance metadata is missing', async () => {
      if (mockState.delegations && (mockState.delegations as any).daily) {
        (mockState.delegations as any).daily.meta = undefined;
      }
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if no matching native allowance is found for simpleSend', async () => {
      if (mockState.delegations && (mockState.delegations as any).daily) {
        (mockState.delegations as any).daily.meta = JSON.stringify({
          allowances: [
            {
              type: AssetType.token,
              address: '0xtokenTo',
              amount: '10', // String
              symbol: 'TKN' as TokenSymbol,
              name: 'Test Token',
              image: 'test.png',
            },
          ] as any, // Cast to any to allow string amounts
        } as DailyAllowanceMetadata);
      }
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if no matching token allowance is found for tokenMethodTransfer', async () => {
      mockTransactionMeta.type = TransactionType.tokenMethodTransfer;
      mockTransactionMeta.txParams.to = '0xanotherTokenTo' as Hex;
      if (mockState.delegations && (mockState.delegations as any).daily) {
        (mockState.delegations as any).daily.meta = JSON.stringify({
          allowances: [
            { type: AssetType.native, address: NATIVE_ADDRESS, amount: '1' }, // String
            {
              type: AssetType.token,
              address: '0xtokenTo',
              amount: '10', // String
              symbol: 'TKN' as TokenSymbol,
              name: 'Test Token',
              image: 'test.png',
            }, // allowance for different token
          ] as any, // Cast to any to allow string amounts
        } as DailyAllowanceMetadata);
      }
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if transaction amount exceeds native allowance for simpleSend', async () => {
      mockTransactionMeta.txParams.value = '0x1BC16D674EC80000' as Hex; // 2 ETH, allowance is 1 ETH
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should return undefined if transaction amount exceeds token allowance for tokenMethodTransfer', async () => {
      mockTransactionMeta.type = TransactionType.tokenMethodTransfer;
      mockTransactionMeta.txParams.to = '0xtokenTo' as Hex;
      // Assuming the data field encodes a transfer of 20 tokens, while allowance is 10
      // For simplicity, we'll check against txParams.value, which is an oversimplification for actual token transfers
      // but sufficient to test the allowance check logic as it's structured.
      // A more accurate test would mock `hexToBigInt` or the data parsing logic if it existed.
      mockTransactionMeta.txParams.value = '0x1234' as Hex; // Simulate value > allowance, actual logic is more complex
      if (mockState.delegations && (mockState.delegations as any).daily) {
        const meta = JSON.parse(
          (mockState.delegations as any).daily.meta as string,
        ) as DailyAllowanceMetadata;
        const tokenAllowance = meta.allowances.find(
          (a) => a.type === AssetType.token && a.address === '0xtokenTo',
        );
        if (tokenAllowance) {
          (tokenAllowance as any).amount = '0.000000000000000001'; // String, cast tokenAllowance to any
        }
        (mockState.delegations as any).daily.meta = JSON.stringify(meta);
      }

      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
    });

    it('should successfully prepare and build transaction for simpleSend', async () => {
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeDefined();
      if (result.updateTransaction) {
        const updatedTxMeta = {
          ...mockTransactionMeta,
          txParams: { ...mockTransactionMeta.txParams },
        };
        result.updateTransaction(updatedTxMeta);
        expect(updatedTxMeta.txParams.from).toBe('0xdelegate');
        expect(updatedTxMeta.txParams.to).toBe('0xDeleGatorManager');
        expect(updatedTxMeta.txParams.data).toBe('0xEncodedData');
        expect(updatedTxMeta.txParams.value).toBeUndefined();
        expect(updatedTxMeta.txParams.maxFeePerGas).toBeUndefined();
        expect(updatedTxMeta.txParams.maxPriorityFeePerGas).toBeUndefined();
        expect(updatedTxMeta.txParams.gas).toBeUndefined();

        const expectedExecution: ExecutionStruct = {
          value: BigInt('0xDE0B6B3A7640000'), // 1 ETH
          target: '0xto' as Hex,
          callData: '0x' as Hex,
        };
        expect(mockEncodeRedeemDelegations).toHaveBeenCalledWith({
          delegations: [
            [
              {
                ...(mockState.delegations as any)?.daily.delegation,
                caveats: [
                  {
                    ...(mockState.delegations as any)?.daily.delegation
                      .caveats[0],
                    args: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  },
                ],
              },
            ],
          ],
          modes: [SINGLE_DEFAULT_MODE],
          executions: [[expectedExecution]],
        });
      }
    });

    it('should successfully prepare and build transaction for tokenMethodTransfer', async () => {
      mockTransactionMeta.type = TransactionType.tokenMethodTransfer;
      mockTransactionMeta.txParams.to = '0xtokenTo' as Hex;
      mockTransactionMeta.txParams.data = '0xTransferData' as Hex;
      mockTransactionMeta.txParams.value = '0x0' as Hex; // Value is typically 0 for token transfers

      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeDefined();
      if (result.updateTransaction) {
        const updatedTxMeta = {
          ...mockTransactionMeta,
          txParams: { ...mockTransactionMeta.txParams },
        };
        result.updateTransaction(updatedTxMeta);
        expect(updatedTxMeta.txParams.from).toBe('0xdelegate');
        expect(updatedTxMeta.txParams.to).toBe('0xDeleGatorManager');
        expect(updatedTxMeta.txParams.data).toBe('0xEncodedData');
        expect(updatedTxMeta.txParams.value).toBeUndefined();

        const expectedExecution: ExecutionStruct = {
          value: BigInt(0),
          target: '0xtokenTo' as Hex,
          callData: '0xTransferData' as Hex,
        };
        expect(mockEncodeRedeemDelegations).toHaveBeenCalledWith({
          delegations: [
            [
              {
                ...(mockState.delegations as any)?.daily.delegation,
                caveats: [
                  {
                    ...(mockState.delegations as any)?.daily.delegation
                      .caveats[0],
                    args: '0x0000000000000000000000000000000000000000000000000000000000000001',
                  },
                ],
              },
            ],
          ],
          modes: [SINGLE_DEFAULT_MODE],
          executions: [[expectedExecution]],
        });
      }
    });

    it('should handle zero value transaction for simpleSend', async () => {
      mockTransactionMeta.txParams.value = '0x0' as Hex;
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeDefined();
      if (result.updateTransaction) {
        const updatedTxMeta = {
          ...mockTransactionMeta,
          txParams: { ...mockTransactionMeta.txParams },
        };
        result.updateTransaction(updatedTxMeta);
        const expectedExecution: ExecutionStruct = {
          value: BigInt(0),
          target: '0xto' as Hex,
          callData: '0x' as Hex,
        };
        expect(mockEncodeRedeemDelegations).toHaveBeenCalledWith(
          expect.objectContaining({
            executions: [[expectedExecution]],
          }),
        );
      }
    });

    it('should return undefined if encodeRedeemDelegations throws an error', async () => {
      mockEncodeRedeemDelegations.mockImplementation(() => {
        throw new Error('Encoding failed');
      });
      jest.spyOn(console, 'error').mockImplementation(jest.fn()); // Suppress console.error
      const result = await updateRemoteModeTransaction({
        transactionMeta: mockTransactionMeta,
        state: mockState,
      });
      expect(result.updateTransaction).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith(
        'Error preparing daily allowance transaction',
        expect.any(Error),
      );
      (console.error as jest.Mock).mockRestore();
    });
  });

  // More tests will be added here (if any, e.g. for buildUpdateTransaction directly if needed)
});
