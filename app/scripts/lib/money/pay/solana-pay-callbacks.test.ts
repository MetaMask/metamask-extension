import { Buffer } from 'buffer';
import { FeeType, TransactionStatus } from '@metamask/keyring-api';
import type {
  GetSolanaPayPreflightRequest,
  SolanaPaySignAndSendTransactionRequest,
  SolanaPaySubmissionResult,
} from '@metamask/transaction-pay-controller';
import {
  Connection,
  Keypair,
  SystemProgram,
  type TransactionInstruction,
} from '@solana/web3.js';
import type {
  CaipAccountId,
  CaipAssetType,
  CaipChainId,
} from '@metamask/utils';
import { sha256 } from '../../../../../shared/lib/hash.utils';
import type { TransactionPayControllerInitMessenger } from '../../../messenger-client-init/messengers';
import { createSolanaPayCallbacks } from './solana-pay-callbacks';

jest.mock('../../../../../shared/lib/hash.utils', () => ({
  sha256: jest.fn((value: string) => Promise.resolve(value)),
}));

const ACCOUNT_ID = 'account-id';
const ADDRESS = Keypair.generate().publicKey.toBase58();
const SCOPE = 'solana:mainnet' as CaipChainId;
const CAIP_ACCOUNT_ID = `${SCOPE}:${ADDRESS}` as CaipAccountId;
const ASSET_ID = `${SCOPE}/slip44:501` as CaipAssetType;

function getAccountsState() {
  return {
    internalAccounts: {
      accounts: {
        [ACCOUNT_ID]: {
          id: ACCOUNT_ID,
          address: ADDRESS,
          scopes: [SCOPE],
        },
      },
    },
  };
}

function getMessenger(call: jest.Mock): TransactionPayControllerInitMessenger {
  return { call } as unknown as TransactionPayControllerInitMessenger;
}

function getConnection(overrides: Record<string, unknown> = {}): Connection {
  return {
    getAccountInfo: jest.fn().mockResolvedValue({ data: Buffer.alloc(0) }),
    getAddressLookupTable: jest.fn(),
    getBalance: jest.fn().mockResolvedValue(2_000_000_000),
    getLatestBlockhash: jest.fn().mockResolvedValue({
      blockhash: Keypair.generate().publicKey.toBase58(),
      lastValidBlockHeight: 1,
    }),
    getMinimumBalanceForRentExemption: jest.fn().mockResolvedValue(890_880),
    getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue({ value: [] }),
    ...overrides,
  } as unknown as Connection;
}

function toRelayInstruction(instruction: TransactionInstruction) {
  return {
    programId: instruction.programId.toBase58(),
    keys: instruction.keys.map(({ pubkey, isSigner, isWritable }) => ({
      pubkey: pubkey.toBase58(),
      isSigner,
      isWritable,
    })),
    data: Buffer.from(instruction.data).toString('hex'),
  };
}

describe('createSolanaPayCallbacks', () => {
  it('compiles Relay instructions and returns authoritative fee and balance observations', async () => {
    const instruction = SystemProgram.transfer({
      fromPubkey: Keypair.generate().publicKey,
      toPubkey: Keypair.generate().publicKey,
      lamports: 1,
    });
    const call = jest.fn((action: string) => {
      if (action === 'AccountsController:getState') {
        return getAccountsState();
      }
      if (action === 'SnapController:handleRequest') {
        return [
          { type: FeeType.Base, asset: { amount: '0.000005' } },
          { type: FeeType.Priority, asset: { amount: '0.000001' } },
        ];
      }
      throw new Error(`Unexpected action: ${action}`);
    });
    const callbacks = createSolanaPayCallbacks(
      getMessenger(call),
      'project-id',
      getConnection(),
    );

    const result = await callbacks.getPreflight({
      accountId: CAIP_ACCOUNT_ID,
      requestId: 'request-id',
      scope: SCOPE,
      sourceAmountRaw: '1000000000',
      sourceAssetId: ASSET_ID,
      transaction: {
        chainId: 792703809,
        instructions: [toRelayInstruction(instruction)],
      },
    } as GetSolanaPayPreflightRequest);

    expect(result).toEqual(
      expect.objectContaining({
        nativeBalanceRaw: '2000000000',
        networkFeeRaw: '5000',
        priorityFeeRaw: '1000',
        rentDebitRaw: '0',
        rentExemptionRequirementRaw: '890880',
        sourceBalanceRaw: '2000000000',
      }),
    );
    expect(result.preparedTransaction).not.toHaveLength(0);
    expect(result.preparationId).not.toHaveLength(0);
  });

  const failureCases: {
    name: string;
    error: unknown;
    expected: SolanaPaySubmissionResult;
  }[] = [
    {
      name: 'user rejection',
      error: { code: 4001 },
      expected: { outcome: 'user-rejected' },
    },
    {
      name: 'invalid request',
      error: { code: -32602 },
      expected: { outcome: 'not-submitted', reason: 'snap-rpc--32602' },
    },
    {
      name: 'unknown completion',
      error: new Error('request completion unknown'),
      expected: { outcome: 'ambiguous', reason: 'snap-completion-unknown' },
    },
  ];

  failureCases.forEach(({ name, error, expected }) => {
    it(`classifies ${name} without retrying`, async () => {
      const call = jest.fn((action: string) => {
        if (action === 'AccountsController:getState') {
          return getAccountsState();
        }
        if (action === 'SnapController:handleRequest') {
          throw error;
        }
        throw new Error(`Unexpected action: ${action}`);
      });
      const callbacks = createSolanaPayCallbacks(
        getMessenger(call),
        'project-id',
        getConnection(),
      );
      const request = {
        accountId: CAIP_ACCOUNT_ID,
        preparedTransaction: 'transaction',
        preparationId: await sha256(
          `${CAIP_ACCOUNT_ID}:${SCOPE}:request-id:transaction`,
        ),
        requestId: 'request-id',
        scope: SCOPE,
      } as SolanaPaySignAndSendTransactionRequest;

      await expect(callbacks.signAndSendTransaction(request)).resolves.toEqual(
        expected,
      );
      expect(call).toHaveBeenCalledTimes(2);
    });
  });

  it('refreshes the source account and maps a confirmed Snap transaction', async () => {
    const call = jest.fn((action: string) => {
      if (action === 'AccountsController:getState') {
        return getAccountsState();
      }
      if (
        action ===
        'MultichainTransactionsController:updateTransactionsForAccount'
      ) {
        return Promise.resolve();
      }
      if (action === 'MultichainTransactionsController:getState') {
        return {
          nonEvmTransactions: {
            [ACCOUNT_ID]: {
              [SCOPE]: {
                transactions: [
                  { id: 'signature', status: TransactionStatus.Confirmed },
                ],
              },
            },
          },
        };
      }
      throw new Error(`Unexpected action: ${action}`);
    });
    const callbacks = createSolanaPayCallbacks(
      getMessenger(call),
      'project-id',
      getConnection(),
    );

    await expect(
      callbacks.getTransactionStatus({
        accountId: CAIP_ACCOUNT_ID,
        scope: SCOPE,
        transactionId: 'signature',
      }),
    ).resolves.toBe('confirmed');
    expect(call).toHaveBeenCalledWith(
      'MultichainTransactionsController:updateTransactionsForAccount',
      ACCOUNT_ID,
    );
  });
});
