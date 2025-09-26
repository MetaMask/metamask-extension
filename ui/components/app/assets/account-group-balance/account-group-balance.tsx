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
import { getPreferences } from '../../../../selectors';
import Spinner from '../../../ui/spinner';
import { useFormatters } from '../../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../../hooks/useI18nContext';

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
  const { formatCurrency } = useFormatters();
  const t = useI18nContext();

  const selectedGroupBalance = useSelector(selectBalanceBySelectedAccountGroup);
  const fallbackCurrency = useSelector(getCurrentCurrency);

  if (!selectedGroupBalance) {
    return <Spinner className="loading-overlay__spinner" />;
  }

  const total = selectedGroupBalance.totalBalanceInUserCurrency;
  const currency = selectedGroupBalance.userCurrency ?? fallbackCurrency;

  if (typeof total !== 'number' || !currency) {
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
          {formatCurrency(total, currency)}
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
    </>
  );
};

export default AccountGroupBalance;
