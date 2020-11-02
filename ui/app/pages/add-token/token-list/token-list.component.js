import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { checkExistingAddresses } from '../../../helpers/utils/util'
import TokenListPlaceholder from './token-list-placeholder'

export default class InfoBox extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    tokens: PropTypes.array,
    results: PropTypes.array,
    selectedTokens: PropTypes.object,
    onToggleToken: PropTypes.func,
  }

  render() {
    const {
      results = [],
      selectedTokens = {},
      onToggleToken,
      tokens = [],
    } = this.props

    return results.length === 0 ? (
      <TokenListPlaceholder />
    ) : (
      <div className="token-list">
        <div className="token-list__title">
          {this.context.t('searchResults')}
        </div>
        <div className="token-list__tokens-container">
          {Array(6)
            .fill(undefined)
            .map((_, i) => {
              const { logo, symbol, name, address } = results[i] || {}
              const tokenAlreadyAdded = checkExistingAddresses(address, tokens)

              return (
                Boolean(logo || symbol || name) && (
                  <div
                    className={classnames('token-list__token', {
                      'token-list__token--selected': selectedTokens[address],
                      'token-list__token--disabled': tokenAlreadyAdded,
                    })}
                    onClick={() =>
                      !tokenAlreadyAdded && onToggleToken(results[i])
                    }
                    key={i}
                  >
                    <div
                      className="token-list__token-icon"
                      style={{
                        backgroundImage: logo && `url(images/contract/${logo})`,
                      }}
                    />
                    <div className="token-list__token-data">
                      <span className="token-list__token-name">{`${name} (${symbol})`}</span>
                    </div>
                  </div>
                )
              )
            })}
        </div>
      </div>
    )
  }
}
