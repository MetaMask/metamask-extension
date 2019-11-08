import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import Identicon from '../../../ui/identicon'
import AccountDropdownMini from '../../../ui/account-dropdown-mini'
import classnames from 'classnames'

export default class PermissionPageContainerContent extends PureComponent {

  static propTypes = {
    requestMetadata: PropTypes.object.isRequired,
    domainMetadata: PropTypes.object.isRequired,
    selectedPermissions: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    onPermissionToggle: PropTypes.func.isRequired,
    selectedAccount: PropTypes.object.isRequired,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  state = {
    iconError: false,
  }

  renderAccountInfo = (account) => {
    return (
      <div className="permission-approval-visual__account-info">
        <div className="permission-approval-visual__account-info__label">
          { account.label }
        </div>
        <div className="permission-approval-visual__account-info__address">
          { account.truncatedAddress }
        </div>
      </div>
    )
  }

  renderPermissionApprovalVisual = () => {
    const {
      requestMetadata, domainMetadata, selectedAccount, onAccountSelect, redirect
    } = this.props

    return (
      <div className="permission-approval-visual">
        <section>
          <div className="permission-approval-visual__identicon-container">
            <div className="permission-approval-visual__identicon-border" />
            {!this.state.iconError && domainMetadata.icon ? (
              <img
                className="permission-approval-visual__identicon"
                src={domainMetadata.icon}
                onError={() => this.setState({ iconError: true })}
              />
            ) : (
              <i className="permission-approval-visual__identicon--default">
                {domainMetadata.name.charAt(0).toUpperCase()}
              </i>
            )}
          </div>
          { redirect ? null : <h1>{domainMetadata.name}</h1> }
          { redirect ? null : <h2>{requestMetadata.origin}</h2> }
        </section>
        <span className="permission-approval-visual__check" />
        <img className="permission-approval-visual__broken-line" src="/images/broken-line.svg" />
        <section>
          <div className="permission-approval-visual__identicon-container">
            <div className="permission-approval-visual__identicon-border" />
            <Identicon
              className="permission-approval-visual__identicon"
              address={selectedAccount.address}
              diameter={54}
            />
          </div>
          { redirect ? null : this.renderAccountInfo(selectedAccount) }
        </section>
      </div>
    )
  }

  renderRequestedPermissions () {
    const {
      onPermissionToggle, selectedPermissions, permissionsDescriptions,
    } = this.props
    const { t } = this.context

    const items = Object.keys(selectedPermissions).map((methodName) => {

      // the request will almost certainly be reject by rpc-cap if this happens
      if (!permissionsDescriptions[methodName]) {
        console.warn(`Unknown permission requested: ${methodName}`)
      }
      const description = permissionsDescriptions[methodName] || methodName

      return (
        <div className="permission-approval-container__content__permission" key={methodName}>
          <i className="fa fa-check-circle fa-sm" />
          <label>{description}</label>
        </div>
      )
    })

    return (
      <div className="permission-approval-container__content__requested">
        {items}
        <div className="permission-approval-container__content__revoke-note">{ t('revokeInPermissions') }</div>
      </div>
    )
  }

  render () {
    const { domainMetadata, redirect } = this.props
    const { t } = this.context

    return (
      <div className={classnames('permission-approval-container__content', {
        'permission-approval-container__content--redirect': redirect,
      })}>
        <div className="permission-approval-container__title">
          { redirect ? t('connectingWithMetaMask') : t('likeToConnect', [domainMetadata.name]) }
        </div>
        {this.renderPermissionApprovalVisual()}
        { !redirect
          ? <section className="permission-approval-container__permissions-container">
            <div className="permission-approval-container__permissions-header">
              { t('thisWillAllow', [domainMetadata.name]) }
            </div>
            { this.renderRequestedPermissions() }
          </section>
          : <div className="permission-approval-container__permissions-header-redirect">
            { t('redirectingBackToDapp') }
          </div>
        }
      </div>
    )
  }
}
