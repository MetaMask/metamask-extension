import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import CurrencyDisplay from '../../ui/currency-display';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { AvatarNetwork, AvatarNetworkSize } from '../../component-library';
import { getCurrentNetwork } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';

export default function UserPreferencedCurrencyDisplay({
  'data-testid': dataTestId,
  ethNumberOfDecimals,
  fiatNumberOfDecimals,
  numberOfDecimals: propsNumberOfDecimals,
  showEthLogo,
  type,
  showFiat,
  showCurrencySuffix,
  ...restProps
}) {
  const currentNetwork = useSelector(getCurrentNetwork);
  const nativeCurrency = useSelector(getNativeCurrency);
  const { currency, numberOfDecimals } = useUserPreferencedCurrency(type, {
    ethNumberOfDecimals,
    fiatNumberOfDecimals,
    numberOfDecimals: propsNumberOfDecimals,
    showFiatOverride: showFiat,
  });
  const prefixComponent = useMemo(() => {
    return (
      showEthLogo &&
      currency === nativeCurrency && (
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          name={currentNetwork?.nickname}
          src={currentNetwork?.rpcPrefs?.imageUrl}
        />
      )
    );
  }, [
    currency,
    showEthLogo,
    nativeCurrency,
    currentNetwork?.nickname,
    currentNetwork?.rpcPrefs?.imageUrl,
  ]);
  return (
    <CurrencyDisplay
      {...restProps}
      currency={currency}
      data-testid={dataTestId}
      numberOfDecimals={numberOfDecimals}
      prefixComponent={prefixComponent}
      suffix={showCurrencySuffix && !showEthLogo && currency}
    />
  );
}
UserPreferencedCurrencyDisplay.propTypes = {
  className: PropTypes.string,
  'data-testid': PropTypes.string,
  prefix: PropTypes.string,
  value: PropTypes.string,
  numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hideLabel: PropTypes.bool,
  hideTitle: PropTypes.bool,
  style: PropTypes.object,
  showEthLogo: PropTypes.bool,
  ethLogoHeight: PropTypes.number,
  type: PropTypes.oneOf([PRIMARY, SECONDARY]),
  ethNumberOfDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  fiatNumberOfDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  showFiat: PropTypes.bool,
  showCurrencySuffix: PropTypes.bool,
  /**
   * UserPreferencedCurrencyDisplay component should also accept all the props from Currency component
   */
  ...CurrencyDisplay.propTypes,
};
