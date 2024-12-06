import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Box } from '../../component-library';
import { BlockSize } from '../../../helpers/constants/design-system';
import UnitInput from '../../ui/unit-input';
import CurrencyDisplay from '../../ui/currency-display';
import {
  getNativeCurrency,
  getCurrentCurrency,
} from '../../../ducks/metamask/metamask';
import {
  getCurrentChainId,
  getProviderConfig,
} from '../../../../shared/modules/selectors/networks';
import { getShouldShowFiat } from '../../../selectors';
import { EtherDenomination } from '../../../../shared/constants/common';
import { Numeric } from '../../../../shared/modules/Numeric';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import useTokenExchangeRate from './hooks/useTokenExchangeRate';
import useProcessNewDecimalValue from './hooks/useProcessNewDecimalValue';
import useStateWithFirstTouch from './hooks/useStateWithFirstTouch';

const NATIVE_CURRENCY_DECIMALS = 18;
const LARGE_SYMBOL_LENGTH = 7;

/**
 * Component that allows user to enter currency values as a number, and props receive a converted
 * hex value in WEI. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value depending on the currency (ETH or Fiat).
 *
 * @param options0
 * @param options0.hexValue
 * @param options0.isFiatPreferred
 * @param options0.onChange
 * @param options0.onPreferenceToggle
 * @param options0.swapIcon
 * @param options0.className
 * @param options0.asset
 * @param options0.isSkeleton
 * @param options0.isMatchingUpstream
 */
