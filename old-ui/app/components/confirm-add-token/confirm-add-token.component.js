import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../../ui/app/components/button'
import Identicon from '../identicon'
import TokenBalance from './token-balance'

export default class ConfirmAddToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    network: PropTypes.string,
    clearPendingTokens: PropTypes.func,
    addTokens: PropTypes.func,
    pendingTokens: PropTypes.object,
    goHome: PropTypes.func,
    showAddTokenPage: PropTypes.func,
  }

  componentDidMount () {
    const { pendingTokens = {}, goHome } = this.props

    if (Object.keys(pendingTokens).length === 0) {
      goHome()
    }
  }

  getTokenName (name, symbol) {
    return typeof name === 'undefined'
      ? symbol
      : `${name} (${symbol})`
  }

  componentWillUpdate (nextProps) {
    const { clearPendingTokens, showAddTokenPage } = this.props
    const {
      network: oldNet,
    } = this.props
    const {
      network: newNet,
    } = nextProps

    if (oldNet !== newNet) {
      clearPendingTokens()
      showAddTokenPage()
    }
  }

  render () {
    const { addTokens, clearPendingTokens, pendingTokens, goHome, showAddTokenPage, network } = this.props
    const areMultipleTokens = pendingTokens && Object.keys(pendingTokens).length > 1
    const likeToAddTokensText = areMultipleTokens ? 'Would you like to add these tokens?' : 'Would you like to add this token?'

    return (
      <div className="page-container">
        <div className="page-container__header">
          <h2 className="page-subtitle">
            { 'Add Tokens' /* this.context.t('addTokens')*/ }
          </h2>
          <p className="confirm-label">
            { likeToAddTokensText /* this.context.t('likeToAddTokens')*/ }
          </p>
        </div>
        <div className="page-container__content">
          <div className="confirm-add-token">
            <div className="confirm-add-token__header">
              <div className="confirm-add-token__token">
                { 'Token' /* this.context.t('token')*/ }
              </div>
              <div className="confirm-add-token__balance">
                { 'Balance' /* this.context.t('balance')*/ }
              </div>
            </div>
            <div className="confirm-add-token__token-list">
              {
                pendingTokens && Object.entries(pendingTokens)
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
                            network={network}
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
          <div className="page-container__footer-container">
            <Button
              type="default"
              className="btn-violet"
              onClick={() => showAddTokenPage()}
            >
              { 'Back' /* this.context.t('back')*/ }
            </Button>
            <Button
              type="primary"
              onClick={() => {
                addTokens(pendingTokens)
                  .then(() => {
                    clearPendingTokens()
                    goHome()
                  })
              }}
            >
              { 'Add Tokens' /* this.context.t('addTokens')*/ }
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
