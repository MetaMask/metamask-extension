import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'

export default class ConnectedAccountsListPermissions extends PureComponent {
  static contextTypes = {
    t: PropTypes.func.isRequired,
  }

  static defaultProps = {
    permissions: [],
  }

  static propTypes = {
    permissions: PropTypes.arrayOf(PropTypes.shape({
      key: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })),
  }

  state = {
    expanded: false,
  }

  toggleExpanded = () => {
    this.setState((prevState) => ({
      expanded: !prevState.expanded,
    }))
  }

  render () {
    const { permissions } = this.props
    const { t } = this.context
    const { expanded } = this.state

    if (permissions.length === 0) {
      return null
    }

    return (
      <div className="connected-accounts-permissions">
        <p className="connected-accounts-permissions__header" onClick={this.toggleExpanded}>
          <strong>{t('permissions')}</strong>
          <button
            className={classnames('fas', {
              'fa-angle-down': !expanded,
              'fa-angle-up': expanded,
            })}
            title={t('showPermissions')}
          />
        </p>
        <div
          className={classnames('connected-accounts-permissions__list-container', {
            'connected-accounts-permissions__list-container--expanded': expanded,
          })}
        >
          <p>{t('authorizedPermissions')}:</p>
          <ul className="connected-accounts-permissions__list">
            {permissions.map(({ key, description }) => (
              <li key={key} className="connected-accounts-permissions__list-item">
                <i className="fas fa-check-square" />&nbsp;{description}
              </li>
            ))}
          </ul>
        </div>

      </div>
    )
  }
}
