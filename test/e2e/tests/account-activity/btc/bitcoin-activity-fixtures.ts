import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { StatusTypes } from '@metamask/bridge-controller';
import { DEFAULT_BTC_ADDRESS } from '../../../constants';
import { getCleanAppState } from '../../../helpers';
import type { Driver } from '../../../webdriver/driver';
import {
  BTC_CHAIN_ID,
  BTC_CHAIN_ID_NUMERIC,
  BTC_NATIVE_ASSET,
  ETH_NATIVE_ASSET,
} from '../../btc/mocks/bridge';

const BTC_ASSET_TYPE = `${BTC_CHAIN_ID}/slip44:0`;

type BitcoinAccountIdentity = {
  accountId: string;
  snapId: string;
};

export type BitcoinActivityTransaction = {
  type: 'send';
  id: string;
  account: string;
  chain: typeof BTC_CHAIN_ID;
  status: 'confirmed' | 'failed' | 'unconfirmed';
  timestamp: number;
  events: {
    status: 'confirmed' | 'failed' | 'unconfirmed';
    timestamp: number;
  }[];
  to: {
    address: string;
    asset: {
      amount: string;
      fungible: true;
      unit: 'BTC';
      type: typeof BTC_ASSET_TYPE;
    };
  }[];
  from: [];
  fees: [];
};

export function bitcoinSendActivityTransaction({
  id,
  account,
  amount,
  recipient,
  status,
  timestamp = Date.now(),
}: {
  id: string;
  account: string;
  amount: string;
  recipient: string;
  status: BitcoinActivityTransaction['status'];
  timestamp?: number;
}): BitcoinActivityTransaction {
  return {
    type: 'send',
    id,
    account,
    chain: BTC_CHAIN_ID,
    status,
    timestamp,
    events: [{ status, timestamp }],
    to: [
      {
        address: recipient,
        asset: {
          amount,
          fungible: true,
          unit: 'BTC',
          type: BTC_ASSET_TYPE,
        },
      },
    ],
    from: [],
    fees: [],
  };
}

export function bitcoinBridgeHistoryItem({
  account,
  transactionId,
  srcAmount,
  destAmount,
  timestamp = Date.now(),
}: {
  account: string;
  transactionId: string;
  srcAmount: string;
  destAmount: string;
  timestamp?: number;
}): BridgeHistoryItem {
  const srcAsset = BTC_NATIVE_ASSET as BridgeHistoryItem['quote']['srcAsset'];
  const destAsset = ETH_NATIVE_ASSET as BridgeHistoryItem['quote']['destAsset'];

  return {
    account,
    hasApprovalTx: false,
    quote: {
      srcChainId: BTC_CHAIN_ID_NUMERIC,
      destChainId: 1,
      srcTokenAmount: srcAmount,
      destTokenAmount: destAmount,
      srcAsset,
      destAsset,
      requestId: transactionId,
      feeData: {
        metabridge: {
          amount: '0',
          asset: srcAsset,
        },
      },
      steps: [],
      bridgeId: 'rango',
      bridges: ['rango'],
    },
    status: {
      status: StatusTypes.COMPLETE,
      srcChain: {
        chainId: BTC_CHAIN_ID_NUMERIC,
        txHash: transactionId,
        amount: srcAmount,
        token: srcAsset,
      },
      destChain: {
        chainId: 1,
        txHash: `0x${'ab'.repeat(32)}`,
        amount: destAmount,
        token: destAsset,
      },
    },
    startTime: timestamp,
    estimatedProcessingTimeInSeconds: 60,
    slippagePercentage: 0.5,
  };
}

/**
 * Publishes synthetic Bitcoin transactions through the account update event
 * used by the Bitcoin Snap.
 *
 * The Bitcoin account ID is generated at runtime, so activity cannot be keyed
 * correctly in the initial fixture. This helper waits for the Snap account,
 * then publishes an update for that account through the background messenger.
 *
 * @param driver - The WebDriver instance.
 * @param transactions - The transactions to publish.
 * @returns The runtime Bitcoin account ID.
 */
