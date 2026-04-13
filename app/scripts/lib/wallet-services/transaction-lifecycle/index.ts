/**
 * transaction-lifecycle
 *
 * Lifecycle hooks around TransactionController: cancel/speed-up, STX routing,
 * NFT ownership updates, gas estimation, and transaction metrics.
 * All controller access via messenger — no chrome.* / browser.* imports.
 */

import type { RootMessenger } from '../../messenger';

export type TransactionLifecycleDependencies = {
  messenger: RootMessenger;
};

/**
 * Updates NFT ownership records after a batch of confirmed transactions.
 * Queries NftController for tokens held at the sender address and checks
 * whether any transferred to a different owner.
 *
 * Extracted from MetamaskController.updateNftOwnershipOnPostTransactionBatch.
 *
 * TODO: Requires messenger actions:
 *   - NftController:checkAndUpdateAllNftsOwnershipStatus
 *   - AccountsController:getSelectedAccount
 */
export async function updateNftOwnershipOnPostTransactionBatch(
  deps: TransactionLifecycleDependencies,
  txMetas: { txParams: { from: string } }[],
): Promise<void> {
  const senders = [...new Set(txMetas.map((tx) => tx.txParams.from))];
  for (const address of senders) {
    await deps.messenger.call(
      'NftController:checkAndUpdateAllNftsOwnershipStatus',
      address,
    );
  }
}

/**
 * Routes a transaction through the Smart Transactions Controller if STX
 * is enabled for the origin, otherwise falls through to normal submission.
 *
 * Extracted from MetamaskController smart transaction routing logic.
 *
 * TODO: Requires messenger actions:
 *   - SmartTransactionsController:submitSignedTransactions
 *   - TransactionController:approveTransaction
 */
export async function routeTransactionToSmartTransactionIfEnabled(
  deps: TransactionLifecycleDependencies,
  txId: string,
  opts: { useSmartTransaction: boolean },
): Promise<void> {
  if (opts.useSmartTransaction) {
    await deps.messenger.call(
      'SmartTransactionsController:submitSignedTransactions',
      txId,
    );
  } else {
    await deps.messenger.call('TransactionController:approveTransaction', txId);
  }
}

/**
 * Creates a cancel transaction — submits a replacement with the same nonce
 * at a higher gas price to replace the original.
 *
 * Returns the state snapshot so the UI can update immediately.
 *
 * Extracted from MetamaskController.createCancelTransaction.
 *
 * TODO: Requires messenger action: TransactionController:stopTransaction
 */
export async function createCancelTransaction(
  deps: TransactionLifecycleDependencies,
  originalTxId: string,
  customGasSettings: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:stopTransaction',
    originalTxId,
    customGasSettings,
    options,
  );
}

/**
 * Creates a speed-up transaction — submits a replacement with the same nonce
 * at a higher gas price to accelerate the original.
 *
 * Extracted from MetamaskController.createSpeedUpTransaction.
 *
 * TODO: Requires messenger action: TransactionController:speedUpTransaction
 */
export async function createSpeedUpTransaction(
  deps: TransactionLifecycleDependencies,
  originalTxId: string,
  customGasSettings: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:speedUpTransaction',
    originalTxId,
    customGasSettings,
    options,
  );
}

/**
 * Approves all pending transactions that share the same nonce as the given
 * transaction. Used to handle nonce conflicts during batch submission.
 *
 * Extracted from MetamaskController getApi() approveTransactionsWithSameNonce.
 *
 * TODO: Requires messenger action: TransactionController:approveTransactionsWithSameNonce
 */
export async function approveTransactionsWithSameNonce(
  deps: TransactionLifecycleDependencies,
  txIds: string[],
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:approveTransactionsWithSameNonce',
    txIds,
  );
}

/**
 * Estimates gas for a transaction using the current network provider.
 *
 * Extracted from MetamaskController.estimateGas.
 *
 * TODO: Requires a NetworkController provider access action or
 *   TransactionController:estimateGas to be exposed as a messenger action.
 */
export async function estimateGas(
  deps: TransactionLifecycleDependencies,
  params: unknown,
): Promise<string> {
  return (deps.messenger as never).call(
    'NetworkController:estimateGas',
    params,
  );
}

/**
 * Returns pending smart transactions for a given address.
 * Used to show external (STX) pending transactions in the UI.
 *
 * Extracted from MetamaskController.getExternalPendingTransactions.
 *
 * TODO: Requires messenger action: SmartTransactionsController:getTransactions
 */
