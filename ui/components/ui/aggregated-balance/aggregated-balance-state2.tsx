import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  selectSelectedGroupBalance,
  selectBalanceForAllWallets,
  selectAggregatedBalanceByAccountGroup,
  type BalanceCalculationState,
} from '../../../selectors/assets';

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
import { getPreferences, getSelectedInternalAccount } from '../../../selectors';
import { getIntlLocale } from '../../../ducks/locale/locale';
import Spinner from '../spinner';
import { formatWithThreshold } from '../../app/assets/util/formatWithThreshold';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';

type AggregatedBalanceState2Props = {
  classPrefix: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
};

export const AggregatedBalanceState2: React.FC<
  AggregatedBalanceState2Props
> = ({ classPrefix, balanceIsCached, handleSensitiveToggle }) => {
  const { privacyMode } = useSelector(getPreferences);
  const locale = useSelector(getIntlLocale);

  const selectedGroupBalance = useSelector(selectSelectedGroupBalance);

  // Portfolio-level totals are safe to compute without ATC
  const allWalletsBalance = useSelector(selectBalanceForAllWallets);

  // Resolve group by membership of the selected account (mobile parity)
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const resolvedGroupId = useSelector((state: BalanceCalculationState) => {
    const wallets =
      (state.metamask?.accountTree?.wallets as Record<
        string,
        { groups?: Record<string, { accounts?: string[] }> }
      >) || {};
    const accountId = selectedAccount?.id;
    let fallbackFirstGroup: string | undefined;
    for (const wallet of Object.values(wallets || {})) {
      const groups: Record<string, { accounts?: string[] }> =
        wallet?.groups || {};
      const firstGroupId = Object.keys(groups)[0];
      if (!fallbackFirstGroup && firstGroupId) {
        fallbackFirstGroup = firstGroupId;
      }
      if (!accountId) {
        continue;
      }
      for (const [groupId, group] of Object.entries(groups || {})) {
        const accounts: string[] = Array.isArray(group?.accounts)
          ? (group.accounts as string[])
          : [];
        if (accounts.includes(accountId)) {
          return groupId;
        }
      }
    }
    return fallbackFirstGroup;
  });

  const selectBalanceForResolvedGroup = useMemo(
    () =>
      resolvedGroupId
        ? selectAggregatedBalanceByAccountGroup(resolvedGroupId)
        : null,
    [resolvedGroupId],
  );
  const resolvedGroupBalance = useSelector((state: BalanceCalculationState) =>
    selectBalanceForResolvedGroup ? selectBalanceForResolvedGroup(state) : null,
  );

  const total =
    selectedGroupBalance?.totalBalanceInUserCurrency ??
    resolvedGroupBalance?.totalBalanceInUserCurrency ??
    allWalletsBalance?.totalBalanceInUserCurrency;

  const fallbackCurrency = useSelector(getCurrentCurrency);
  const currency =
    selectedGroupBalance?.userCurrency ??
    resolvedGroupBalance?.userCurrency ??
    allWalletsBalance?.userCurrency ??
    fallbackCurrency;

  if (typeof total !== 'number' || !currency) {
    return <Spinner className="loading-overlay__spinner" />;
  }

  const formattedFiatDisplay = formatWithThreshold(total, 0.0, locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  });

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
          {formattedFiatDisplay}
        </SensitiveText>
        <SensitiveText
          marginInlineStart={privacyMode ? 0 : 1}
          variant={TextVariant.inherit}
          isHidden={privacyMode}
        >
          {currency.toUpperCase()}
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

export default AggregatedBalanceState2;
