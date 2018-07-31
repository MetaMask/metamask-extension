import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import MenuBar from '../menu-bar'
import TokenViewBalance from '../token-view-balance'
// import TransactionList from '../tx-list'
import TransactionList from '../transaction-list'

export default class TokenView extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  render () {
    return (
      <div className="token-view">
        <Media
          query="(max-width: 575px)"
          render={() => <MenuBar />}
        />
        <div className="token-view__balance-wrapper">
          <TokenViewBalance />
        </div>
        <TransactionList />
      </div>
    )
  }
}
