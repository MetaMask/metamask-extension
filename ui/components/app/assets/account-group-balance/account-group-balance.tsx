import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { selectBalanceBySelectedAccountGroup } from '../../../../selectors/assets';

import {
  AlignItems,
  Display,
  FlexWrap,
  IconColor,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  SensitiveText,
  IconName,
} from '../../../component-library';
import {
  getPreferences,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../../selectors';
import { getIntlLocale } from '../../../../ducks/locale/locale';
import { formatWithThreshold } from '../util/formatWithThreshold';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Skeleton } from '../../../component-library/skeleton';
import { isZeroAmount } from '../../../../helpers/utils/number-utils';

type AccountGroupBalanceProps = {
  classPrefix: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
};

export const AccountGroupBalance: React.FC<AccountGroupBalanceProps> = ({
  classPrefix,
  balanceIsCached,
  handleSensitiveToggle,
}) => {
  const { privacyMode } = useSelector(getPreferences);
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();

  const selectedGroupBalance = useSelector(selectBalanceBySelectedAccountGroup);
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const anyEnabledNetworksAreAvailable = useSelector(
    selectAnyEnabledNetworksAreAvailable,
  );

  const total = selectedGroupBalance?.totalBalanceInUserCurrency;
  const currency = selectedGroupBalance
    ? (selectedGroupBalance.userCurrency ?? fallbackCurrency)
    : undefined;

  const formattedFiatDisplay =
    total === undefined || currency === undefined
      ? undefined
      : formatWithThreshold(total, 0.0, locale, {
          style: 'currency',
          currency: currency.toUpperCase(),
        });

  return (
    <Skeleton
      hideChildren
      showUntil={
        anyEnabledNetworksAreAvailable ||
        (selectedGroupBalance !== null &&
          !isZeroAmount(total) &&
          currency !== undefined)
      }
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
        >
          {formattedFiatDisplay}
        </SensitiveText>
        <SensitiveText
          marginInlineStart={privacyMode ? 0 : 1}
          variant={TextVariant.inherit}
          isHidden={privacyMode}
        >
          {currency?.toUpperCase()}
        </SensitiveText>

        <ButtonIcon
          color={IconColor.iconAlternative}
          marginLeft={2}
          size={ButtonIconSize.Md}
          onClick={handleSensitiveToggle}
          iconName={privacyMode ? IconName.EyeSlash : IconName.Eye}
          justifyContent={JustifyContent.center}
          ariaLabel={t('hideSentitiveInfo')}
          data-testid="sensitive-toggle"
        />
      </Box>
    </Skeleton>
  );
};

export default AccountGroupBalance;
