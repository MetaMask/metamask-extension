import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { EtherDenomination } from '../../../../shared/constants/common';
import { SensitiveText, Box } from '../../component-library';
import {
  AlignItems,
  Display,
  FlexWrap,
  TextVariant,
} from '../../../helpers/constants/design-system';

/* eslint-disable jsdoc/require-param-name */
// eslint-disable-next-line jsdoc/require-param
/** @param {PropTypes.InferProps<typeof CurrencyDisplayPropTypes>>} */
export default function CurrencyDisplay({
  account,
  value,
  displayValue,
  'data-testid': dataTestId,
  style,
  className,
  prefix,
  hideLabel,
  hideTitle,
  numberOfDecimals,
  denomination,
  currency,
  suffix,
  textProps = {},
  suffixProps = {},
  isAggregatedFiatOverviewBalance = false,
  privacyMode = false,
  onClick,
  ...props
}) {
  const [title, parts] = useCurrencyDisplay(value, {
    account,
    displayValue,
    prefix,
    numberOfDecimals,
    hideLabel,
    denomination,
    currency,
    suffix,
    isAggregatedFiatOverviewBalance,
  });

  return (
    <Box
      className={classnames('currency-display-component', className)}
      data-testid={dataTestId}
      style={style}
      title={(!hideTitle && !privacyMode && title) || null}
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexWrap={FlexWrap.Wrap}
      {...props}
    >
      <SensitiveText
        as="span"
        className="currency-display-component__text"
        ellipsis
        variant={TextVariant.inherit}
        isHidden={privacyMode}
        data-testid="account-value-and-suffix"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-text-alternative)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-default)';
        }}
        {...textProps}
      >
        {parts.prefix}
        {parts.value}
      </SensitiveText>
      {parts.suffix ? (
        <SensitiveText
          as="span"
          className={
            privacyMode
              ? 'currency-display-component__text'
              : 'currency-display-component__suffix'
          }
          marginInlineStart={privacyMode ? 0 : 1}
          variant={TextVariant.inherit}
          isHidden={privacyMode}
          onClick={onClick}
          style={{
            cursor: 'pointer',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-text-alternative)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-default)';
          }}
          {...suffixProps}
        >
          {parts.suffix}
        </SensitiveText>
      ) : null}
    </Box>
  );
}

const CurrencyDisplayPropTypes = {
  className: PropTypes.string,
  account: PropTypes.object,
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
  style: PropTypes.object,
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  value: PropTypes.string,
  textProps: PropTypes.object,
  suffixProps: PropTypes.object,
  isAggregatedFiatOverviewBalance: PropTypes.bool,
  privacyMode: PropTypes.bool,
  onClick: PropTypes.func,
};

CurrencyDisplay.propTypes = CurrencyDisplayPropTypes;
