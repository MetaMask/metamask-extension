import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { CaipChainId, Hex, isCaipChainId } from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { getAggregatedBalanceForAccount } from '@metamask/assets-controller';
import {
  getMultichainNativeTokenBalance,
  selectBalanceBySelectedAccountGroup,
} from '../../../../selectors/assets';

import {
  AlignItems,
  Display,
  FlexWrap,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, SensitiveText } from '../../../component-library';
import {
  getEnabledNetworks,
  getEnabledNetworksByNamespace,
  getPreferences,
  getSelectedInternalAccount,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Skeleton } from '../../../component-library/skeleton';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import {
  getMultichainNativeCurrency,
  getMultichainIsTestnet,
} from '../../../../selectors/multichain';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';
import { hexWEIToDecETH } from '../../../../../shared/modules/conversion.utils';
import { getIsAssetsUnifyStateEnabled } from '../../../../selectors/assets-unify-state/feature-flags';

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

  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);
  const selectedInternalAccount = useSelector(getSelectedInternalAccount);
  const enabledNetworkMap = useSelector(getEnabledNetworks);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aggregatedBalance = useSelector((state: any) => {
    if (!isAssetsUnifyStateEnabled || !selectedInternalAccount) {
      return null;
    }

    const assetsControllerState = {
      assetsInfo: state?.metamask?.assetsInfo ?? {},
      assetsMetadata: state?.metamask?.assetsMetadata ?? {},
      assetsBalance: state?.metamask?.assetsBalance ?? {},
      assetsPrice: state?.metamask?.assetsPrice ?? {},
      assetPreferences: state?.metamask?.assetPreferences ?? {},
      customAssets: state?.metamask?.customAssets ?? {},
    };

    const accountTreeState = state?.metamask?.accountTree
      ? {
          accountTree: state.metamask.accountTree,
          isAccountTreeSyncingInProgress:
            state.metamask.isAccountTreeSyncingInProgress ?? false,
          hasAccountTreeSyncingSyncedAtLeastOnce:
            state.metamask.hasAccountTreeSyncingSyncedAtLeastOnce ?? false,
          accountGroupsMetadata: state.metamask.accountGroupsMetadata ?? {},
          accountWalletsMetadata: state.metamask.accountWalletsMetadata ?? {},
        }
      : undefined;
    const accountsById = state?.metamask?.internalAccounts?.accounts ?? {};

    return getAggregatedBalanceForAccount(
      assetsControllerState,
      selectedInternalAccount,
      enabledNetworkMap,
      accountTreeState,
      undefined,
      accountsById,
    );
  });

  const multichainNativeTokenBalance = useSelector((state) =>
    getMultichainNativeTokenBalance(state, selectedAccount),
  );

  const isEvm = isEvmChainId(chainId);

  const isTestnet = useSelector(getMultichainIsTestnet);

  const showNativeTokenAsMain = Boolean(
    showNativeTokenAsMainBalance && Object.keys(enabledNetworks).length === 1,
  );

  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    selectedAccount,
  );

  let formattedNativeBalance = null;
  if (showNativeTokenAsMain || isTestnet) {
    if (isEvm) {
      const decimalBalance = parseFloat(hexWEIToDecETH(balance));

      formattedNativeBalance = formatTokenQuantity(
        decimalBalance,
        nativeCurrency,
      );
    } else {
      formattedNativeBalance = formatTokenQuantity(
        Number(multichainNativeTokenBalance.amount),
        nativeCurrency,
      );
    }
  }

  const total = selectedGroupBalance?.totalBalanceInUserCurrency;
  const currency = selectedGroupBalance
    ? (selectedGroupBalance.userCurrency ?? fallbackCurrency)
    : undefined;

  const formattedTotal = useMemo(() => {
    if (showNativeTokenAsMain || isTestnet) {
      return formattedNativeBalance;
    }
    if (
      isAssetsUnifyStateEnabled &&
      aggregatedBalance?.totalBalanceInFiat !== undefined
    ) {
      return formatCurrency(
        aggregatedBalance.totalBalanceInFiat,
        fallbackCurrency,
      );
    }
    if (total === undefined) {
      return null;
    }
    return formatCurrency(total, currency);
  }, [
    showNativeTokenAsMain,
    isTestnet,
    isAssetsUnifyStateEnabled,
    aggregatedBalance,
    total,
    formatCurrency,
    currency,
    fallbackCurrency,
    formattedNativeBalance,
  ]);

  return (
    <Skeleton
      isLoading={
        !anyEnabledNetworksAreAvailable &&
        (isZeroAmount(total) || currency === undefined)
      }
      marginBottom={1}
    >
      <Box
        className={classnames(`${classPrefix}-overview__primary-balance`, {
          [`${classPrefix}-overview__cached-balance`]: balanceIsCached,
        })}
        data-testid={`${classPrefix}-overview__primary-currency`}
        display={Display.Flex}
        alignItems={AlignItems.center}
        flexWrap={FlexWrap.Wrap}
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
