import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../shared/constants/common';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import CurrencyDisplay from '../../ui/currency-display';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { AvatarNetwork, AvatarNetworkSize } from '../../component-library';
import { getCurrentNetwork } from '../../../selectors';
import { getNativeCurrency } from '../../../ducks/metamask/metamask';

/* eslint-disable jsdoc/require-param-name */
// eslint-disable-next-line jsdoc/require-param
/** @param {PropTypes.InferProps<typeof UserPreferencedCurrencyDisplayPropTypes>>} */
export default function UserPreferencedCurrencyDisplay({
  'data-testid': dataTestId,
  ethNumberOfDecimals,
  fiatNumberOfDecimals,
  numberOfDecimals: propsNumberOfDecimals,
  showEthLogo,
  type,
  showFiat,
  showNative,
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
    showNativeOverride: showNative,
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

const UserPreferencedCurrencyDisplayPropTypes = {
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
  showNative: PropTypes.bool,
  showCurrencySuffix: PropTypes.bool,
  /**
   * Following are the props from CurrencyDisplay component.
   * UserPreferencedCurrencyDisplay component should also accept all the props from Currency component
   */
  currency: PropTypes.string,
  denomination: PropTypes.oneOf([
    EtherDenomination.GWEI,
    EtherDenomination.ETH,
  ]),
  displayValue: PropTypes.string,
  prefixComponent: PropTypes.node,
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  prefixComponentWrapperProps: PropTypes.object,
  textProps: PropTypes.object,
  suffixProps: PropTypes.object,
};

UserPreferencedCurrencyDisplay.propTypes =
  UserPreferencedCurrencyDisplayPropTypes;
