import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import Identicon from '../../../ui/identicon'
import IconWithFallBack from '../../../ui/icon-with-fallback'
import classnames from 'classnames'

export default class PermissionPageContainerContent extends PureComponent {

  static propTypes = {
    requestMetadata: PropTypes.object.isRequired,
    domainMetadata: PropTypes.object.isRequired,
    selectedPermissions: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    onPermissionToggle: PropTypes.func.isRequired,
    selectedAccount: PropTypes.object,
    redirect: PropTypes.bool,
    permissionRejected: PropTypes.bool,
  }

  static defaultProps = {
    redirect: null,
    permissionRejected: null,
    selectedAccount: {},
  }

  static contextTypes = {
    t: PropTypes.func,
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
      requestMetadata, domainMetadata, selectedAccount, redirect, permissionRejected,
    } = this.props

    return (
      <div className="permission-approval-visual">
        <section>
          <IconWithFallBack icon={domainMetadata.icon} name={domainMetadata.name} />
          { redirect ? null : <h1>{domainMetadata.name}</h1> }
          { redirect ? null : <h2>{requestMetadata.origin}</h2> }
        </section>
        { permissionRejected
          ? <span className="permission-approval-visual__reject" ><i className="fa fa-times-circle" /></span>
          : <span className="permission-approval-visual__check" />
        }
        <img className="permission-approval-visual__broken-line" src="/images/broken-line.svg" />
        <section>
          <div className="permission-approval-visual__identicon-container">
            <div className="permission-approval-visual__identicon-border">
              <Identicon
                className="permission-approval-visual__identicon"
                address={selectedAccount.address}
                diameter={54}
              />
            </div>
          </div>
          { redirect ? null : this.renderAccountInfo(selectedAccount) }
        </section>
      </div>
    )
  }

  renderRequestedPermissions () {
    const {
      selectedPermissions, permissionsDescriptions, onPermissionToggle,
    } = this.props
    const { t } = this.context

    const items = Object.keys(selectedPermissions).map((methodName) => {

      // the request will almost certainly be reject by rpc-cap if this happens
      if (!permissionsDescriptions[methodName]) {
        console.warn(`Unknown permission requested: ${methodName}`)
      }
      const description = permissionsDescriptions[methodName] || methodName
      // don't allow deselecting eth_accounts
      const isDisabled = methodName === 'eth_accounts'

      return (
        <div
          className="permission-approval-container__content__permission"
          key={methodName}
          onClick={() => {
            if (!isDisabled) {
              onPermissionToggle(methodName)
            }
          }}
        >
          { selectedPermissions[methodName]
            ? <i className="fa fa-check-circle fa-sm" />
            : <i className="fa fa-circle fa-sm" />
          }
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
    const { domainMetadata, redirect, permissionRejected } = this.props
    const { t } = this.context

    let titleArgs
    if (redirect && permissionRejected) {
      titleArgs = [ 'cancelledConnectionWithMetaMask' ]
    } else if (redirect) {
      titleArgs = [ 'connectingWithMetaMask' ]
    } else if (domainMetadata.extensionId) {
      titleArgs = [ 'externalExtension', [domainMetadata.extensionId] ]
    } else {
      titleArgs = [ 'likeToConnect', [domainMetadata.name] ]
    }

    return (
      <div
        className={classnames('permission-approval-container__content', {
          'permission-approval-container__content--redirect': redirect,
        })}
      >
        <div className="permission-approval-container__title">
          { t(...titleArgs) }
        </div>
        {this.renderPermissionApprovalVisual()}
        { !redirect
          ? (
            <section className="permission-approval-container__permissions-container">
              <div className="permission-approval-container__permissions-header">
                { domainMetadata.extensionId
                  ? t('thisWillAllowExternalExtension', [domainMetadata.extensionId])
                  : t('thisWillAllow', [domainMetadata.name])
                }
              </div>
              { this.renderRequestedPermissions() }
            </section>
          )
          : (
            <div className="permission-approval-container__permissions-header-redirect">
              { t('redirectingBackToDapp') }
            </div>
          )
        }
      </div>
    )
  }
}
