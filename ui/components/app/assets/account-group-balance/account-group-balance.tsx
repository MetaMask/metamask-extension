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
  selectBalanceBySelectedAccountGroup,
} from '../../../../selectors/assets';

import { TextVariant } from '../../../../helpers/constants/design-system';
import { SensitiveText } from '../../../component-library';
import {
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

export const AccountGroupBalance: React.FC<AccountGroupBalanceProps> = ({
  classPrefix,
  balanceIsCached,
  handleSensitiveToggle,
  balance,
  chainId,
}) => {
  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const enabledNetworks = useSelector(getEnabledNetworksByNamespace);
  const { formatCurrency, formatTokenQuantity } = useFormatters();

  const selectedGroupBalance = useSelector(selectBalanceBySelectedAccountGroup);
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  const caipChainId = isCaipChainId(chainId)
    ? chainId
    : formatChainIdToCaip(chainId);
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  );

  const multichainNativeTokenBalance = useSelector((state) =>
    getMultichainNativeTokenBalance(state, selectedAccount),
  );

  const isEvm = isEvmChainId(chainId);

  const isTestnetSelected = Boolean(
    Object.keys(enabledNetworks).length === 1 &&
    TEST_CHAINS.includes(Object.keys(enabledNetworks)[0] as `0x${string}`),
  );

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const networks = useSelector(getMultichainNetwork);
  const showNativeTokenAsMain = Boolean(
    showNativeTokenAsMainBalance && Object.keys(enabledNetworks).length === 1,
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

  return (
    <Skeleton
      hideChildren={
        !anyEnabledNetworksAreAvailable &&
        (isZeroAmount(total) || currency === undefined)
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
      </Box>
    </Skeleton>
  );
};

export default AccountGroupBalance;
