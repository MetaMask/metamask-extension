import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { balanceSelectors } from '@metamask/assets-controllers';

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
import { getPreferences } from '../../../selectors';
import { getIntlLocale } from '../../../ducks/locale/locale';
import Spinner from '../spinner';
import { formatWithThreshold } from '../../app/assets/util/formatWithThreshold';

type AggregatedBalanceState2Props = {
  classPrefix: string;
  balanceIsCached: boolean;
  handleSensitiveToggle: () => void;
};

export const AggregatedBalanceState2: React.FC<AggregatedBalanceState2Props> = ({
  classPrefix,
  balanceIsCached,
  handleSensitiveToggle,
}) => {
  const { privacyMode } = useSelector(getPreferences);
  const locale = useSelector(getIntlLocale);

  const { selectBalanceForAllWallets } = balanceSelectors;
  const allWalletsBalance = useSelector(selectBalanceForAllWallets());

  const total = allWalletsBalance?.totalBalanceInUserCurrency;
  const currency = allWalletsBalance?.userCurrency;

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