export async function seedBitcoinActivityTransactions(
  driver: Driver,
  transactions: BitcoinActivityTransaction[],
): Promise<string> {
  await driver.wait(async () => {
    const accountIdentity = await driver.executeScript(
      findBitcoinAccountIdentityInAppState,
      DEFAULT_BTC_ADDRESS,
      BTC_CHAIN_ID,
    );
    return accountIdentity !== undefined;
  });

  const { accountId, snapId } = (await driver.executeScript(
    findBitcoinAccountIdentityInAppState,
    DEFAULT_BTC_ADDRESS,
    BTC_CHAIN_ID,
  )) as BitcoinAccountIdentity;

  const result = (await driver.executeAsyncScript(
    publishBitcoinTransactions,
    snapId,
    accountId,
    JSON.stringify(
      transactions.map((transaction) => ({
        ...transaction,
        account: accountId,
      })),
    ),
  )) as { error?: string } | undefined;

  if (result?.error) {
    throw new Error(`Failed to seed Bitcoin activity: ${result.error}`);
  }

  await driver.wait(async () => {
    const appState = await getCleanAppState(driver);
    const seededTransactions =
      appState.metamask.nonEvmTransactions?.[accountId]?.[BTC_CHAIN_ID]
        ?.transactions;

    return transactions.every((transaction) =>
      seededTransactions?.some(
        (seededTransaction: BitcoinActivityTransaction) =>
          seededTransaction.id === transaction.id &&
          seededTransaction.status === transaction.status,
      ),
    );
  });

  return accountId;
}

async function findBitcoinAccountIdentityInAppState(
  args: [string, string],
): Promise<BitcoinAccountIdentity | undefined> {
  const [bitcoinAddress, bitcoinChainId] = args;
  const getCleanAppStateHook = window.stateHooks.getCleanAppState;
  if (!getCleanAppStateHook) {
    return undefined;
  }

  const appState = await getCleanAppStateHook();
  const accounts = Object.values(
    appState.metamask.internalAccounts.accounts,
  ) as {
    id: string;
    address: string;
    scopes: string[];
    metadata: {
      snap?: {
        id?: string;
      };
    };
  }[];
  const bitcoinAccount = accounts.find(
    (account) =>
      account.address === bitcoinAddress &&
      account.scopes.includes(bitcoinChainId),
  );
  const snapId = bitcoinAccount?.metadata.snap?.id;

  return bitcoinAccount && snapId
    ? { accountId: bitcoinAccount.id, snapId }
    : undefined;
}

function publishBitcoinTransactions(
  args: [string, string, string],
  callback: (result?: { error: string }) => void,
) {
  const [snapId, accountId, serializedTransactions] = args;
  const transactions = JSON.parse(
    serializedTransactions,
  ) as BitcoinActivityTransaction[];
  const browser = globalThis.browser ?? globalThis.chrome;
  // Firefox only routes `popup`, `notification`, and `fullscreen` ports to
  // trusted communication, so a test-specific port name never reaches the
  // controller stream.
  const port = browser.runtime.connect({
    name: 'fullscreen',
  });
  const requestId = `bitcoin-activity-${Date.now()}`;

  // This port is deliberately never disconnected: the background tracks open
  // fullscreen tabs by tab ID rather than by port, so disconnecting would
  // unregister the tab and stop controller polling while the real UI port is
  // still connected. The port closes with the test tab instead.
  //
  // The listener must also stay anonymous, since this function is stringified
  // and evaluated in the page, where the `__name` helper that tsx/esbuild
  // injects around named functions does not exist.
  let hasResponded = false;

  port.onMessage.addListener((rawMessage: unknown) => {
    if (hasResponded) {
      return;
    }

    const message = rawMessage as {
      name?: string;
      data?: {
        id?: string;
        error?: {
          message?: string;
          data?: {
            cause?: {
              message?: string;
            };
          };
        };
      };
    };

    if (message?.name !== 'controller' || message.data?.id !== requestId) {
      return;
    }

    hasResponded = true;
    const error = message.data?.error;
    if (error) {
      callback({
        error:
          error.message ?? error.data?.cause?.message ?? JSON.stringify(error),
      });
      return;
    }

    callback();
  });

  port.postMessage({
    name: 'controller',
    data: {
      jsonrpc: '2.0',
      id: requestId,
      method: 'messengerCall',
      params: [
        'SnapAccountService:handleKeyringSnapMessage',
        [
          snapId,
          {
            method: 'notify:accountTransactionsUpdated',
            params: {
              transactions: {
                [accountId]: transactions,
              },
            },
          },
        ],
      ],
    },
  });
}
