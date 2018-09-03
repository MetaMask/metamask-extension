import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { ETH } from '../../constants/common'

export default class CurrencyDisplay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    displayValue: PropTypes.string,
    prefix: PropTypes.string,
    currency: PropTypes.oneOf([ETH]),
  }

  render () {
    const { className, displayValue, prefix } = this.props
    const text = `${prefix || ''}${displayValue}`

    return (
      <div
        className={className}
        title={text}
      >
        { text }
      </div>
    )
  }
}
