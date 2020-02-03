import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import availableCurrencies from '../../../helpers/constants/available-conversions'

const currencies = availableCurrencies.map(({ code }) => code)

export default class CurrencyDisplay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    displayValue: PropTypes.string,
    prefix: PropTypes.string,
    prefixComponent: PropTypes.node,
    style: PropTypes.object,
    suffix: PropTypes.string,
    hideTitle: PropTypes.bool,
  }

  render () {
    const {
      className,
      displayValue,
      prefix,
      prefixComponent,
      style,
      hideTitle,
    } = this.props
    let suffix
    if (this.props.suffix) {
      suffix =
        this.props.suffix.toLowerCase() === 'eth' ? 'CFX' : this.props.suffix
    }
    const text = `${prefix || ''}${displayValue}`
    const title = suffix ? `${text} ${suffix}` : text

    let currencyDisplayClass = 'currency-display-component'

    if (isNaN(parseInt(title[0]))) {
      currencyDisplayClass =
        'currency-display-component currency-display-component-hide'
    }

    if (suffix && currencies.includes(suffix.toLowerCase())) {
      currencyDisplayClass =
        'currency-display-component currency-display-component-hide'
    }

    return (
      <div
        className={classnames(currencyDisplayClass, className)}
        style={style}
        title={(!hideTitle && title) || null}
      >
        {prefixComponent}
        <span className="currency-display-component__text">{text}</span>
        {suffix && (
          <span className="currency-display-component__suffix">{suffix}</span>
        )}
      </div>
    )
  }
}
