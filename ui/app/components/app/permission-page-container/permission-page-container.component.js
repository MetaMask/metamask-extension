import PropTypes from 'prop-types'
import React, { Component } from 'react'
import deepEqual from 'fast-deep-equal'
import { PermissionPageContainerContent } from '.'
import { PageContainerFooter } from '../../ui/page-container'
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes'


export default class PermissionPageContainer extends Component {

  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedIdentity: PropTypes.object.isRequired,
    permissionsDescriptions: PropTypes.object.isRequired,
    domainMetadata: PropTypes.object.isRequired,
    request: PropTypes.object.isRequired,
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
    return Object.keys(props.request.permissions)
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
    const { request, rejectPermissionsRequest, history } = this.props
    rejectPermissionsRequest(request.metadata.id)
    history.push(DEFAULT_ROUTE)
  }

  onSubmit = () => {
    // sanity validation
    if (!this.state.selectedAccount) {
      throw new Error(
        'Fatal: no account selected'
      )
    }

    const {
      request: _request, approvePermissionsRequest, rejectPermissionsRequest,
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
      approvePermissionsRequest(request, [this.state.selectedAccount.address])
    } else {
      rejectPermissionsRequest(request.metadata.id)
    }
  }

  render () {
    const { request, permissionsDescriptions, domainMetadata, selectedIdentity, redirect } = this.props

    const requestMetadata = request.metadata

    const targetDomainMetadata = (
      domainMetadata[requestMetadata.origin] ||
      { name: requestMetadata.origin, icon: null }
    )

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
        />
        { !redirect
          ? <PageContainerFooter
            cancelButtonType="primary"
            onCancel={() => this.onCancel()}
            cancelText={this.context.t('cancel')}
            onSubmit={() => this.onSubmit()}
            submitText={this.context.t('submit')}
            submitButtonType="confirm"
            buttonSizeLarge={false}
          />
          : null
        }
      </div>
    )
  }
}
