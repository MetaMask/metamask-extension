import PropTypes from 'prop-types'
import React, { Component } from 'react'
import deepEqual from 'fast-deep-equal'
import { PermissionPageContainerContent } from '.'
import { PageContainerFooter } from '../../ui/page-container'

export default class PermissionPageContainer extends Component {

  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object,
    permissionsDescriptions: PropTypes.object.isRequired,
    request: PropTypes.object,
    redirect: PropTypes.bool,
    permissionRejected: PropTypes.bool,
    requestMetadata: PropTypes.object,
    targetDomainMetadata: PropTypes.object.isRequired,
  };

  static defaultProps = {
    redirect: null,
    permissionRejected: null,
    request: {},
    requestMetadata: {},
    selectedIdentity: {},
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  state = {
    selectedPermissions: this.getRequestedMethodState(
      this.getRequestedMethodNames(this.props)
    ),
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
    return Object.keys(props.request.permissions || {})
  }

  onPermissionToggle = methodName => {
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
        name: 'Tab Opened',
      },
    })
  }

  onCancel = () => {
    const { request, rejectPermissionsRequest } = this.props
    rejectPermissionsRequest(request.metadata.id)
  }

  onSubmit = () => {
    const {
      request: _request, approvePermissionsRequest, rejectPermissionsRequest, selectedIdentity,
    } = this.props

    const request = {
      ..._request,
      permissions: { ..._request.permissions },
    }

    Object.keys(this.state.selectedPermissions).forEach(key => {
      if (!this.state.selectedPermissions[key]) {
        delete request.permissions[key]
      }
    })

    if (Object.keys(request.permissions).length > 0) {
      approvePermissionsRequest(request, [selectedIdentity.address])
    } else {
      rejectPermissionsRequest(request.metadata.id)
    }
  }

  render () {
    const {
      requestMetadata,
      targetDomainMetadata,
      permissionsDescriptions,
      selectedIdentity,
      redirect,
      permissionRejected,
    } = this.props

    return (
      <div className="page-container permission-approval-container">
        <PermissionPageContainerContent
          requestMetadata={requestMetadata}
          domainMetadata={targetDomainMetadata}
          selectedPermissions={this.state.selectedPermissions}
          permissionsDescriptions={permissionsDescriptions}
          onPermissionToggle={this.onPermissionToggle}
          selectedAccount={selectedIdentity}
          redirect={redirect}
          permissionRejected={permissionRejected}
        />
        { !redirect
          ? (
            <PageContainerFooter
              cancelButtonType="primary"
              onCancel={() => this.onCancel()}
              cancelText={this.context.t('cancel')}
              onSubmit={() => this.onSubmit()}
              submitText={this.context.t('submit')}
              submitButtonType="confirm"
              buttonSizeLarge={false}
            />
          )
          : null
        }
      </div>
    )
  }
}