export function getExternalPendingTransactions(
  deps: TransactionLifecycleDependencies,
  address: string,
): unknown[] {
  return (deps.messenger as never).call(
    'SmartTransactionsController:getTransactions',
    {
      addressFrom: address,
      status: 'pending',
    },
  );
}

/**
 * Editable transaction params update — updates gas, recipient, data, or value
 * on a pending transaction before approval.
 *
 * Extracted from MetamaskController getApi() applyTransactionContainersExisting
 * (delegated to txController.updateEditableParams).
 *
 * TODO: Requires messenger action: TransactionController:updateEditableParams
 */
export async function updateEditableParams(
  deps: TransactionLifecycleDependencies,
  txId: string,
  params: Record<string, unknown>,
): Promise<void> {
  await (deps.messenger as never).call(
    'TransactionController:updateEditableParams',
    txId,
    params,
  );
}

/**
 * Returns contract bytecode at the given address on the specified network
 * client.
 *
 * Extracted from MetamaskController.getCode (L8104).
 *
 * TODO: Requires messenger action:
 *   - NetworkController:getNetworkClientById (does not exist yet as action)
 */
export async function getCode(
  deps: TransactionLifecycleDependencies,
  address: string,
  networkClientId: string,
): Promise<string> {
  const { provider } = (deps.messenger as never).call(
    'NetworkController:getNetworkClientById',
    networkClientId,
  ) as {
    provider: {
      request: (req: { method: string; params: unknown[] }) => Promise<string>;
    };
  };

  return provider.request({
    method: 'eth_getCode',
    params: [address],
  });
}

/**
 * Dispatches post-transaction side effects after a transaction is confirmed or
 * failed: shows a notification, updates NFT ownership, tracks failures, and
 * refreshes token balances.
 *
 * @deprecated Controllers should subscribe to messenger events internally
 * rather than relying on the client.  Kept here for decomposition traceability.
 *
 * Extracted from MetamaskController._onFinishedTransaction (L8224).
 *
 * TODO: Requires messenger actions:
 *   - Platform:showTransactionNotification
 *   - NftController:checkAndUpdateSingleNftOwnershipStatus
 *   - NftController:addNft
 *   - MetaMetricsController:trackEvent
 *   - TokenBalancesController:updateBalances
 *   - NetworkController:state (state accessor)
 *   - AccountsController:getSelectedAccount (already in RootMessenger)
 *   - TokensController:state (state accessor)
 *   - AccountTrackerController:state (state accessor)
 */
export async function onFinishedTransaction(
  deps: TransactionLifecycleDependencies,
  transactionMeta: {
    status: string;
    chainId: string;
    type?: string;
    txParams?: Record<string, unknown>;
    txReceipt?: {
      status?: string;
      logs?: {
        topics: string[];
        data: string;
        address: string;
      }[];
    };
    simulationFails?: { reason?: string };
  },
  opts: {
    confirmedStatus: string;
    failedStatus: string;
    createNotification: (txMeta: typeof transactionMeta) => Promise<void>;
    updateNftOwnership: (txMeta: typeof transactionMeta) => Promise<void>;
    trackFailure: (txMeta: typeof transactionMeta) => void;
    updateTokenBalances: (chainIds: string[]) => Promise<void>;
  },
): Promise<void> {
  if (
    ![opts.confirmedStatus, opts.failedStatus].includes(transactionMeta.status)
  ) {
    return;
  }

  await opts.createNotification(transactionMeta);
  await opts.updateNftOwnership(transactionMeta);
  opts.trackFailure(transactionMeta);
  await opts.updateTokenBalances([transactionMeta.chainId]);
}

/**
 * Shows a platform notification for a completed transaction, including a
 * block-explorer URL when available.
 *
 * Extracted from MetamaskController._createTransactionNotifcation (L8260).
 * (Original typo "Notifcation" preserved for traceability.)
 *
 * TODO: Requires messenger actions:
 *   - Platform:showTransactionNotification (does not exist yet)
 *   - NetworkController:state (state accessor)
 */
