import React, { Component } from 'react'
import PropTypes from 'prop-types'
import deepEqual from 'fast-deep-equal'
import Button from '../../../../components/ui/button'

import { addressSlicer, isValidAddress, stringify } from '../../../../helpers/utils/util'

export default class PermissionsList extends Component {

  static propTypes = {
    permissions: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    removePermissionsFor: PropTypes.func.isRequired,
    siteMetadata: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  constructor (props) {
    super(props)
    this.state = {
      ...this.getPermissionsState(props),
      // domains: {
      //   [name]: {
      //     selected: boolean,
      //     permissions: [ id1, id2, ... ]
      //   }
      // },
      // permissions: {
      //   [id]: {
      //     domain: name,
      //     methodname: methodname,
      //     selected: boolean,
      //   }
      // }
    }
  }

  componentDidUpdate () {
    const newState = this.getPermissionsState(this.props)
    // if permissions have been added or removed, reset state
    // does not take caveat changes into account, but we don't yet allow them
    // to change after creation
    if (!deepEqual(
      Object.keys(this.state.permissions), Object.keys(newState.permissions))
    ) {
      this.setState(newState)
    }
  }

  getPermissionsState (props) {
    const { permissions } = props
    return Object.keys(permissions).reduce((acc, domain) => {
      permissions[domain].permissions.forEach(perm => {
        if (!acc.domains[domain]) {
          acc.domains[domain] = {
            permissions: [perm.id],
            selected: true,
            iconError: false,
          }
        } else {
          acc.domains[domain].permissions.push(perm.id)
        }
        acc.permissions[perm.id] = {
          domain,
          methodName: perm.parentCapability,
          selected: true,
        }
      })
      return acc
    }, { domains: {}, permissions: {} })
  }

  onDomainToggle = domain => () => {
    const permissions = { ...this.state.permissions }
    const selected = !this.state.domains[domain].selected
    this.state.domains[domain].permissions.forEach(id => {
      permissions[id].selected = selected
    })
    this.setState({
      domains: {
        ...this.state.domains,
        [domain]: {
          ...this.state.domains[domain],
          selected,
        },
      },
      permissions,
    })
  }

  onPermissionToggle = id => () => {
    const perm = { ...this.state.permissions[id] }
    perm.selected = !perm.selected
    const newState = {
      permissions: {
        ...this.state.permissions,
        [id]: perm,
      },
    }
    if (perm.selected && !this.state.domains[perm.domain].selected) {
      const domains = { ...this.state.domains }
      domains[perm.domain].selected = perm.selected
      newState.domains = domains
    }
    this.setState(newState)
  }

  onIconError = domain => () => {
    this.setState({
      domains: {
        ...this.state.domains,
        [domain]: {
          ...this.state.domains[domain],
          iconError: true,
        },
      },
    })
  }

  updatePermissions () {
    this.props.removePermissionsFor(
      Object.values(this.state.permissions).reduce((acc, permState) => {
        if (!permState.selected) {
          if (!acc[permState.domain]) acc[permState.domain] = []
          acc[permState.domain].push(permState.methodName)
        }
        return acc
      }, {})
    )
  }

  renderPermissionsList () {
    const { permissions, permissionsDescriptions, siteMetadata } = this.props
    return (
      <ul>
        {
          Object.keys(permissions).sort().map(domain => {
            if (
              permissions[domain].permissions.length === 0 ||
              !this.state.domains[domain] // state may lag behind props slightly
            ) return null
            // TODO: these elements look like trash and their CSS is placeholder only
            return (
              <li key={domain}>
                <details className="settings-page__content-list-details">
                  <summary>
                    <input
                      type="checkbox"
                      checked={this.state.domains[domain].selected}
                      onChange={this.onDomainToggle(domain)}
                      className="settings-page__content-list-checkbox"
                    />
                    {
                      !this.state.domains[domain].iconError &&
                      siteMetadata[domain].icon ? (
                          <img
                            className="settings-page__content-list-identicon"
                            src={siteMetadata[domain].icon}
                            onError={this.onIconError(domain)}
                          />
                        ) : (
                          <i className="settings-page__content-list-indenticon--default">
                            {siteMetadata[domain].name.charAt(0).toUpperCase()}
                          </i>
                        )
                    }
                    {domain}
                    <i className="caret"></i>
                  </summary>
                  <ul>
                    {
                      permissions[domain].permissions
                        .sort((a, b) => a.parentCapability.localeCompare(b.parentCapability))
                        .map(perm => {
                          return this.renderPermissionsListItem(
                            perm, permissionsDescriptions[perm.parentCapability]
                          )
                        })
                    }
                  </ul>
                </details>
              </li>
            )
          })
        }
      </ul>
    )
  }

  renderPermissionsListItem (permission, description) {
    return (
      <li key={permission.id} className="settings-page__content-list-item">
        <input
          type="checkbox"
          checked={this.state.permissions[permission.id].selected}
          onChange={this.onPermissionToggle(permission.id)}
          className="settings-page__content-list-checkbox"
        />
        <label>{description || permission.parentCapability}</label>
        {
          permission.caveats && permission.caveats.length > 0
            ? this.renderCaveatList(permission)
            : null
        }
      </li>
    )
  }

  renderCaveatList (permission) {
    const { t } = this.context
    return (
      <ul>
        {
          permission.caveats.map((caveat, i) => (
            <li key={i} className="settings-page__content-list-item__nested">
              {t('caveat_' + caveat.type)}
              {this.renderCaveatValue(caveat.value)}
            </li>
          ))
        }
      </ul>
    )
  }

  renderCaveatValue (value) {
    if (Array.isArray(value)) {
      return (
        <ul>
          {
            value.map((v, i) => (
              <li
                key={i}
                className="settings-page__content-list-item__nested__nested"
              >
                {
                  typeof v === 'string' && isValidAddress(v)
                    ? addressSlicer(v)
                    : typeof v !== 'object'
                      ? v
                      : stringify(v)
                }
              </li>
            ))
          }
        </ul>
      )
    } else if (typeof value !== 'object') {
      return value
    } else {
      return stringify(value)
    }
  }

  render () {
    const { t } = this.context
    const hasPermissions = Object.keys(this.props.permissions).length > 0
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ t('permissionsSettings') }</span>
          <span className="settings-page__content-description">
            { t('permissionsDescription') }
          </span>
        </div>
        <div className="settings-page__content-item">
          {
            hasPermissions
              ? this.renderPermissionsList()
              : t('permissionsEmpty')
          }
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="warning"
              large
              className="settings-tab__button--orange"
              disabled={!hasPermissions}
              onClick={event => {
                event.preventDefault()
                this.updatePermissions()
              }}
            >
              { t('updatePermissions') }
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
