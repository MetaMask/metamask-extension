import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { ETH, GWEI } from '../../constants/common'

export default class CurrencyDisplay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    displayValue: PropTypes.string,
    prefix: PropTypes.string,
    style: PropTypes.object,
    // Used in container
    currency: PropTypes.oneOf([ETH]),
    denomination: PropTypes.oneOf([GWEI]),
    value: PropTypes.string,
    numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hideLabel: PropTypes.bool,
  }

  render () {
    const { className, displayValue, prefix, style } = this.props
    const text = `${prefix || ''}${displayValue}`

    return (
      <div
        className={classnames('currency-display-component', className)}
        style={style}
        title={text}
      >
        { text }
      </div>
    )
  }
}
