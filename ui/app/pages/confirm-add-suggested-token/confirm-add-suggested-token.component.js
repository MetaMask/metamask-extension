import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import Button from '../../components/ui/button'
import Identicon from '../../components/ui/identicon'
import TokenBalance from '../../components/ui/token-balance'

export default class ConfirmAddSuggestedToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    clearPendingTokens: PropTypes.func,
    addToken: PropTypes.func,
    pendingTokens: PropTypes.object,
    removeSuggestedTokens: PropTypes.func,
  }

  componentDidMount () {
    const { pendingTokens = {}, history } = this.props

    if (Object.keys(pendingTokens).length === 0) {
      history.push(DEFAULT_ROUTE)
    }
  }

  getTokenName (name, symbol) {
    return typeof name === 'undefined'
      ? symbol
      : `${name} (${symbol})`
  }

  render () {
    const { addToken, pendingTokens, removeSuggestedTokens, history } = this.props
    const pendingTokenKey = Object.keys(pendingTokens)[0]
    const pendingToken = pendingTokens[pendingTokenKey]

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            { this.context.t('addSuggestedTokens') }
          </div>
          <div className="page-container__subtitle">
            { this.context.t('likeToAddTokens') }
          </div>
        </div>
        <div className="page-container__content">
          <div className="confirm-add-token">
            <div className="confirm-add-token__header">
              <div className="confirm-add-token__token">
                { this.context.t('token') }
              </div>
              <div className="confirm-add-token__balance">
                { this.context.t('balance') }
              </div>
            </div>
            <div className="confirm-add-token__token-list">
              {
                Object.entries(pendingTokens)
                  .map(([ address, token ]) => {
                    const { name, symbol, image } = token

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
                            image={image}
                          />
                          <div className="confirm-add-token__name">
                            { this.getTokenName(name, symbol) }
                          </div>
                        </div>
                        <div className="confirm-add-token__balance">
                          <TokenBalance token={token} />
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>
        <div className="page-container__footer">
          <header>
            <Button
              type="default"
              large
              className="page-container__footer-button"
              onClick={() => {
                removeSuggestedTokens()
                  .then(() => history.push(DEFAULT_ROUTE))
              }}
            >
              { this.context.t('cancel') }
            </Button>
            <Button
              type="secondary"
              large
              className="page-container__footer-button"
              onClick={() => {
                addToken(pendingToken)
                  .then(() => removeSuggestedTokens())
                  .then(() => history.push(DEFAULT_ROUTE))
              }}
            >
              { this.context.t('addToken') }
            </Button>
          </header>
        </div>
      </div>
    )
  }
}
