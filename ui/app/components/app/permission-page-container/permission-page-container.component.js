import PropTypes from 'prop-types'
import React, { Component } from 'react'
import deepEqual from 'fast-deep-equal'
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

  componentDidUpdate () {
    const newMethodNames = this.getRequestedMethodNames(this.props)

    if (!deepEqual(Object.keys(this.state.selectedPermissions), newMethodNames)) {
      // this should be a new request, so just overwrite
      this.setState({
        selectedPermissions: this.getRequestedMethodState(newMethodNames),
      })
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
    const { requests, rejectPermissionsRequest } = this.props
    rejectPermissionsRequest(requests[0].metadata.id)
  }

  onSubmit = () => {

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

    // TODO:lps:review do we have any concerns about caveat creation occuring
    // here? perhaps we should have a factory method somewhere else?
    if ('eth_accounts' in request.permissions) {
      if (!request.permissions.eth_accounts.caveats) {
        request.permissions.eth_accounts.caveats = []
      }
      request.permissions.eth_accounts.caveats.push(
        {
          type: 'filterResponse',
          value: [this.state.selectedAccount.address],
        },
      )
    }

    if (Object.keys(request.permissions).length > 0) {
      approvePermissionsRequest(request)
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
