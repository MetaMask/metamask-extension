import {
  parseCaipAssetType,
  KnownCaipNamespace,
  type CaipAssetType,
  Hex,
  bigIntToHex,
} from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { AssetsControllerState } from '@metamask/assets-controller';
import { AccountTrackerControllerState } from '@metamask/assets-controllers';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { decimalToPrefixedHex } from '../../../shared/modules/conversion.utils';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/selector-creators';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
  isAssetsUnifyStateFeatureEnabled,
  type AssetsUnifyStateFeatureFlag,
} from '../../lib/assets-unify-state/remote-feature-flag';

// TODO Old state
// AccountTrackerController
// accountsByChainId: DONE
//
// TokensController
// allTokens: TODO
// allIgnoredTokens: TODO
// allDetectedTokens: TODO (is this even used? Can it be removed?)
//
// TokenBalancesController
// tokenBalances: TODO
//
// CurrencyRateController
// currencyRates: TODO
// currentCurrency: TODO
//
// TokenRatesController
// marketData: TODO
//
// MultichainAssetsController
// accountsAssets: TODO
// assetsMetadata: TODO
// allIgnoredAssets: TODO
//
// MultichainBalancesController
// balances: TODO
//
// MultichainAssetsRatesController
// conversionRates: TODO
// historicalPrices: TODO (we should probably stop using this as state and fetch it whenever is needed)
//
// TokenListController
// tokensChainsCache: TODO (there are no plans to port this state)
//
// RatesController
// rates: TODO (is this even used? Can it be removed?)

// This utility type makes the selector forceably require just the state that was originally required
// For selectors with custom state input, this prevents their input type from requiring additional state that will not be needed after the migration
type ControllerStateSelector<
  InputState extends Record<string, unknown>,
  ResultField extends keyof InputState,
> = (state: { metamask: InputState }) => InputState[ResultField];

const getIsAssetsUnifyStateEnabled = createDeepEqualSelector(
  [(state) => state.mematasm.remoteFeatureFlags],
  (remoteFeatureFlags) => {
    const featureFlag = remoteFeatureFlags[ASSETS_UNIFY_STATE_FLAG] as
      | AssetsUnifyStateFeatureFlag
      | undefined;

    return isAssetsUnifyStateFeatureEnabled(
      featureFlag,
      ASSETS_UNIFY_STATE_VERSION_1,
    );
  },
);

// ChainId (hex) -> AccountAddress (hex checksummed) -> Balance (hex)
export const getAccountTrackerControllerAccountsByChainId =
  createDeepEqualSelector(
    [
      getIsAssetsUnifyStateEnabled,
      (state: { metamask: AccountTrackerControllerState }) =>
        state.metamask?.accountsByChainId ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask?.assetsInfo ?? {},
      (state: { metamask: AssetsControllerState }) =>
        state.metamask?.assetsBalance ?? {},
      (state: { metamask: AccountsControllerState }) =>
        state.metamask?.internalAccounts?.accounts ?? {},
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

      const result: AccountTrackerControllerState['accountsByChainId'] = {};

      for (const [accountId, accountBalances] of Object.entries(
        assetsBalance,
      )) {
        const internalAccount = internalAccountsById[accountId];
        const address = internalAccount?.address;
        if (!address) {
          continue;
        }

        const checksummedAddress = toChecksumHexAddress(address);

        for (const [assetId, balanceData] of Object.entries(accountBalances)) {
          const metadata = assetsInfo[assetId];
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

          (result[hexChainId] ??= {})[checksummedAddress] = {
            // TODO: Use raw value from state when available
            balance:
              parseBalanceWithDecimals(amount, metadata.decimals) ?? '0x0',
          };
        }
      }

      return result;
    },
  ) as unknown as ControllerStateSelector<
    AccountTrackerControllerState,
    'accountsByChainId'
  >;

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
