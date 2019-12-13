import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { PermissionPageContainerContent, PermissionPageContainerHeader } from '.'
import { PageContainerFooter } from '../../ui/page-container'

export default class PermissionPageContainer extends Component {

  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    siteMetadata: PropTypes.object.isRequired,
    requests: PropTypes.array.isRequired,
    showLoadingIndication: PropTypes.func.isRequired,
    hideLoadingIndication: PropTypes.func.isRequired,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  constructor (props) {
    super(props)
    this.state = {
      selectedPermissions: this.getRequestedMethodState(
        this.getRequestedMethodNames(props)
      ),
      selectedAccount: props.selectedIdentity,
    }
  }

  componentDidUpdate (prevProps) {

    const prevRequest = prevProps.requests[0]
    const request = this.props.requests[0]

    if (
      prevRequest && request &&
      prevRequest.metadata.id !== request.metadata.id
    ) {
      const newMethodNames = this.getRequestedMethodNames(this.props)
      // this is a new request, so just overwrite
      this.setState({
        selectedPermissions: this.getRequestedMethodState(newMethodNames),
      })
      this.props.hideLoadingIndication()
    }
  }

  getRequestedMethodState (methodNames) {
    return methodNames.reduce(
      (acc, methodName) => {
        acc[methodName] = true
        return acc
      },
      {}
    )
  }

  getRequestedMethodNames (props) {
    return Object.keys(props.requests[0].permissions)
  }

  onPermissionToggle = methodName => () => {
    this.setState({
      selectedPermissions: {
        ...this.state.selectedPermissions,
        [methodName]: !this.state.selectedPermissions[methodName],
      },
    })
  }

  componentDidMount () {
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Popup Opened',
      },
    })
  }

  onCancel = () => {
    this.props.showLoadingIndication()
    const { requests, rejectPermissionsRequest } = this.props
    rejectPermissionsRequest(requests[0].metadata.id)
  }

  onSubmit = () => {

    this.props.showLoadingIndication()

    // sanity validation
    if (!this.state.selectedAccount) {
      throw new Error(
        'Fatal: no account selected'
      )
    }

    const {
      requests, approvePermissionsRequest, rejectPermissionsRequest,
    } = this.props
    const request = {
      ...requests[0],
      permissions: { ...requests[0].permissions },
    }
    Object.keys(this.state.selectedPermissions).forEach(key => {
      if (!this.state.selectedPermissions[key]) {
        delete request.permissions[key]
      }
    })

    let accounts = null
    if ('eth_accounts' in request.permissions) {
      accounts = [this.state.selectedAccount.address]
    }

    if (Object.keys(request.permissions).length > 0) {
      approvePermissionsRequest(request, accounts)
    } else {
      rejectPermissionsRequest(request.metadata.id)
    }
  }

  onAccountSelect = selectedAccount => {
    this.setState({ selectedAccount })
  }

  render () {
    const { requests, permissionsDescriptions, siteMetadata } = this.props
    console.log('permission-page-container requests', requests)

    const requestMetadata = requests[0].metadata

    const targetSiteMetadata = (
      siteMetadata[requestMetadata.origin] ||
      { name: requestMetadata.origin, icon: null }
    )

    return (
      <div className="page-container permission-approval-container">
        <PermissionPageContainerHeader />
        <PermissionPageContainerContent
          requestMetadata={requestMetadata}
          siteMetadata={targetSiteMetadata}
          selectedPermissions={this.state.selectedPermissions}
          permissionsDescriptions={permissionsDescriptions}
          onPermissionToggle={this.onPermissionToggle}
          onAccountSelect={this.onAccountSelect}
          selectedAccount={this.state.selectedAccount}
        />
        <PageContainerFooter
          onCancel={() => this.onCancel()}
          cancelText={this.context.t('cancel')}
          onSubmit={() => this.onSubmit()}
          submitText={this.context.t('submit')}
          submitButtonType="confirm"
        />
      </div>
    )
  }
}
