import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { ASSET_ROUTE, ADD_TOKEN_ROUTE } from '../../helpers/constants/routes'
import Button from '../../components/ui/button'
import Identicon from '../../components/ui/identicon'
import TokenBalance from '../../components/ui/token-balance'

export default class ConfirmAddToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    clearPendingTokens: PropTypes.func,
    addTokens: PropTypes.func,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    pendingTokens: PropTypes.object,
  }

  componentDidMount() {
    const { mostRecentOverviewPage, pendingTokens = {}, history } = this.props

    if (Object.keys(pendingTokens).length === 0) {
      history.push(mostRecentOverviewPage)
    }
  }

  getTokenName(name, symbol) {
    return typeof name === 'undefined' ? symbol : `${name} (${symbol})`
  }

  render() {
    const {
      history,
      addTokens,
      clearPendingTokens,
      mostRecentOverviewPage,
      pendingTokens,
    } = this.props

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            {this.context.t('addTokens')}
          </div>
          <div className="page-container__subtitle">
            {this.context.t('likeToAddTokens')}
          </div>
        </div>
        <div className="page-container__content">
          <div className="confirm-add-token">
            <div className="confirm-add-token__header">
              <div className="confirm-add-token__token">
                {this.context.t('token')}
              </div>
              <div className="confirm-add-token__balance">
                {this.context.t('balance')}
              </div>
            </div>
            <div className="confirm-add-token__token-list">
              {Object.entries(pendingTokens).map(([address, token]) => {
                const { name, symbol } = token

                return (
                  <div
                    className="confirm-add-token__token-list-item"
                    key={address}
                  >
                    <div className="confirm-add-token__token confirm-add-token__data">
                      <Identicon
                        className="confirm-add-token__token-icon"
                        diameter={48}
                        address={address}
                      />
                      <div className="confirm-add-token__name">
                        {this.getTokenName(name, symbol)}
                      </div>
                    </div>
                    <div className="confirm-add-token__balance">
                      <TokenBalance token={token} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="page-container__footer">
          <footer>
            <Button
              type="default"
              large
              className="page-container__footer-button"
              onClick={() => history.push(ADD_TOKEN_ROUTE)}
            >
              {this.context.t('back')}
            </Button>
            <Button
              type="secondary"
              large
              className="page-container__footer-button"
              onClick={() => {
                addTokens(pendingTokens).then(() => {
                  clearPendingTokens()
                  const firstTokenAddress = Object.values(
                    pendingTokens,
                  )?.[0].address?.toLowerCase()
                  if (firstTokenAddress) {
                    history.push(`${ASSET_ROUTE}/${firstTokenAddress}`)
                  } else {
                    history.push(mostRecentOverviewPage)
                  }
                })
              }}
            >
              {this.context.t('addTokens')}
            </Button>
          </footer>
        </div>
      </div>
    )
  }
}
