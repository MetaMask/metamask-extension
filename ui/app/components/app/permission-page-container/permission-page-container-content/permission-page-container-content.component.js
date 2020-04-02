import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import Identicon from '../../../ui/identicon'
import IconWithFallBack from '../../../ui/icon-with-fallback'
import PermissionsConnectHeader from '../../permissions-connect-header'
import classnames from 'classnames'

export default class PermissionPageContainerContent extends PureComponent {

  static propTypes = {
    domainMetadata: PropTypes.object.isRequired,
    selectedPermissions: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    onPermissionToggle: PropTypes.func.isRequired,
    selectedIdentities: PropTypes.array,
    redirect: PropTypes.bool,
    permissionRejected: PropTypes.bool,
  }

  static defaultProps = {
    redirect: null,
    permissionRejected: null,
    selectedIdentities: [],
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  renderRedirect () {
    const { t } = this.context
    const { permissionRejected, selectedIdentities, domainMetadata } = this.props
    return (
      <div className="permission-result">
        { permissionRejected ? t('cancelling') : t('connecting') }
        <div className="permission-result__icons">
          <IconWithFallBack icon={domainMetadata.icon} name={domainMetadata.name} />
          <div className="permission-result__center-icon">
            { permissionRejected
              ? <span className="permission-result__reject" ><i className="fa fa-times-circle" /></span>
              : <span className="permission-result__check" />
            }
            <img className="permission-result__broken-line" src="/images/broken-line.svg" />
          </div>
          <div className="permission-result__identicon-container">
            <div className="permission-result__identicon-border">
              <Identicon
                className="permission-result__identicon"
                address={selectedIdentities[0].address}
                diameter={54}
              />
            </div>
          </div>
        </div>
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
            ? <i title={t('permissionCheckedIconDescription')} className="fa fa-check-square" />
            : <i title={t('permissionUncheckedIconDescription')} className="fa fa-square" />
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
    const { domainMetadata, redirect, permissionRejected, selectedIdentities } = this.props
    const { t } = this.context

    let titleArgs
    if (redirect && permissionRejected) {
      titleArgs = [ 'cancelledConnectionWithMetaMask' ]
    } else if (redirect) {
      titleArgs = [ 'connectingWithMetaMask' ]
    } else if (domainMetadata.extensionId) {
      titleArgs = [ 'externalExtension', [domainMetadata.extensionId] ]
    } else if (selectedIdentities.length > 1) {
      titleArgs = ['connectToMultiple', [ selectedIdentities.length ] ]
    } else {
      titleArgs = [
        'connectTo', [
          `${selectedIdentities[0].label} (...${selectedIdentities[0].address.slice(selectedIdentities[0].address.length - 4)})`,
        ],
      ]
    }

    return (
      <div
        className={classnames('permission-approval-container__content', {
          'permission-approval-container__content--redirect': redirect,
        })}
      >
        { !redirect
          ? (
            <div>
              <PermissionsConnectHeader
                icon={domainMetadata.icon}
                iconName={domainMetadata.origin}
                headerTitle={t(...titleArgs)}
                headerText={ domainMetadata.extensionId
                  ? t('thisWillAllowExternalExtension', [domainMetadata.extensionId])
                  : t('thisWillAllow', [domainMetadata.origin])
                }
              />
              <section className="permission-approval-container__permissions-container">
                { this.renderRequestedPermissions() }
              </section>
            </div>
          )
          : this.renderRedirect()
        }
      </div>
    )
  }
}
