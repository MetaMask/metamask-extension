import {
  parseCaipAssetType,
  KnownCaipNamespace,
  type CaipAssetType,
  Hex,
  bigIntToHex,
} from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/selector-creators';
import { decimalToPrefixedHex } from '../../shared/modules/conversion.utils';
import { AssetsControllerState } from '@metamask/assets-controller';
import { getIsAssetsUnifyStateEnabled } from './assets-unify-state/feature-flags';

type MetaMaskInternalAccountsState = {
  metamask: {
    internalAccounts: { accounts: Record<string, { address: string }> };
  };
};

export type MetaMaskAccountsByChainIdState = {
  metamask: {
    accountsByChainId: {
      [chainId: string]: {
        [address: string]: { balance: string; stakedBalance?: string };
      };
    };
  };
};

type MetaMaskAssetsControllerState = {
  metamask: {
    assetsInfo: AssetsControllerState['assetsInfo'];
    assetsBalance: AssetsControllerState['assetsBalance'];
    assetsPrice: AssetsControllerState['assetsPrice'];
  };
};

/**
 * Builds accountsByChainId from Assets Controller state (assetsInfo, assetsBalance).
 * Returns EVM native asset balances per chain per account (same shape as AccountTrackerController's accountsByChainId).
 * Staked balances are ignored for now.
 */
export const getAccountsByChainId = createDeepEqualSelector(
  [
    getIsAssetsUnifyStateEnabled,
    (state: MetaMaskAccountsByChainIdState) =>
      state.metamask.accountsByChainId ?? {},
    (state: MetaMaskAssetsControllerState) => state.metamask.assetsInfo ?? {},
    (state: MetaMaskAssetsControllerState) =>
      state.metamask.assetsBalance ?? {},
    (state: MetaMaskInternalAccountsState) =>
      state.metamask.internalAccounts?.accounts ?? {},
  ],
  (
    isAssetsUnifyStateEnabled,
    accountsByChainId,
    assetsInfo,
    assetsBalance,
    internalAccountsById,
  ) => {
    if (!isAssetsUnifyStateEnabled) {
      return accountsByChainId;
    }

    const info = assetsInfo;
    const balanceByAccount = assetsBalance;
    const result: MetaMaskAccountsByChainIdState['metamask']['accountsByChainId'] =
      {};

    for (const [accountId, accountBalances] of Object.entries(
      balanceByAccount,
    )) {
      const internalAccount = internalAccountsById[accountId];
      const address = internalAccount?.address;
      if (!address) {
        continue;
      }

      const checksummedAddress = toChecksumHexAddress(address);

      for (const [assetId, balanceData] of Object.entries(accountBalances)) {
        const metadata = info[assetId];
        if (!metadata || metadata.type !== 'native') {
          continue;
        }

        const { chain: parsedChain } = parseCaipAssetType(
          assetId as CaipAssetType,
        );
        if (parsedChain.namespace !== KnownCaipNamespace.Eip155) {
          continue;
        }

        const hexChainId = decimalToPrefixedHex(parsedChain.reference);
        const amount = balanceData?.amount ?? '0';

        result[hexChainId] ??= {};
        result[hexChainId][checksummedAddress] = {
          // TODO: Use raw value from state when available
          balance: parseBalanceWithDecimals(amount, metadata.decimals) ?? '0x0',
        };
      }
    }

    return result;
  },
);

function parseBalanceWithDecimals(
  balanceString: string,
  decimals: number,
): Hex | undefined {
  // Allows: "123", "123.456", "0.123", but not: "-123", "123.", "abc", "12.34.56"
  if (!/^\d+(\.\d+)?$/u.test(balanceString)) {
    return undefined;
  }

  const [integerPart, fractionalPart = ''] = balanceString.split('.');

  if (decimals === 0) {
    return bigIntToHex(BigInt(integerPart));
  }

  if (fractionalPart.length >= decimals) {
    return bigIntToHex(
      BigInt(`${integerPart}${fractionalPart.slice(0, decimals)}`),
    );
  }

  return bigIntToHex(
    BigInt(
      `${integerPart}${fractionalPart}${'0'.repeat(
        decimals - fractionalPart.length,
      )}`,
    ),
  );
}
