/**
 * Generic multichain account management utilities
 * For Bitcoin, Tron, and future blockchain integrations
 */

/**
 * Chain-specific account removal configuration
 */
export type ChainAccountConfig = {
  chainName: string;
  accountTypePrefix: string; // e.g., 'bip122:', 'tron:'
  supportedAddressPrefixes?: string[]; // e.g., ['bc1', '1', '3'] for Bitcoin
};

/**
 * Predefined chain configurations
 */
export const CHAIN_CONFIGS: Record<string, ChainAccountConfig> = {
  bitcoin: {
    chainName: 'Bitcoin',
    accountTypePrefix: 'bip122:',
    supportedAddressPrefixes: ['bc1', '1', '3'],
  },
  tron: {
    chainName: 'Tron',
    accountTypePrefix: 'tron:',
    supportedAddressPrefixes: ['T'],
  },
};

/**
 * Generic function to identify accounts of a specific chain type
 */
export function isChainAccount(
  account: { type?: string; address?: string },
  chainConfig: ChainAccountConfig,
): boolean {
  if (!account.type && !account.address) {
    return false;
  }

  // Check by account type prefix (most reliable)
  if (account.type?.startsWith(chainConfig.accountTypePrefix)) {
    return true;
  }

  // Fallback: Check by address prefix if available
  if (account.address && chainConfig.supportedAddressPrefixes) {
    return chainConfig.supportedAddressPrefixes.some((prefix) =>
      account.address?.startsWith(prefix),
    );
  }

  return false;
}

/**
 * Get all accounts of a specific chain type from wallets
 */
export function getChainAccountsFromWallets(
  wallets: any[],
  chainConfig: ChainAccountConfig,
): Array<{ type?: string; address: string }> {
  const chainAccounts: Array<{ type?: string; address: string }> = [];

  for (const wallet of wallets) {
    const groups = wallet.getMultichainAccountGroups();
    for (const group of groups) {
      const accounts = group.getAccounts();
      const chainAccountsInGroup = accounts.filter((account: any) =>
        isChainAccount(account, chainConfig),
      );
      chainAccounts.push(...chainAccountsInGroup);
    }
  }

  return chainAccounts;
}

/**
 * Generic function to remove all accounts of a specific chain type
 */
export async function removeChainAccounts(
  chainConfig: ChainAccountConfig,
  controller: any,
  controllerMessenger: any,
): Promise<void> {
    console.log(`🗑️ Removing ${chainConfig.chainName} accounts from wallet...`);

    try {
      const wallets = controller.getMultichainAccountWallets();
      const chainAccounts = getChainAccountsFromWallets(wallets, chainConfig);

      console.log(
        `🗑️ Found ${chainAccounts.length} ${chainConfig.chainName} accounts to remove`,
      );

      // Remove accounts from their keyrings
      for (const chainAccount of chainAccounts) {
        try {
          const snapKeyrings = controllerMessenger.call(
            'KeyringController:getKeyringsByType',
            'Snap Keyring',
          );

          for (const snapKeyring of snapKeyrings) {
            const keyringObj = snapKeyring as {
              id?: string;
              accounts?: string[];
              [key: string]: unknown;
            };

            const keyringId =
              keyringObj.id ||
              (keyringObj.accounts?.[0]
                ? `snap-${keyringObj.accounts[0]}`
                : null) ||
              'unknown';

            try {
              await controllerMessenger.call(
                'KeyringController:withKeyring',
                { id: keyringId },
                async ({ keyring }: { keyring: any }) => {
                  if (keyring.accounts?.includes(chainAccount.address)) {
                    await keyring.removeAccount(chainAccount.address);
                    console.log(
                      `🗑️ Removed ${chainConfig.chainName} account: ${chainAccount.address.slice(0, 8)}... from keyring ${keyringId}`,
                    );
                  }
                },
              );
            } catch (keyringError) {
              console.warn(
                `Keyring operation failed for ${chainConfig.chainName} account ${chainAccount.address}:`,
                keyringError,
              );
            }
          }
        } catch (error) {
          console.warn(
            `Failed to remove ${chainConfig.chainName} account ${chainAccount.address}:`,
            error,
          );
        }
      }

      console.log(
        `✅ ${chainConfig.chainName} accounts completely removed from wallet`,
      );
    } catch (error) {
      console.error(`Failed to remove ${chainConfig.chainName} accounts:`, error);
    }
}
