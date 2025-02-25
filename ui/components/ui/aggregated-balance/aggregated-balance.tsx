import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
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
  getMultichainAggregatedBalance,
  getMultichainNativeTokenBalance,
} from '../../../selectors/assets';
import { getPreferences, getSelectedInternalAccount } from '../../../selectors';
import { formatWithThreshold } from '../../app/assets/util/formatWithThreshold';
import { getIntlLocale } from '../../../ducks/locale/locale';
import Spinner from '../spinner';

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
  const currentCurrency = useSelector(getCurrentCurrency);
  const multichainAggregatedBalance = useSelector((state) =>
    getMultichainAggregatedBalance(state, selectedAccount),
  );
  const multichainNativeTokenBalance = useSelector((state) =>
    getMultichainNativeTokenBalance(state, selectedAccount),
  );

  const formattedFiatDisplay = formatWithThreshold(
    multichainAggregatedBalance,
    0.01,
    locale,
    {
      style: 'currency',
      currency: currentCurrency.toUpperCase(),
    },
  );

  const formattedTokenDisplay = formatWithThreshold(
    multichainNativeTokenBalance.amount,
    0.00001,
    locale,
    {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    },
  ).replace(/(\.0+|(?<=\.\d+)0+)$/u, ''); // strip trailing zeros

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
          {showNativeTokenAsMainBalance
            ? formattedTokenDisplay
            : formattedFiatDisplay}
        </SensitiveText>
        <SensitiveText
          marginInlineStart={privacyMode ? 0 : 1}
          variant={TextVariant.inherit}
          isHidden={privacyMode}
        >
          {showNativeTokenAsMainBalance
            ? multichainNativeTokenBalance.unit
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
