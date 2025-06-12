import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { MULTICHAIN_NETWORK_DECIMAL_PLACES } from '@metamask/multichain-network-controller';
import {
  AlignItems,
  Display,
  FlexWrap,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  SensitiveText,
} from '../../component-library';
import {
  getCurrentCurrency,
  getTokenBalances,
} from '../../../ducks/metamask/metamask';
import {
  getAccountAssets,
  getAssetsRates,
  getMultichainAggregatedBalance,
  getMultichainNativeTokenBalance,
} from '../../../selectors/assets';
import { getPreferences, getSelectedInternalAccount } from '../../../selectors';
import {
  getMultichainNetwork,
  getMultichainShouldShowFiat,
} from '../../../selectors/multichain';
import { formatWithThreshold } from '../../app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../../../ducks/locale/locale';
import Spinner from '../spinner';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';

export const AggregatedBalance = ({
  classPrefix,
  balanceIsCached,
  handleSensitiveToggle,
}: {
  classPrefix: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
}) => {
  const { privacyMode, showNativeTokenAsMainBalance } =
    useSelector(getPreferences);
  const locale = useSelector(getIntlLocale);
  const balances = useSelector(getTokenBalances);
  const assets = useSelector(getAccountAssets);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const currentNetwork = useSelector(getMultichainNetwork);
  const currentCurrency = useSelector(getCurrentCurrency);
  const multichainAggregatedBalance = useSelector((state) =>
    getMultichainAggregatedBalance(state, selectedAccount),
  );
  const multichainNativeTokenBalance = useSelector((state) =>
    getMultichainNativeTokenBalance(state, selectedAccount),
  );
  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );

  const multichainAssetsRates = useSelector(getAssetsRates);
  const isNonEvmRatesAvailable = Object.keys(multichainAssetsRates).length > 0;

  const formattedFiatDisplay = formatWithThreshold(
    multichainAggregatedBalance,
    0.0,
    locale,
    {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    },
  );

  const formattedTokenDisplay = formatWithThreshold(
    parseFloat(multichainNativeTokenBalance.amount.toString()),
    0.0,
    locale,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        MULTICHAIN_NETWORK_DECIMAL_PLACES[currentNetwork.chainId] || 5,
    },
  );

  if (!balances || !assets[selectedAccount.id]?.length) {
    return <Spinner className="loading-overlay__spinner" />;
  }

  return (
    <>
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
        >
          {showNativeTokenAsMainBalance ||
          !isNonEvmRatesAvailable ||
          !shouldShowFiat
            ? formattedTokenDisplay
            : formattedFiatDisplay}
        </SensitiveText>
        <SensitiveText
          marginInlineStart={privacyMode ? 0 : 1}
          variant={TextVariant.inherit}
          isHidden={privacyMode}
        >
          {showNativeTokenAsMainBalance ||
          !isNonEvmRatesAvailable ||
          !shouldShowFiat
            ? currentNetwork.network.ticker
            : currentCurrency.toUpperCase()}
        </SensitiveText>

        <ButtonIcon
          color={IconColor.iconAlternative}
          marginLeft={2}
          size={ButtonIconSize.Md}
          onClick={handleSensitiveToggle}
          iconName={privacyMode ? IconName.EyeSlash : IconName.Eye}
          justifyContent={JustifyContent.center}
          ariaLabel="Sensitive toggle"
          data-testid="sensitive-toggle"
        />
      </Box>
    </>
  );
};
