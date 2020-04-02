import PropTypes from 'prop-types'
import React, { PureComponent } from 'react'
import Identicon from '../../../ui/identicon'
import IconWithFallBack from '../../../ui/icon-with-fallback'
import PermissionsConnectHeader from '../../permissions-connect-header'
import Tooltip from '../../../ui/tooltip-v2'
import classnames from 'classnames'

export default class PermissionPageContainerContent extends PureComponent {

  static propTypes = {
    domainMetadata: PropTypes.object.isRequired,
    selectedPermissions: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    onPermissionToggle: PropTypes.func.isRequired,
    selectedIdentities: PropTypes.array,
    allIdentitiesSelected: PropTypes.bool,
    redirect: PropTypes.bool,
    permissionRejected: PropTypes.bool,
  }

  static defaultProps = {
    redirect: null,
    permissionRejected: null,
    selectedIdentities: [],
    allIdentitiesSelected: false,
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

  getAccountDescriptor (identity) {
    return `${identity.label} (...${identity.address.slice(identity.address.length - 4)})`
  }

  renderAccountTooltip (textContent) {
    const { selectedIdentities } = this.props
    const { t } = this.context

    return (
      <Tooltip
        key="all-account-connect-tooltip"
        position="bottom"
        wrapperClassName="permission-approval-container__bold-title-elements"
        html={(
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            { selectedIdentities.slice(0, 6).map((identity, index) => {
              return (
                <div key={ `tooltip-identity-${index}` }>
                  { this.getAccountDescriptor(identity) }
                </div>
              )
            }) }
            { selectedIdentities.length > 6
              ? t('plusXMore', [ selectedIdentities.length - 6 ])
              : null
            }
          </div>
        )}
      >
        { textContent }
      </Tooltip>
    )
  }

  getTitle () {
    const { domainMetadata, redirect, permissionRejected, selectedIdentities, allIdentitiesSelected } = this.props
    const { t } = this.context

    if (redirect && permissionRejected) {
      return t('cancelledConnectionWithMetaMask')
    } else if (redirect) {
      return t('connectingWithMetaMask')
    } else if (domainMetadata.extensionId) {
      return t('externalExtension', [domainMetadata.extensionId])
    } else if (allIdentitiesSelected) {
      return t(
        'connectToAll',
        [
          (
            <span
              key="multi-account-connect-all-accounts"
              className="permission-approval-container__bold-title-elements"
            >
              { this.renderAccountTooltip(t('connectToAllAccounts')) }
            </span>
          ),
        ]
      )
    } else if (selectedIdentities.length > 1) {
      return t(
        'connectToMultiple',
        [
          this.renderAccountTooltip(t('connectToMultipleNumberOfAccounts', [ selectedIdentities.length ])),
        ]
      )
    } else {
      return t(
        'connectTo', [
          (
            <span
              key="connect-to-one-account"
              className="permission-approval-container__bold-title-elements"
            >
              { this.getAccountDescriptor(selectedIdentities[0]) }
            </span>
          ),
        ]
      )
    }
  }

  render () {
    const { domainMetadata, redirect } = this.props
    const { t } = this.context

    const title = this.getTitle()

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
                headerTitle={title}
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