export async function createTransactionNotification(
  deps: TransactionLifecycleDependencies,
  transactionMeta: { chainId?: string; [key: string]: unknown },
  opts: {
    getNetworkConfigurationsByChainId: () => Record<
      string,
      {
        blockExplorerUrls?: string[];
        defaultBlockExplorerUrlIndex?: number;
      }
    >;
  },
): Promise<void> {
  const { chainId } = transactionMeta;
  let rpcPrefs: { blockExplorerUrl?: string } = {};

  if (chainId) {
    const networkConfiguration =
      opts.getNetworkConfigurationsByChainId()[chainId];
    const blockExplorerUrl =
      networkConfiguration?.blockExplorerUrls?.[
        networkConfiguration?.defaultBlockExplorerUrlIndex ?? 0
      ];
    rpcPrefs = { blockExplorerUrl };
  }

  try {
    await (deps.messenger as never).call(
      'Platform:showTransactionNotification',
      transactionMeta,
      rpcPrefs,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create transaction notification', error);
  }
}

/**
 * Checks and updates NFT ownership after a transferFrom or contract
 * interaction transaction.  Handles both ERC-721 and ERC-1155 transfers,
 * adding new NFTs and refreshing ownership of known ones.
 *
 * Extracted from MetamaskController._updateNFTOwnership (L8286).
 *
 * TODO: Requires messenger actions:
 *   - AccountsController:getSelectedAccount (already in RootMessenger)
 *   - NftController:state (state accessor)
 *   - NftController:checkAndUpdateSingleNftOwnershipStatus (does not exist yet)
 *   - NftController:addNft (does not exist yet)
 *   - NetworkController:state (state accessor)
 */
export async function updateNFTOwnership(
  deps: TransactionLifecycleDependencies,
  transactionMeta: {
    type?: string;
    chainId: string;
    txParams?: { data?: string; to?: string; from?: string };
    txReceipt?: {
      logs?: { topics: string[]; data: string; address: string }[];
    };
  },
  opts: {
    tokenMethodTransferFrom: string;
    tokenMethodSafeTransferFrom: string;
    contractInteraction: string;
    transferSingleLogTopicHash: string;
    tokenTransferLogTopicHash: string;
    getNftState: () => {
      allNfts: Record<
        string,
        Record<string, { address: string; tokenId: string }[]>
      >;
    };
    getNetworkClientIdForChain: (chainId: string) => string | undefined;
    parseStandardTokenTransactionData: (data: string) => unknown;
    getTokenIdParam: (parsed: unknown) => string | undefined;
    getTokenValueParam: (parsed: unknown) => string | undefined;
    isEqualCaseInsensitive: (a: string, b: string) => boolean;
    abiERC721: unknown;
    abiERC1155: unknown;
    Interface: new (abi: unknown) => {
      parseLog: (log: { data: string; topics: string[] }) => {
        args: Record<string, unknown>;
        name: string;
      };
    };
  },
): Promise<void> {
  const { type, txParams, chainId, txReceipt } = transactionMeta;
  const selectedAddress = (
    deps.messenger.call('AccountsController:getSelectedAccount') as {
      address: string;
    }
  ).address;

  const { allNfts } = opts.getNftState();
  const txReceiptLogs = txReceipt?.logs;

  const isContractInteractionTx =
    type === opts.contractInteraction && txReceiptLogs;
  const isTransferFromTx =
    (type === opts.tokenMethodTransferFrom ||
      type === opts.tokenMethodSafeTransferFrom) &&
    txParams !== undefined;

  if (!isContractInteractionTx && !isTransferFromTx) {
    return;
  }

  const networkClientId = opts.getNetworkClientIdForChain(chainId);

  if (isTransferFromTx && txParams) {
    const {
      data,
      to: contractAddress,
      from: userAddress,
    } = txParams as {
      data?: string;
      to?: string;
      from?: string;
    };
    if (!data || !contractAddress || !userAddress) {
      return;
    }
    const transactionData = opts.parseStandardTokenTransactionData(data);
    const transactionDataTokenId =
      opts.getTokenIdParam(transactionData) ??
      opts.getTokenValueParam(transactionData);

    const knownNft = allNfts?.[userAddress]?.[chainId]?.find(
      ({ address, tokenId }) =>
        opts.isEqualCaseInsensitive(address, contractAddress) &&
        tokenId === transactionDataTokenId,
    );

    if (knownNft) {
      (deps.messenger as never).call(
        'NftController:checkAndUpdateSingleNftOwnershipStatus',
        knownNft,
        false,
        networkClientId,
        { userAddress },
      );
    }
    return;
  }

  // Contract interaction — parse logs
  if (!txReceiptLogs) {
    return;
  }

  const allNftTransferLog = txReceiptLogs.map((txReceiptLog) => {
    const isERC1155NftTransfer =
      txReceiptLog.topics &&
      txReceiptLog.topics[0] === opts.transferSingleLogTopicHash;
    const isERC721NftTransfer =
      txReceiptLog.topics &&
      txReceiptLog.topics[0] === opts.tokenTransferLogTopicHash;

    let isTransferToSelectedAddress: RegExpMatchArray | null | undefined;
    if (isERC1155NftTransfer) {
      isTransferToSelectedAddress = txReceiptLog.topics[3]?.match(
        selectedAddress?.slice(2),
      );
    }
    if (isERC721NftTransfer) {
      isTransferToSelectedAddress = txReceiptLog.topics[2]?.match(
        selectedAddress?.slice(2),
      );
    }

    return {
      isERC1155NftTransfer,
      isERC721NftTransfer,
      isTransferToSelectedAddress,
      ...txReceiptLog,
    };
  });

  if (allNftTransferLog.length === 0) {
    return;
  }

  const allNftParsedLog: {
    contract: string;
    args: Record<string, unknown>;
    name: string;
  }[] = [];
  allNftTransferLog.forEach((singleLog) => {
    if (
      singleLog.isTransferToSelectedAddress &&
      (singleLog.isERC1155NftTransfer || singleLog.isERC721NftTransfer)
    ) {
      const iface = singleLog.isERC1155NftTransfer
        ? new opts.Interface(opts.abiERC1155)
        : new opts.Interface(opts.abiERC721);
      try {
        const parsedLog = iface.parseLog({
          data: singleLog.data,
          topics: singleLog.topics,
        });
        allNftParsedLog.push({ contract: singleLog.address, ...parsedLog });
      } catch {
        // ignore parse errors
      }
    }
  });

  const knownNFTs: { address: string; tokenId: string }[] = [];
  const newNFTs: {
    tokenId: string | undefined;
    contract: string;
    args: Record<string, unknown>;
  }[] = [];

  allNftParsedLog.forEach((single) => {
    const tokenIdFromLog = opts.getTokenIdParam(single);
    const existingNft = allNfts?.[selectedAddress]?.[chainId]?.find(
      ({ address, tokenId }) =>
        opts.isEqualCaseInsensitive(address, single.contract) &&
        tokenId === tokenIdFromLog,
    );
    if (existingNft) {
      knownNFTs.push(existingNft);
    } else {
      newNFTs.push({
        tokenId: tokenIdFromLog,
        contract: single.contract,
        args: single.args,
      });
    }
  });

  const refreshOwnershipPromises = knownNFTs.map(async (singleNft) =>
    (deps.messenger as never).call(
      'NftController:checkAndUpdateSingleNftOwnershipStatus',
      singleNft,
      false,
      networkClientId,
      { selectedAddress },
    ),
  );
  await Promise.allSettled(refreshOwnershipPromises);

  const addNftPromises = newNFTs.map(async (singleNft) =>
    (deps.messenger as never).call(
      'NftController:addNft',
      singleNft.contract,
      singleNft.tokenId,
      networkClientId,
    ),
  );
  await Promise.allSettled(addNftPromises);
}

/**
 * Sends a MetaMetrics event when a transaction fails on-chain (status 0x0).
 *
 * Extracted from MetamaskController._trackTransactionFailure (L8451).
 *
 * TODO: Requires messenger actions:
 *   - TokensController:state (state accessor)
 *   - AccountsController:getSelectedAccount (already in RootMessenger)
 *   - AccountTrackerController:state (state accessor)
 *   - MetaMetricsController:trackEvent (does not exist yet)
 */
export function trackTransactionFailure(
  deps: TransactionLifecycleDependencies,
  transactionMeta: {
    chainId: string;
    txReceipt?: { status?: string };
    simulationFails?: { reason?: string };
  },
  opts: {
    metaMetricsEventCategoryBackground: string;
    getTokensState: () => {
      allTokens: Record<string, Record<string, unknown[]>>;
    };
    getAccountTrackerState: () => { accounts: Record<string, unknown> };
  },
): void {
  const { txReceipt } = transactionMeta;

  if (!txReceipt || txReceipt.status !== '0x0') {
    return;
  }

  const { allTokens } = opts.getTokensState();
  const selectedAccount = deps.messenger.call(
    'AccountsController:getSelectedAccount',
  ) as { address: string };
  const tokens =
    allTokens?.[transactionMeta.chainId]?.[selectedAccount.address] ?? [];

  const { accounts } = opts.getAccountTrackerState();

  (deps.messenger as never).call('MetaMetricsController:trackEvent', {
    event: 'Tx Status Update: On-Chain Failure',
    category: opts.metaMetricsEventCategoryBackground,
    properties: {
      action: 'Transactions',
      errorMessage: transactionMeta.simulationFails?.reason,
      numberOfTokens: tokens.length,
      numberOfAccounts: Object.keys(accounts).length,
    },
    matomoEvent: true,
  });
}

/**
 * Upgrades an account to support EIP-7702 delegation by submitting an
 * authorization transaction via TransactionController.
 *
 * Extracted from MetamaskController.upgradeAccount (L8681).
 *
 * TODO: Requires messenger actions:
 *   - NetworkController:findNetworkClientIdByChainId (does not exist yet)
 *   - TransactionController:addTransaction (does not exist yet as action)
 */
export async function upgradeAccount(
  deps: TransactionLifecycleDependencies,
  address: string,
  upgradeContractAddress: string,
  chainId: number,
  opts: {
    toHex: (n: number) => string;
    findNetworkClientIdByChainId: (chainId: string) => string;
    createEIP7702UpgradeTransaction: (
      params: {
        address: string;
        upgradeContractAddress: string;
        networkClientId: string;
      },
      addTx: (transactionParams: unknown, options: unknown) => Promise<unknown>,
    ) => Promise<{ transactionHash: string; delegatedTo: string }>;
    getAddTransactionRequest: (params: {
      transactionParams: unknown;
      transactionOptions: Record<string, unknown>;
      waitForSubmit: boolean;
    }) => unknown;
  },
): Promise<{ transactionHash: string; delegatedTo: string }> {
  const networkClientId = opts.findNetworkClientIdByChainId(
    opts.toHex(chainId),
  );

  return opts.createEIP7702UpgradeTransaction(
    { address, upgradeContractAddress, networkClientId },
    async (transactionParams, options) => {
      const transactionMeta = await (deps.messenger as never).call(
        'TransactionController:addTransaction',
        opts.getAddTransactionRequest({
          transactionParams,
          transactionOptions: {
            ...(options as Record<string, unknown>),
            origin: 'metamask',
            requireApproval: true,
          },
          waitForSubmit: true,
        }),
      );
      return transactionMeta;
    },
  );
}

/**
 * Checks whether EIP-7702 account upgrade is supported for a given address
 * and chain ID.
 *
 * Extracted from MetamaskController.isEip7702Supported (L8718).
 *
 * TODO: Requires messenger action:
 *   - TransactionController:isAtomicBatchSupported (does not exist yet)
 */
export async function isEip7702Supported(
  deps: TransactionLifecycleDependencies,
  request: { address: string; chainId: string },
  opts: {
    findAtomicBatchSupportForChain: (
      support: unknown,
      chainId: string,
    ) => unknown;
    checkEip7702Support: (chainSupport: unknown) => {
      isSupported: boolean;
      upgradeContractAddress: string | null;
    };
  },
): Promise<{ isSupported: boolean; upgradeContractAddress: string | null }> {
  const { address, chainId } = request;

  const atomicBatchSupport = await (deps.messenger as never).call(
    'TransactionController:isAtomicBatchSupported',
    { address, chainIds: [chainId] },
  );

  const atomicBatchChainSupport = opts.findAtomicBatchSupportForChain(
    atomicBatchSupport,
    chainId,
  );

  return opts.checkEip7702Support(atomicBatchChainSupport);
}

// ---------------------------------------------------------------------------
// Action registration
// ---------------------------------------------------------------------------

/** Typed action name constants for transaction-lifecycle messenger actions. */
export const TRANSACTION_LIFECYCLE_ACTIONS = {
  updateNftOwnershipOnPostTransactionBatch:
    'TransactionLifecycle:updateNftOwnershipOnPostTransactionBatch',
  routeTransactionToSmartTransactionIfEnabled:
    'TransactionLifecycle:routeTransactionToSmartTransactionIfEnabled',
  createCancelTransaction: 'TransactionLifecycle:createCancelTransaction',
  createSpeedUpTransaction: 'TransactionLifecycle:createSpeedUpTransaction',
  approveTransactionsWithSameNonce:
    'TransactionLifecycle:approveTransactionsWithSameNonce',
  estimateGas: 'TransactionLifecycle:estimateGas',
  getExternalPendingTransactions:
    'TransactionLifecycle:getExternalPendingTransactions',
  updateEditableParams: 'TransactionLifecycle:updateEditableParams',
  getCode: 'TransactionLifecycle:getCode',
  onFinishedTransaction: 'TransactionLifecycle:onFinishedTransaction',
  createTransactionNotification:
    'TransactionLifecycle:createTransactionNotification',
  updateNFTOwnership: 'TransactionLifecycle:updateNFTOwnership',
  trackTransactionFailure: 'TransactionLifecycle:trackTransactionFailure',
  upgradeAccount: 'TransactionLifecycle:upgradeAccount',
  isEip7702Supported: 'TransactionLifecycle:isEip7702Supported',
} as const;

/**
 * Registers all transaction-lifecycle functions as Messenger action handlers.
 * Call this once at startup (from background.js or modular init).
 * After registration, callers invoke actions directly — MetamaskController
 * is not in the call chain.
 */
export function registerActions(messenger: RootMessenger): void {
  const deps: TransactionLifecycleDependencies = { messenger };
  // Cast to never because RootMessenger type doesn't yet include these action names.
  // TODO: Add TransactionLifecycleActions to RootMessenger allowed-actions type.
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.updateNftOwnershipOnPostTransactionBatch,
    (txMetas: { txParams: { from: string } }[]) =>
      updateNftOwnershipOnPostTransactionBatch(deps, txMetas),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.routeTransactionToSmartTransactionIfEnabled,
    (txId: string, opts: { useSmartTransaction: boolean }) =>
      routeTransactionToSmartTransactionIfEnabled(deps, txId, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.createCancelTransaction,
    (
      originalTxId: string,
      customGasSettings: Record<string, unknown>,
      options: Record<string, unknown>,
    ) =>
      createCancelTransaction(deps, originalTxId, customGasSettings, options),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.createSpeedUpTransaction,
    (
      originalTxId: string,
      customGasSettings: Record<string, unknown>,
      options: Record<string, unknown>,
    ) =>
      createSpeedUpTransaction(deps, originalTxId, customGasSettings, options),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.approveTransactionsWithSameNonce,
    (txIds: string[]) => approveTransactionsWithSameNonce(deps, txIds),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.estimateGas,
    (params: unknown) => estimateGas(deps, params),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.getExternalPendingTransactions,
    (address: string) => getExternalPendingTransactions(deps, address),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.updateEditableParams,
    (txId: string, params: Record<string, unknown>) =>
      updateEditableParams(deps, txId, params),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.getCode,
    (address: string, networkClientId: string) =>
      getCode(deps, address, networkClientId),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.onFinishedTransaction,
    (
      transactionMeta: Parameters<typeof onFinishedTransaction>[1],
      opts: Parameters<typeof onFinishedTransaction>[2],
    ) => onFinishedTransaction(deps, transactionMeta, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.createTransactionNotification,
    (
      transactionMeta: Parameters<typeof createTransactionNotification>[1],
      opts: Parameters<typeof createTransactionNotification>[2],
    ) => createTransactionNotification(deps, transactionMeta, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.updateNFTOwnership,
    (
      transactionMeta: Parameters<typeof updateNFTOwnership>[1],
      opts: Parameters<typeof updateNFTOwnership>[2],
    ) => updateNFTOwnership(deps, transactionMeta, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.trackTransactionFailure,
    (
      transactionMeta: Parameters<typeof trackTransactionFailure>[1],
      opts: Parameters<typeof trackTransactionFailure>[2],
    ) => trackTransactionFailure(deps, transactionMeta, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.upgradeAccount,
    (
      address: string,
      upgradeContractAddress: string,
      chainId: number,
      opts: Parameters<typeof upgradeAccount>[4],
    ) => upgradeAccount(deps, address, upgradeContractAddress, chainId, opts),
  );
  (messenger as never).registerActionHandler(
    TRANSACTION_LIFECYCLE_ACTIONS.isEip7702Supported,
    (
      request: { address: string; chainId: string },
      opts: Parameters<typeof isEip7702Supported>[2],
    ) => isEip7702Supported(deps, request, opts),
  );
}
