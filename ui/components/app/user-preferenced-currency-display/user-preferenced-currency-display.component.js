import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../shared/constants/common';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import CurrencyDisplay from '../../ui/currency-display';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { getSelectedEvmInternalAccount } from '../../../selectors';

/* eslint-disable jsdoc/require-param-name */
// eslint-disable-next-line jsdoc/require-param
/** @param {PropTypes.InferProps<typeof UserPreferencedCurrencyDisplayPropTypes>>} */
export default function UserPreferencedCurrencyDisplay({
  'data-testid': dataTestId,
  account: multichainAccount,
  ethNumberOfDecimals,
  numberOfDecimals: propsNumberOfDecimals,
  type,
  showFiat,
  showNative,
  shouldCheckShowNativeToken,
  privacyMode = false,
  ...restProps
}) {
  // NOTE: When displaying currencies, we need the actual account to detect whether we're in a
  // multichain world or EVM-only world.
  // To preserve the original behavior of this component, we default to the lastly selected
  // EVM accounts (when used in an EVM-only context).
  // The caller has to pass the account in a multichain context to properly display the currency
  // here (e.g for Bitcoin).
  const evmAccount = useSelector(getSelectedEvmInternalAccount);
  const account = multichainAccount ?? evmAccount;

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(type, {
    account,
    ethNumberOfDecimals,
    numberOfDecimals: propsNumberOfDecimals,
    showFiatOverride: showFiat,
    showNativeOverride: showNative,
    shouldCheckShowNativeToken,
  });
  return (
    <CurrencyDisplay
      {...restProps}
      account={account}
      currency={currency}
      data-testid={dataTestId}
      numberOfDecimals={numberOfDecimals}
      suffix={false}
      privacyMode={privacyMode}
    />
  );
}

const UserPreferencedCurrencyDisplayPropTypes = {
  className: PropTypes.string,
  account: PropTypes.object,
  'data-testid': PropTypes.string,
  prefix: PropTypes.string,
  value: PropTypes.string,
  numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  hideLabel: PropTypes.bool,
  hideTitle: PropTypes.bool,
  style: PropTypes.object,
  type: PropTypes.oneOf([PRIMARY, SECONDARY]),
  ethNumberOfDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  showFiat: PropTypes.bool,
  showNative: PropTypes.bool,
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
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  textProps: PropTypes.object,
  suffixProps: PropTypes.object,
  shouldCheckShowNativeToken: PropTypes.bool,
  privacyMode: PropTypes.bool,
};

UserPreferencedCurrencyDisplay.propTypes =
  UserPreferencedCurrencyDisplayPropTypes;