export default function CurrencyInput({
  hexValue,
  isFiatPreferred,
  onChange,
  onPreferenceToggle,
  swapIcon,
  className = '',
  // if null, the asset is the native currency
  asset,
  isSkeleton,
  isMatchingUpstream,
}) {
  const assetDecimals = isNaN(Number(asset?.decimals))
    ? NATIVE_CURRENCY_DECIMALS
    : Number(asset?.decimals);

  const preferredCurrency = useSelector(getNativeCurrency);
  const secondaryCurrency = useSelector(getCurrentCurrency);

  const primarySuffix =
    asset?.symbol || preferredCurrency || EtherDenomination.ETH;
  const secondarySuffix = secondaryCurrency.toUpperCase();
  const isLongSymbol = (primarySuffix?.length || 0) > LARGE_SYMBOL_LENGTH;

  const isFiatAvailable = useSelector(getShouldShowFiat);

  const shouldUseFiat = isFiatAvailable && isFiatPreferred;
  const isTokenPrimary = !shouldUseFiat;

  const [tokenDecimalValue, setTokenDecimalValue, isInputUnchanged] =
    useStateWithFirstTouch('0');

  const [fiatDecimalValue, setFiatDecimalValue] = useState('0');

  const chainId = useSelector(getCurrentChainId);
  const { ticker, type, rpcUrl } = useSelector(getProviderConfig);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    ticker,
    type,
    rpcUrl,
  );

  const inputRef = useRef();

  const tokenToFiatConversionRate = useTokenExchangeRate(asset?.address);

  const isNonZeroConversionRate = Boolean(
    tokenToFiatConversionRate?.toNumber(),
  );

  const processNewDecimalValue = useProcessNewDecimalValue(
    assetDecimals,
    isTokenPrimary,
    tokenToFiatConversionRate,
  );

  const isDisabled = onChange === undefined;
  const swap = async () => {
    await onPreferenceToggle();
  };

  // if the conversion rate is undefined, do not allow a fiat input
  useEffect(() => {
    if (isTokenPrimary) {
      return;
    }

    if (!isNonZeroConversionRate) {
      onPreferenceToggle();
    }
  }, [isNonZeroConversionRate, isTokenPrimary, onPreferenceToggle]);

  const handleChange = (newDecimalValue) => {
    const { newTokenDecimalValue, newFiatDecimalValue } =
      processNewDecimalValue(newDecimalValue);
    setTokenDecimalValue(newTokenDecimalValue);
    setFiatDecimalValue(newFiatDecimalValue);

    onChange(
      new Numeric(newTokenDecimalValue, 10)
        .times(Math.pow(10, assetDecimals), 10)
        .toPrefixedHexString(),
      newTokenDecimalValue,
    );
  };

  const timeoutRef = useRef(null);
  // align input to upstream value
  useEffect(() => {
    const decimalizedHexValue = new Numeric(hexValue, 16)
      .toBase(10)
      .shiftedBy(assetDecimals)
      .toString();

    if (Number(decimalizedHexValue) === Number(tokenDecimalValue)) {
      return;
    }

    // if input is disabled or the input hasn't changed, the value is upstream (i.e., based on the raw token value)
    const isUpstreamValue =
      isDisabled || isInputUnchanged || isMatchingUpstream;

    const { newTokenDecimalValue, newFiatDecimalValue } =
      processNewDecimalValue(
        decimalizedHexValue,
        isUpstreamValue ? true : undefined,
      );

    setTokenDecimalValue(newTokenDecimalValue);
    setFiatDecimalValue(newFiatDecimalValue);

    // timeout intentionally not cleared after render so this always runs
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(
      () => inputRef.current?.updateIsOverflowing?.(),
      500,
    );

    // tokenDecimalValue does not need to be in here, since this side effect is only for upstream updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hexValue,
    asset?.address,
    processNewDecimalValue,
    isTokenPrimary,
    assetDecimals,
    isDisabled,
  ]);

  const renderSwapButton = () => {
    if (swapIcon) {
      return swapIcon(swap);
    }

    if (!isOriginalNativeSymbol) {
      return null;
    }

    return (
      <button
        className="currency-input__swap-component"
        data-testid="currency-swap"
        onClick={swap}
      >
        <i className="fa fa-retweet fa-lg" />
      </button>
    );
  };

  const renderConversionComponent = () => {
    let suffix, displayValue;

    if (!isFiatAvailable || !tokenToFiatConversionRate) {
      return null;
    }
    if (!isOriginalNativeSymbol) {
      return null;
    }

    if (isTokenPrimary) {
      // Display fiat; `displayValue` bypasses calculations
      displayValue = formatCurrency(
        new Numeric(fiatDecimalValue, 10).toString(),
        secondaryCurrency,
      );
    } else {
      // Display token
      suffix = primarySuffix;
      displayValue = new Numeric(tokenDecimalValue, 10).toString();
    }

    return (
      <CurrencyDisplay
        // hides the fiat suffix
        hideLabel={isTokenPrimary || isLongSymbol}
        suffix={suffix}
        className="currency-input__conversion-component"
        displayValue={displayValue}
      />
    );
  };

  return isSkeleton ? (
    <Box paddingRight={4} className="currency-input__skeleton-container">
      <Box width={BlockSize.Half} className="currency-input__pulsing-bar" />
      <Box width={BlockSize.OneThird} className="currency-input__pulsing-bar" />
    </Box>
  ) : (
    <UnitInput
      ref={inputRef}
      isDisabled={isDisabled}
      isFocusOnInput={!isDisabled}
      hideSuffix={isTokenPrimary && isLongSymbol}
      dataTestId="currency-input"
      suffix={isTokenPrimary ? primarySuffix : secondarySuffix}
      onChange={handleChange}
      value={isTokenPrimary ? tokenDecimalValue : fiatDecimalValue}
      className={className}
      actionComponent={
        isFiatAvailable && tokenToFiatConversionRate
          ? renderSwapButton()
          : undefined
      }
    >
      {renderConversionComponent()}
    </UnitInput>
  );
}

CurrencyInput.propTypes = {
  hexValue: PropTypes.string,
  isFiatPreferred: PropTypes.bool,
  onChange: PropTypes.func,
  onPreferenceToggle: PropTypes.func,
  swapIcon: PropTypes.func,
  className: PropTypes.string,
  asset: PropTypes.shape({
    address: PropTypes.string,
    symbol: PropTypes.string,
    decimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isERC721: PropTypes.bool,
  }),
  isSkeleton: PropTypes.bool,
  isMatchingUpstream: PropTypes.bool,
};
