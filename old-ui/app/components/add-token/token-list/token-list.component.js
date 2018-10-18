import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { checkExistingAddresses } from '../util'
import TokenListPlaceholder from './token-list-placeholder'
import Tooltip from '../../tooltip.js'

export default class InfoBox extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    network: PropTypes.string,
    tokens: PropTypes.array,
    results: PropTypes.array,
    selectedTokens: PropTypes.object,
    onToggleToken: PropTypes.func,
  }

  render () {
    const { results = [], selectedTokens = {}, onToggleToken, tokens = [], network } = this.props
    const networkID = parseInt(network)
    const imagesFolder = networkID === 1 ? 'images/contract' : 'images/contractPOA'

    return results.length === 0
      ? <TokenListPlaceholder />
      : (
        <div className="token-list">
          <div className="token-list__tokens-container">
            {
              Array(6).fill(undefined)
                .map((_, i) => {
                  const { logo, symbol, name, address } = results[i] || {}
                  const tokenAlreadyAdded = checkExistingAddresses(address, tokens)
                  const title = `${name} (${symbol})`
                  const isLongTitle = title.length > 28

                  const tokenRow = (key) => (<div
                    className={classnames('token-list__token', {
                      'token-list__token--selected': selectedTokens[address],
                      'token-list__token--disabled': tokenAlreadyAdded,
                    })}
                    onClick={() => !tokenAlreadyAdded && onToggleToken(results[i])}
                    key={key || 'tokenRow'}>
                      <div
                        className="token-list__token-icon"
                        style={{
                          'backgroundImage': logo && `url(${imagesFolder}/${logo})`,
                        }}
                      >
                      </div>
                      <div className="token-list__token-data">
                        <span className="token-list__token-name">{title}</span>
                      </div>
                    </div>)

                  return Boolean(logo || symbol || name) && (
                    isLongTitle ? <Tooltip
                      position="top"
                      title={title}
                      key={i}
                    >
                      {tokenRow()}
                    </Tooltip> : tokenRow(i)
                  )
                })
            }
          </div>
        </div>
      )
  }
}
