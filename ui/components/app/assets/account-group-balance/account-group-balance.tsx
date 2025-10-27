import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { CaipChainId, Hex, isCaipChainId } from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
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
  getEnabledNetworksByNamespace,
  getPreferences,
  isGlobalNetworkSelectorRemoved,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { Skeleton } from '../../../component-library/skeleton';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getMultichainNativeCurrency } from '../../../../selectors/multichain';
import { Numeric } from '../../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../../shared/constants/common';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import { isEvmChainId } from '../../../../../shared/lib/asset-utils';

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

  const showNativeTokenAsMain = isGlobalNetworkSelectorRemoved
    ? showNativeTokenAsMainBalance && Object.keys(enabledNetworks).length === 1
    : showNativeTokenAsMainBalance;

  const nativeCurrency = useMultichainSelector(
    getMultichainNativeCurrency,
    selectedAccount,
  );

  let formattedNativeBalance = null;
  if (showNativeTokenAsMain) {
    if (isEvm) {
      const decimalBalance = new Numeric(balance, 16, EtherDenomination.WEI)
        .toDenomination(EtherDenomination.ETH)
        .toBase(10);

      formattedNativeBalance = formatTokenQuantity(
        decimalBalance.toNumber(), // Pass as number
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

          {(() => {
            if (showNativeTokenAsMain) {
              return formattedNativeBalance;
            }
            if (total === undefined) {
              return null;
            }
            return formatCurrency(total, currency);
          })()}
        </SensitiveText>
      </Box>
    </Skeleton>
  );
};

export default AccountGroupBalance;
