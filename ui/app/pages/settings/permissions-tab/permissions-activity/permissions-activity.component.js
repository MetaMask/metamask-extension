import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { stringify } from '../../../../helpers/utils/util'

export default class PermissionsActivity extends Component {

  static propTypes = {
    permissionsLog: PropTypes.array.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  shouldComponentUpdate (nextProps) {
    if (
      (nextProps.permissionsLog.length === 0 && this.props.permissionsLog.length === 0) ||
      nextProps.permissionsLog.length !== this.props.permissionsLog.length ||
      nextProps.permissionsLog[0].id !== this.props.permissionsLog[0].id
    ) {
      return true
    }
    return false
  }

  renderPermissionsActivityList () {
    const { permissionsLog } = this.props

    /**
     * Log Entry Shape
     * {
     *   method: request.method,
     *   methodType: 'internal' | 'restricted',
     *   request: rpcRequest,
     *   requestTime: Date.now(),
     *   response: rpcResponse,
     *   responseTime: Date.now() | null,
     *   success: true | false,
     * }
     */

    return (
      <ul>
        {
          permissionsLog.map((e, i) => {
            const date = new Date(e.requestTime)
            const dateString = date.toLocaleDateString()
            const timeString = date.toLocaleTimeString(
              [], {hour: '2-digit', minute: '2-digit'}
            )
            const methodName = (
              e.method.startsWith('wallet_')
                ? e.method.split('wallet_')[1]
                : e.method
            )
            return (
              <li key={i}>
                <details className="settings-page__content-list-details">
                  <summary>
                    {
                      `${dateString} ${timeString} | ` +
                      `${e.origin} | ${methodName}`
                    }
                    <i className="caret"></i>
                  </summary>
                  <ul>
                    {this.renderRpcResponse(e)}
                  </ul>
                </details>
              </li>
            )
          })
        }
      </ul>
    )
  }

  renderRpcResponse (e) {
    if (!e.response) return 'This request did not produce a response.'
    if (!e.success) return this.renderRpcError(e.response.error)
    if (e.methodType === 'internal') {
      if (
        e.method.endsWith('getPermissions') ||
        e.method.endsWith('requestPermissions')
      ) {
        if (e.response.result.length === 0) {
          return (
            <li className="settings-page__content-list-item">
              {'None.'}
            </li>
          )
        }
        return e.response.result.map(perm => (
          <li
            key={perm.parentCapability}
            className="settings-page__content-list-item"
          >
            {perm.parentCapability}
          </li>
        ))
      } else {
        return (
          <li className="settings-page__content-list-item">
            {stringify(e.response.result)}
          </li>
        )
      }
    } else {
      if (Array.isArray(e.response.result)) {
        if (e.response.result.length === 0) {
          return (
            <li className="settings-page__content-list-item">
              {'None.'}
            </li>
          )
        }
        return e.response.result.map((r, i) => (
          <li key={i} className="settings-page__content-list-item">
            {stringify(r)}
          </li>
        ))
      } else {
        return (
          <li className="settings-page__content-list-item">
            {stringify(e.response.result)}
          </li>
        )
      }
    }
  }

  renderRpcError (error) {
    return `Error: ${error.code}: ${error.message}`
  }

  render () {
    const { t } = this.context
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('permissionsActivitySettings') }</span>
          <span className="settings-page__content-description">
            { t('permissionsActivityDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          {
            this.props.permissionsLog && this.props.permissionsLog.length > 0
              ? this.renderPermissionsActivityList()
              : t('permissionsActivityEmpty')
          }
        </div>
      </div>
    )
  }
}
