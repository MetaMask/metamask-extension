import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { checkExistingAddresses } from '../util'
import Layer2AppListPlaceholder from './layer2App-list-placeholder'

export default class InfoBox extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    layer2Apps: PropTypes.array,
    results: PropTypes.array,
    selectedTokens: PropTypes.object,
    onToggleLayer2App: PropTypes.func,
  }

  render () {
    const { results = [], selectedLayer2Apps = {}, onToggleLayer2App, layer2Apps = [] } = this.props

    return results.length === 0
      ? <Layer2AppListPlaceholder />
      : (
        <div className="layer2App-list">
          <div className="layer2App-list__title">
            { this.context.t('searchResults') }
          </div>
          <div className="layer2App-list__layer2Apps-container">
            {
              Array(6).fill(undefined)
                .map((_, i) => {
                  const { logo, symbol, name, address } = results[i] || {}
                  const layer2AppAlreadyAdded = checkExistingAddresses(address, layer2Apps)

                  return Boolean(logo || symbol || name) && (
                    <div
                      className={classnames('layer2App-list__layer2App', {
                        'layer2App-list__layer2App--selected': selectedLayer2Apps[address],
                        'layer2App-list__layer2App--disabled': layer2AppAlreadyAdded,
                      })}
                      onClick={() => !layer2AppAlreadyAdded && onToggleLayer2App(results[i])}
                      key={i}
                    >
                      <div
                        className="layer2App-list__layer2App-icon"
                        style={{ backgroundImage: logo && `url(images/contract/${logo})` }}>
                      </div>
                      <div className="layer2App-list__layer2App-data">
                        <span className="layer2App-list__layer2App-name">{ `${name} (${symbol})` }</span>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      )
  }
}
