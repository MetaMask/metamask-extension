import type { Bip44Account } from '@metamask/account-api';
import type { EntropySourceId, KeyringAccount } from '@metamask/keyring-api';
import {
  AccountCreationType,
  XlmAccountType,
  XlmScope,
} from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import {
  SnapAccountProvider,
  type MultichainAccountServiceMessenger,
} from '@metamask/multichain-account-service';
import { STELLAR_WALLET_SNAP_ID } from '../../../../shared/lib/accounts/stellar-wallet-snap';

export const XLM_ACCOUNT_PROVIDER_NAME = 'Stellar';

type SnapAccountProviderConfig = ConstructorParameters<
  typeof SnapAccountProvider
>[2];

export const XLM_ACCOUNT_PROVIDER_DEFAULT_CONFIG: SnapAccountProviderConfig = {
  maxConcurrency: 1,
  discovery: {
    enabled: true,
    timeoutMs: 2000,
    maxAttempts: 3,
    backOffMs: 1000,
  },
  createAccounts: {
    batched: false,
    timeoutMs: 3000,
  },
  resyncAccounts: {
    autoRemoveExtraSnapAccounts: true,
  },
};

type RestrictedSnapKeyring = Parameters<
  SnapAccountProvider['createAccountV1']
>[0];

async function withRetry<ResultType>(
  fnToExecute: () => Promise<ResultType>,
  {
    maxAttempts = 3,
    backOffMs = 500,
  }: { maxAttempts?: number; backOffMs?: number } = {},
): Promise<ResultType> {
  let lastError: unknown;
  let delay = backOffMs;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fnToExecute();
    } catch (error) {
      lastError = error;
      if (attempt + 1 >= maxAttempts) {
        break;
      }
      const waitMs = delay;
      await new Promise((resolve) => {
        setTimeout(resolve, waitMs);
      });
      delay *= 2;
    }
  }

  throw lastError;
}

async function withTimeout<ResultType>(
  fn: () => Promise<ResultType>,
  timeoutMs: number,
): Promise<ResultType> {
  return Promise.race([
    fn(),
    new Promise<ResultType>((_resolve, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
    }),
  ]);
}

export class XlmAccountProvider extends SnapAccountProvider {
  readonly capabilities = {
    scopes: [XlmScope.Pubnet, XlmScope.Testnet],
    bip44: {
      deriveIndex: true,
      deriveIndexRange: true,
    },
  };

  constructor(
    messenger: MultichainAccountServiceMessenger,
    config: SnapAccountProviderConfig = XLM_ACCOUNT_PROVIDER_DEFAULT_CONFIG,
  ) {
    super(STELLAR_WALLET_SNAP_ID, messenger, config);
  }

  getName(): string {
    return XLM_ACCOUNT_PROVIDER_NAME;
  }

  isAccountCompatible(account: Bip44Account<InternalAccount>): boolean {
    return (
      account.type === XlmAccountType.Account &&
      account.metadata.keyring.type === KeyringTypes.snap
    );
  }

  // Stellar account types are not yet included in SnapAccountProvider typings.
  // @ts-expect-error Stellar KeyringAccount variant is ahead of multichain-account-service types
  protected createAccountV1(
    keyring: RestrictedSnapKeyring,
    {
      entropySource,
      groupIndex,
    }: {
      entropySource: EntropySourceId;
      groupIndex: number;
    },
  ): Promise<KeyringAccount> {
    return keyring.createAccount({
      entropySource,
      index: groupIndex,
      addressType: XlmAccountType.Account,
      scope: XlmScope.Pubnet,
    }) as Promise<KeyringAccount>;
  }

  // @ts-expect-error Stellar KeyringAccount variant is ahead of multichain-account-service types
  async discoverAccounts({
    entropySource,
    groupIndex,
  }: {
    entropySource: EntropySourceId;
    groupIndex: number;
  }): Promise<Bip44Account<KeyringAccount>[]> {
    return this.withSnap(async ({ client, keyring }) => {
      return this.trace(
        {
          name: 'SnapDiscoverAccounts',
          data: {
            provider: this.getName(),
          },
        },
        async () => {
          if (!this.config.discovery.enabled) {
            return [];
          }

          const discoveredAccounts = await withRetry(
            () =>
              withTimeout(
                () =>
                  client.discoverAccounts(
                    [XlmScope.Pubnet],
                    entropySource,
                    groupIndex,
                  ),
                this.config.discovery.timeoutMs,
              ),
            {
              maxAttempts: this.config.discovery.maxAttempts,
              backOffMs: this.config.discovery.backOffMs,
            },
          );

          if (!discoveredAccounts.length) {
            return [];
          }

          return this.createBip44Accounts(keyring, {
            type: AccountCreationType.Bip44DeriveIndex,
            entropySource,
            groupIndex,
          }) as Promise<Bip44Account<KeyringAccount>[]>;
        },
      );
    });
  }
}
