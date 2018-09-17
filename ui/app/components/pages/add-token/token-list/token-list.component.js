import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { checkExistingAddresses } from '../util'
import TokenListPlaceholder from './token-list-placeholder'
import h from 'react-hyperscript'
import Tooltip from '../../../../../../old-ui/app/components/tooltip.js'

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

  render () {
    const { results = [], selectedTokens = {}, onToggleToken, tokens = [] } = this.props

    return results.length === 0
      ? <TokenListPlaceholder />
      : (
        <div className="token-list">
          <div className="token-list__title">
            { 'searchResults' /* this.context.t('searchResults')*/ }
          </div>
          <div className="token-list__tokens-container">
            {
              Array(6).fill(undefined)
                .map((_, i) => {
                  const { logo, symbol, name, address } = results[i] || {}
                  const tokenAlreadyAdded = checkExistingAddresses(address, tokens)
                  const title = `${name} (${symbol})`
                  const isLongTitle = title.length > 28

                  const tokenRow = (key) => h(`.${classnames('token-list__token', {
                    'token-list__token--selected': selectedTokens[address],
                    'token-list__token--disabled': tokenAlreadyAdded,
                  }).split(' ').join('.')}`, {
                    onClick: () => !tokenAlreadyAdded && onToggleToken(results[i]),
                    key: key || 'tokenRow',
                  }, [
                    h('.token-list__token-icon', {
                      style: {
                        backgroundImage: logo && `url(images/contract/${logo})`,
                      },
                    }),
                    h('.token-list__token-data', [
                      h('span.token-list__token-name', title),
                    ]),
                  ])

                  return Boolean(logo || symbol || name) && (
                    isLongTitle ? h(Tooltip, {
                      position: 'top',
                      title: title,
                      key: i,
                    }, [
                      tokenRow(),
                    ]) : tokenRow(i)
                  )
                })
            }
          </div>
        </div>
      )
  }
}
