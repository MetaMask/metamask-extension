import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

export default class TokenBalance extends PureComponent {
  static propTypes = {
    string: PropTypes.string,
    symbol: PropTypes.string,
    error: PropTypes.string,
    className: PropTypes.string,
    withSymbol: PropTypes.bool,
  }

  render () {
    const { className, string, withSymbol, symbol } = this.props

    return (
      <div className={classnames('hide-text-overflow', className)}>
        { string + (withSymbol ? ` ${symbol}` : '') }
      </div>
    )
  }
}
