import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { GWEI } from '../../../helpers/constants/common'

export default class CurrencyDisplay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    displayValue: PropTypes.string,
    prefix: PropTypes.string,
    prefixComponent: PropTypes.node,
    style: PropTypes.object,
    suffix: PropTypes.string,
    // Used in container
    currency: PropTypes.string,
    denomination: PropTypes.oneOf([GWEI]),
    value: PropTypes.string,
    numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hideLabel: PropTypes.bool,
    hideTitle: PropTypes.bool,
  }

  render () {
    const { className, displayValue, prefix, prefixComponent, style, suffix, hideTitle } = this.props
    const text = `${prefix || ''}${displayValue}`
    const title = suffix ? `${text} ${suffix}` : text

    return (
      <div
        className={classnames('currency-display-component', className)}
        style={style}
        title={!hideTitle && title || null}
      >
        { prefixComponent }
        <span className="currency-display-component__text">{ text }</span>
        {
          suffix && (
            <span className="currency-display-component__suffix">
              { suffix }
            </span>
          )
        }
      </div>
    )
  }
}
