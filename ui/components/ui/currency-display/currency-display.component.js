import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { EtherDenomination } from '../../../../shared/constants/common';
import { Text, Box } from '../../component-library';
import {
  AlignItems,
  Display,
  FlexWrap,
  TextVariant,
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
  ...props
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
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      {...props}
    >
      {prefixComponent ? (
        <Box
          className="currency-display-component__prefix"
          marginInlineEnd={1}
          variant={TextVariant.inherit}
          {...prefixComponentWrapperProps}
        >
          {prefixComponent}
        </Box>
      ) : null}
      <Text
        as="span"
        className="currency-display-component__text"
        ellipsis
        variant={TextVariant.inherit}
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
          variant={TextVariant.inherit}
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
};
