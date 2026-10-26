import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'clsx';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { CaipChainId, Hex, isCaipChainId } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxFlexWrap,
  Skeleton,
} from '@metamask/design-system-react';
import {
  getMultichainNativeTokenBalance,
  selectIsAssetsLoadingForSelectedAccountGroup,
  selectUnavailableBalancesForSelectedAccountGroup,
  selectUnifiedBalanceBySelectedAccountGroup,
} from '../../../../selectors/assets';
import { BalanceUnavailable } from '../balance-unavailable';

import { TextVariant } from '../../../../helpers/constants/design-system';
import { SensitiveText } from '../../../component-library';
import {
  getAllEnabledNetworksForAllNamespaces,
  getEnabledNetworksByNamespace,
  getMultichainNetwork,
  getShowFiatInTestnets,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { hexWEIToDecETH } from '../../../../../shared/lib/conversion.utils';
import { TEST_CHAINS } from '../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';

export type AccountGroupBalanceProps = {
  classPrefix: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
  balance: string;
  chainId: CaipChainId | Hex;
};

/**
 * Whether the account group total is replaced with "Balance unavailable" for
 * the given (last selected) network, and which accounts are unavailable.
 * Shared by the total and the header's change row, which must not show a
 * "+0.00 (+0.00%)" change for an unavailable total.
 *
 * @param chainId - The last selected network.
 * @returns The unavailable accounts and whether the total is replaced.
 */
export const useAccountGroupBalanceUnavailability = (
  chainId: CaipChainId | Hex,
) => {
  // Every enabled network across namespaces: more than one means the
  // "All networks" view, whatever network was viewed last.
  const allEnabledNetworks = useSelector(getAllEnabledNetworksForAllNamespaces);
  const selectedGroupBalance = useSelector(
    selectUnifiedBalanceBySelectedAccountGroup,
  );
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const unavailableBalances = useSelector(
    selectUnavailableBalancesForSelectedAccountGroup,
  );
  const caipChainId = useMemo(
    () => (isCaipChainId(chainId) ? chainId : formatChainIdToCaip(chainId)),
    [chainId],
  );
  const isEvm = useMemo(() => isEvmChainId(chainId), [chainId]);

  const total = selectedGroupBalance?.totalBalanceInUserCurrency;
  const currency = selectedGroupBalance
    ? (selectedGroupBalance.userCurrency ?? fallbackCurrency)
    : undefined;
  const totalIsUnresolved = isZeroAmount(total) || currency === undefined;

  // Snap (non-EVM) balances that could not be fetched: never show a stale or
  // placeholder 0 as if it were confirmed.
  const unavailableAccountIds = unavailableBalances?.accountIds ?? [];
  const hasUnavailableBalances = unavailableAccountIds.length > 0;
  // `chainId` is the last selected network, which stays a non-EVM chain after
  // visiting its single-network view and going back to "All networks". Only a
  // single-network view of the failing chain replaces the total; the "All
  // networks" total keeps its known part, flagged as partial.
  const isSingleNetworkView = (allEnabledNetworks?.length ?? 0) <= 1;
  const isViewedChainUnavailable =
    hasUnavailableBalances &&
    isSingleNetworkView &&
    (unavailableBalances?.chainIds ?? []).includes(caipChainId);
  // Replace the total when the viewed (non-EVM) network is the one failing, or
  // when nothing else contributes to it; otherwise flag it as partial.
  const replaceTotalWithUnavailable =
    hasUnavailableBalances &&
    (isViewedChainUnavailable || (!isEvm && totalIsUnresolved));

  return {
    unavailableAccountIds,
    hasUnavailableBalances,
    replaceTotalWithUnavailable,
  };
};

export const AccountGroupBalance = ({
  classPrefix,
  balanceIsCached,
  handleSensitiveToggle,
  balance,
  chainId,
}: AccountGroupBalanceProps) => {
  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const enabledNetworks = useSelector(getEnabledNetworksByNamespace);
  const { formatCurrency, formatTokenQuantity } = useFormatters();

  const selectedGroupBalance = useSelector(
    selectUnifiedBalanceBySelectedAccountGroup,
  );
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );
  const isAssetsLoading = useSelector(
    selectIsAssetsLoadingForSelectedAccountGroup,
  );
  const caipChainId = useMemo(
    () => (isCaipChainId(chainId) ? chainId : formatChainIdToCaip(chainId)),
    [chainId],
  );
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  );

  const multichainNativeTokenBalance = useSelector((state) =>
    getMultichainNativeTokenBalance(state, selectedAccount),
  );

  const isEvm = useMemo(() => isEvmChainId(chainId), [chainId]);

  const isTestnetSelected = useMemo(
    () =>
      Boolean(
        Object.keys(enabledNetworks).length === 1 &&
          TEST_CHAINS.includes(
            Object.keys(enabledNetworks)[0] as `0x${string}`,
          ),
      ),
    [enabledNetworks],
  );

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const networks = useSelector(getMultichainNetwork);
  const showNativeTokenAsMain = useMemo(
    () =>
      Boolean(
        showNativeTokenAsMainBalance &&
          Object.keys(enabledNetworks).length === 1,
      ),
    [showNativeTokenAsMainBalance, enabledNetworks],
  );

  const showConversionForTestnets = useSelector(getShowFiatInTestnets);

  const nativeCurrencySymbol: string = useMemo(() => {
    if (isEvm) {
      return Object.keys(enabledNetworks).length === 1
        ? networkConfigurationsByChainId[
            Object.keys(enabledNetworks)[0] as `0x${string}`
          ]?.nativeCurrency
        : fallbackCurrency;
    }

    return Object.keys(enabledNetworks).length === 1
      ? networks.network.ticker
      : fallbackCurrency;
  }, [
    enabledNetworks,
    networkConfigurationsByChainId,
    isEvm,
    networks,
    fallbackCurrency,
  ]);

  const total = selectedGroupBalance?.totalBalanceInUserCurrency;

  let formattedNativeBalance = null;
  if (showNativeTokenAsMain || isTestnetSelected) {
    if (isEvm) {
      const decimalBalance = parseFloat(hexWEIToDecETH(balance));

      formattedNativeBalance = formatTokenQuantity(
        decimalBalance,
        nativeCurrencySymbol,
      );
    } else {
      formattedNativeBalance = formatTokenQuantity(
        Number(multichainNativeTokenBalance.amount),
        nativeCurrencySymbol,
      );
    }
  }

  const currency = selectedGroupBalance
    ? (selectedGroupBalance.userCurrency ?? fallbackCurrency)
    : undefined;

  const formattedTotal = useMemo(() => {
    if (
      showNativeTokenAsMain ||
      (isTestnetSelected && !showConversionForTestnets)
    ) {
      return formattedNativeBalance;
    }
    if (total === undefined) {
      return null;
    }
    return formatCurrency(total, currency);
  }, [
    showNativeTokenAsMain,
    isTestnetSelected,
    total,
    formatCurrency,
    currency,
    formattedNativeBalance,
    showConversionForTestnets,
  ]);

  const totalIsUnresolved = isZeroAmount(total) || currency === undefined;

  const {
    unavailableAccountIds,
    hasUnavailableBalances,
    replaceTotalWithUnavailable,
  } = useAccountGroupBalanceUnavailability(chainId);

  if (replaceTotalWithUnavailable) {
    return (
      <Box
        className={classnames(
          'flex',
          `${classPrefix}-overview__primary-balance`,
        )}
        data-testid={`${classPrefix}-overview__primary-currency`}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        flexWrap={BoxFlexWrap.Wrap}
      >
        <BalanceUnavailable
          accountIds={unavailableAccountIds}
          data-testid="account-group-balance-unavailable"
        />
      </Box>
    );
  }

  return (
    <Skeleton
      hideChildren={
        totalIsUnresolved &&
        ((isEvm && !anyEnabledNetworksAreAvailable) || isAssetsLoading)
      }
      className="mb-1"
      data-testid="account-group-balance-skeleton"
    >
      <Box
        className={classnames(
          'flex',
          `${classPrefix}-overview__primary-balance`,
          {
            [`${classPrefix}-overview__cached-balance`]: balanceIsCached,
          },
        )}
        data-testid={`${classPrefix}-overview__primary-currency`}
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        flexWrap={BoxFlexWrap.Wrap}
      >
        <SensitiveText
          ellipsis
          variant={TextVariant.inherit}
          isHidden={privacyMode}
          data-testid="account-value-and-suffix"
          onClick={handleSensitiveToggle}
          className="cursor-pointer transition-colors duration-200 hover:text-text-alternative"
        >
          {/* We should always show something but the check is just to appease TypeScript */}
          {formattedTotal}
        </SensitiveText>
        {hasUnavailableBalances && (
          <BalanceUnavailable
            accountIds={unavailableAccountIds}
            size="sm"
            data-testid="account-group-balance-partially-unavailable"
          />
        )}
      </Box>
    </Skeleton>
  );
};

export default AccountGroupBalance;
