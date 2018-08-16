import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

export default class CurrencyDisplay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    displayValue: PropTypes.string,
    prefix: PropTypes.string,
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
