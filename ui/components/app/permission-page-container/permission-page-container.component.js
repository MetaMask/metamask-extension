import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { isEqual } from 'lodash';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/snaps-rpc-methods';
///: END:ONLY_INCLUDE_IF
import { SubjectType } from '@metamask/permission-controller';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { PageContainerFooter } from '../../ui/page-container';
import PermissionsConnectFooter from '../permissions-connect-footer';
///: BEGIN:ONLY_INCLUDE_IF(snaps)
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import SnapPrivacyWarning from '../snaps/snap-privacy-warning';
import { getDedupedSnaps } from '../../../helpers/utils/util';
///: END:ONLY_INCLUDE_IF
import { PermissionPageContainerContent } from '.';

export default class PermissionPageContainer extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedIdentities: PropTypes.array,
    allIdentitiesSelected: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    currentPermissions: PropTypes.object,
    snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
    setSnapsInstallPrivacyWarningShownStatus: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
    request: PropTypes.object,
    requestMetadata: PropTypes.object,
    targetSubjectMetadata: PropTypes.shape({
      name: PropTypes.string,
      origin: PropTypes.string.isRequired,
      subjectType: PropTypes.string.isRequired,
      extensionId: PropTypes.string,
      iconUrl: PropTypes.string,
    }),
  };

  static defaultProps = {
    request: {},
    requestMetadata: {},
    selectedIdentities: [],
    allIdentitiesSelected: false,
    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    currentPermissions: {},
    ///: END:ONLY_INCLUDE_IF
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
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
      ///: BEGIN:ONLY_INCLUDE_IF(snaps)
      if (methodName === RestrictedMethods.wallet_snap) {
        acc[methodName] = this.getDedupedSnapPermissions();
        return acc;
      }
      ///: END:ONLY_INCLUDE_IF
      acc[methodName] = true;
      return acc;
    }, {});
  }

  ///: BEGIN:ONLY_INCLUDE_IF(snaps)
  getDedupedSnapPermissions() {
    const { request, currentPermissions } = this.props;
    const snapKeys = getDedupedSnaps(request, currentPermissions);
    const permission = request?.permissions?.[WALLET_SNAP_PERMISSION_KEY] || {};
    return {
      ...permission,
      caveats: [
        {
          type: SnapCaveatType.SnapIds,
          value: snapKeys.reduce((caveatValue, snapId) => {
            caveatValue[snapId] = {};
            return caveatValue;
          }, {}),
        },
      ],
    };
  }

  showSnapsPrivacyWarning() {
    this.setState({
      isShowingSnapsPrivacyWarning: true,
    });
  }
  ///: END:ONLY_INCLUDE_IF

  getRequestedMethodNames(props) {
    return Object.keys(props.request.permissions || {});
  }

  componentDidMount() {
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Auth,
      event: 'Tab Opened',
      properties: {
        action: 'Connect',
        legacy_event: true,
      },
    });

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    if (this.props.request.permissions[WALLET_SNAP_PERMISSION_KEY]) {
      if (this.props.snapsInstallPrivacyWarningShown === false) {
        this.showSnapsPrivacyWarning();
      }
    }
    ///: END:ONLY_INCLUDE_IF
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
      approvedAccounts: selectedIdentities.map(
        (selectedIdentity) => selectedIdentity.address,
      ),
    };

    Object.keys(this.state.selectedPermissions).forEach((key) => {
      if (!this.state.selectedPermissions[key]) {
        delete request.permissions[key];
      }
    });

    if (Object.keys(request.permissions).length > 0) {
      approvePermissionsRequest(request);
    } else {
      rejectPermissionsRequest(request.metadata.id);
    }
  };

  render() {
    const {
      requestMetadata,
      targetSubjectMetadata,
      selectedIdentities,
      allIdentitiesSelected,
    } = this.props;

    ///: BEGIN:ONLY_INCLUDE_IF(snaps)
    const setIsShowingSnapsPrivacyWarning = (value) => {
      this.setState({
        isShowingSnapsPrivacyWarning: value,
      });
    };

    const confirmSnapsPrivacyWarning = () => {
      setIsShowingSnapsPrivacyWarning(false);
      this.props.setSnapsInstallPrivacyWarningShownStatus(true);
    };
    ///: END:ONLY_INCLUDE_IF

    return (
      <>
        {
          ///: BEGIN:ONLY_INCLUDE_IF(snaps)
          <>
            {this.state.isShowingSnapsPrivacyWarning && (
              <SnapPrivacyWarning
                onAccepted={() => confirmSnapsPrivacyWarning()}
                onCanceled={() => this.onCancel()}
              />
            )}
          </>
          ///: END:ONLY_INCLUDE_IF
        }
        <PermissionPageContainerContent
          requestMetadata={requestMetadata}
          subjectMetadata={targetSubjectMetadata}
          selectedPermissions={this.state.selectedPermissions}
          selectedIdentities={selectedIdentities}
          allIdentitiesSelected={allIdentitiesSelected}
        />
        <div className="permission-approval-container__footers">
          {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
            <PermissionsConnectFooter />
          )}
          <PageContainerFooter
            cancelButtonType="default"
            onCancel={() => this.onCancel()}
            cancelText={this.context.t('cancel')}
            onSubmit={() => this.onSubmit()}
            submitText={this.context.t('connect')}
            buttonSizeLarge={false}
          />
        </div>
      </>
    );
  }
}
