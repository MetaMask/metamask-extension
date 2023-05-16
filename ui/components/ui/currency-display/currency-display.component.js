import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { EtherDenomination } from '../../../../shared/constants/common';
import Box from '../box/box';
import { Text } from '../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_WRAP,
} from '../../../helpers/constants/design-system';

export default function CurrencyDisplay({
  value,
  displayValue,
  'data-testid': dataTestId,
  style,
  className,
  prefix,
  prefixComponent,
  hideLabel,
  hideTitle,
  numberOfDecimals,
  denomination,
  currency,
  suffix,
  prefixComponentWrapperProps = {},
  textProps = {},
  suffixProps = {},
  boxProps = {},
}) {
  const [title, parts] = useCurrencyDisplay(value, {
    displayValue,
    prefix,
    numberOfDecimals,
    hideLabel,
    denomination,
    currency,
    suffix,
  });

  return (
    <Box
      className={classnames('currency-display-component', className)}
      data-testid={dataTestId}
      style={style}
      title={(!hideTitle && title) || null}
      display={DISPLAY.FLEX}
      alignItems={AlignItems.center}
      flexWrap={FLEX_WRAP.WRAP}
      {...boxProps}
    >
      {prefixComponent ? (
        <Box
          className="currency-display-component__prefix"
          marginInlineEnd={1}
          {...prefixComponentWrapperProps}
        >
          {prefixComponent}
        </Box>
      ) : null}
      <Text
        as="span"
        className="currency-display-component__text"
        {...textProps}
      >
        {parts.prefix}
        {parts.value}
      </Text>
      {parts.suffix ? (
        <Text
          as="span"
          className="currency-display-component__suffix"
          marginInlineStart={1}
          {...suffixProps}
        >
          {parts.suffix}
        </Text>
      ) : null}
    </Box>
  );
}

CurrencyDisplay.propTypes = {
  className: PropTypes.string,
  currency: PropTypes.string,
  'data-testid': PropTypes.string,
  denomination: PropTypes.oneOf([
    EtherDenomination.GWEI,
    EtherDenomination.ETH,
  ]),
  displayValue: PropTypes.string,
  hideLabel: PropTypes.bool,
  hideTitle: PropTypes.bool,
  numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  prefix: PropTypes.string,
  prefixComponent: PropTypes.node,
  style: PropTypes.object,
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  value: PropTypes.string,
  prefixComponentWrapperProps: PropTypes.object,
  textProps: PropTypes.object,
  suffixProps: PropTypes.object,
  boxProps: PropTypes.object,
};
