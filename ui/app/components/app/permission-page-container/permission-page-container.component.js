import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { isEqual } from 'lodash';
import { PageContainerFooter } from '../../ui/page-container';
import PermissionsConnectFooter from '../permissions-connect-footer';
import { PermissionPageContainerContent } from '.';

export default class PermissionPageContainer extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedIdentities: PropTypes.array,
    allIdentitiesSelected: PropTypes.bool,
    request: PropTypes.object,
    requestMetadata: PropTypes.object,
    targetDomainMetadata: PropTypes.shape({
      extensionId: PropTypes.string,
      icon: PropTypes.string,
      host: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      origin: PropTypes.string.isRequired,
    }),
  };

  static defaultProps = {
    request: {},
    requestMetadata: {},
    selectedIdentities: [],
    allIdentitiesSelected: false,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  };

  state = {
    selectedPermissions: this.getRequestedMethodState(
      this.getRequestedMethodNames(this.props),
    ),
  };

  componentDidUpdate() {
    const newMethodNames = this.getRequestedMethodNames(this.props);

    if (!isEqual(Object.keys(this.state.selectedPermissions), newMethodNames)) {
      // this should be a new request, so just overwrite
      this.setState({
        selectedPermissions: this.getRequestedMethodState(newMethodNames),
      });
    }
  }

  getRequestedMethodState(methodNames) {
    return methodNames.reduce((acc, methodName) => {
      acc[methodName] = true;
      return acc;
    }, {});
  }

  getRequestedMethodNames(props) {
    return Object.keys(props.request.permissions || {});
  }

  onPermissionToggle = (methodName) => {
    this.setState({
      selectedPermissions: {
        ...this.state.selectedPermissions,
        [methodName]: !this.state.selectedPermissions[methodName],
      },
    });
  };

  componentDidMount() {
    this.context.metricsEvent({
      eventOpts: {
        category: 'Auth',
        action: 'Connect',
        name: 'Tab Opened',
      },
    });
  }

  onCancel = () => {
    const { request, rejectPermissionsRequest } = this.props;
    rejectPermissionsRequest(request.metadata.id);
  };

  onSubmit = () => {
    const {
      request: _request,
      approvePermissionsRequest,
      rejectPermissionsRequest,
      selectedIdentities,
    } = this.props;

    const request = {
      ..._request,
      permissions: { ..._request.permissions },
    };

    Object.keys(this.state.selectedPermissions).forEach((key) => {
      if (!this.state.selectedPermissions[key]) {
        delete request.permissions[key];
      }
    });

    if (Object.keys(request.permissions).length > 0) {
      approvePermissionsRequest(
        request,
        selectedIdentities.map((selectedIdentity) => selectedIdentity.address),
      );
    } else {
      rejectPermissionsRequest(request.metadata.id);
    }
  };

  render() {
    const {
      requestMetadata,
      targetDomainMetadata,
      selectedIdentities,
      allIdentitiesSelected,
    } = this.props;

    return (
      <div className="page-container permission-approval-container">
        <PermissionPageContainerContent
          requestMetadata={requestMetadata}
          domainMetadata={targetDomainMetadata}
          selectedPermissions={this.state.selectedPermissions}
          onPermissionToggle={this.onPermissionToggle}
          selectedIdentities={selectedIdentities}
          allIdentitiesSelected={allIdentitiesSelected}
        />
        <div className="permission-approval-container__footers">
          <PermissionsConnectFooter />
          <PageContainerFooter
            cancelButtonType="default"
            onCancel={() => this.onCancel()}
            cancelText={this.context.t('cancel')}
            onSubmit={() => this.onSubmit()}
            submitText={this.context.t('connect')}
            submitButtonType="confirm"
            buttonSizeLarge={false}
          />
        </div>
      </div>
    );
  }
}
