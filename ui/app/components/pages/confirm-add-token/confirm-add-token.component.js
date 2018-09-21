import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { DEFAULT_ROUTE, ADD_TOKEN_ROUTE } from '../../../routes'
import Button from '../../button'
import Identicon from '../../identicon'
import TokenBalance from '../../token-balance'

export default class ConfirmAddToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    clearPendingTokens: PropTypes.func,
    addTokens: PropTypes.func,
    pendingTokens: PropTypes.object,
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
    const { history, addTokens, clearPendingTokens, pendingTokens } = this.props

    return (
      <div className="page-container">
        <div className="page-container__header">
          <div className="page-container__title">
            { this.context.t('addTokens') }
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
          <Button
            type="default"
            large
            className="page-container__footer-button"
            onClick={() => history.push(ADD_TOKEN_ROUTE)}
          >
            { this.context.t('back') }
          </Button>
          <Button
            type="primary"
            large
            className="page-container__footer-button"
            onClick={() => {
              addTokens(pendingTokens)
                .then(() => {
                  clearPendingTokens()
                  history.push(DEFAULT_ROUTE)
                })
            }}
          >
            { this.context.t('addTokens') }
          </Button>
        </div>
      </div>
    )
  }
}
