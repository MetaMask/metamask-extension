import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class TokenListPlaceholder extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    return (
      <div className="token-list-placeholder">
        <img src="images/tokensearch.svg" />
        <div className="token-list-placeholder__text">
          {`Add the tokens you've acquired using Nifty Wallet` /* this.context.t('addAcquiredTokens')*/}
        </div>
      </div>
    )
  }
}
