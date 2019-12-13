import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Button from '../../../components/ui/button'
import PermissionsList from './permissions-list'
import PermissionsActivity from './permissions-activity'
import PermissionsHistory from './permissions-history'

export default class PermissionsTab extends Component {

  static propTypes = {
    warning: PropTypes.string,
    permissions: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    permissionsHistory: PropTypes.object.isRequired,
    permissionsLog: PropTypes.array.isRequired,
    removePermissionsFor: PropTypes.func.isRequired,
    showClearPermissionsModal: PropTypes.func.isRequired,
    showClearPermissionsActivityModal: PropTypes.func.isRequired,
    showClearPermissionsHistoryModal: PropTypes.func.isRequired,
    siteMetadata: PropTypes.object,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderClearButton (mainMessage, descriptionMessage, clickHandler, isDisabled) {
    return (
      <div className="settings-page__content-row">
        <div className="settings-page__content-item">
          <span>{ mainMessage }</span>
          <span className="settings-page__content-description">
            { descriptionMessage }
          </span>
        </div>
        <div className="settings-page__content-item">
          <div className="settings-page__content-item-col">
            <Button
              type="warning"
              large
              className="settings-tab__button--orange"
              disabled={isDisabled}
              onClick={event => {
                event.preventDefault()
                clickHandler()
              }}
            >
              { mainMessage }
            </Button>
          </div>
        </div>
      </div>
    )
  }

  render () {
    const { t } = this.context
    const { warning } = this.props
    const hasPermissions = Object.keys(this.props.permissions).length > 0
    const hasPermissionsActivity = this.props.permissionsLog.length > 0
    const hasPermissionsHistory = Object.keys(this.props.permissionsHistory).length > 0

    return (
      <div className="settings-page__body">
        { warning && <div className="settings-tab__error">{ warning }</div> }
        <PermissionsList
          permissions={this.props.permissions}
          permissionsDescriptions={this.props.permissionsDescriptions}
          removePermissionsFor={this.props.removePermissionsFor}
          siteMetadata={this.props.siteMetadata}
        />
        {
          this.renderClearButton(
            t('clearPermissions'),
            t('clearPermissionsDescription'),
            this.props.showClearPermissionsModal,
            !hasPermissions
          )
        }
        <PermissionsHistory
          permissionsHistory={this.props.permissionsHistory}
        />
        {
          this.renderClearButton(
            t('clearPermissionsHistory'),
            t('clearPermissionsHistoryDescription'),
            this.props.showClearPermissionsHistoryModal,
            !hasPermissionsHistory
          )
        }
        <PermissionsActivity
          permissionsLog={this.props.permissionsLog}
        />
        {
          this.renderClearButton(
            t('clearPermissionsActivity'),
            t('clearPermissionsActivityDescription'),
            this.props.showClearPermissionsActivityModal,
            !hasPermissionsActivity
          )
        }
      </div>
    )
  }
}
