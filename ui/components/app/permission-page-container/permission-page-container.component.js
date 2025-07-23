import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/snaps-rpc-methods';
import { Caip25EndowmentPermissionName } from '@metamask/chain-agnostic-permission';
import { SubjectType } from '@metamask/permission-controller';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import PermissionsConnectFooter from '../permissions-connect-footer';
import { RestrictedMethods } from '../../../../shared/constants/permissions';

import SnapPrivacyWarning from '../snaps/snap-privacy-warning';
import { getDedupedSnaps } from '../../../helpers/utils/util';

import {
  BackgroundColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import {
  getCaip25CaveatValueFromPermissions,
  getCaip25PermissionsResponse,
} from '../../../pages/permissions-connect/connect-page/utils';
import { TemplateAlertContextProvider } from '../../../pages/confirmations/confirmation/alerts/TemplateAlertContext';
import { containsEthPermissionsAndNonEvmAccount } from '../../../helpers/utils/permissions';
import { PermissionPageContainerFooter } from './permission-page-container-footer.component';
import { PermissionPageContainerContent } from '.';

export default class PermissionPageContainer extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedAccounts: PropTypes.array,
    requestedChainIds: PropTypes.array,
    allAccountsSelected: PropTypes.bool,
    currentPermissions: PropTypes.object,
    snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
    setSnapsInstallPrivacyWarningShownStatus: PropTypes.func,
    request: PropTypes.object,
    requestMetadata: PropTypes.object,
    targetSubjectMetadata: PropTypes.shape({
      name: PropTypes.string,
      origin: PropTypes.string.isRequired,
      subjectType: PropTypes.string.isRequired,
      extensionId: PropTypes.string,
      iconUrl: PropTypes.string,
    }),
    history: PropTypes.object.isRequired,
    connectPath: PropTypes.string.isRequired,
  };

  static defaultProps = {
    request: {},
    requestMetadata: {},
    selectedAccounts: [],
    allAccountsSelected: false,
    currentPermissions: {},
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  state = {};

  getRequestedPermissions() {
    const { request } = this.props;

    // if the request contains a diff this means its an incremental permission request
    const permissions =
      request?.diff?.permissionDiffMap ?? request.permissions ?? {};

    return Object.entries(permissions).reduce(
      (acc, [permissionName, permissionValue]) => {
        if (permissionName === RestrictedMethods.wallet_snap) {
          acc[permissionName] = this.getDedupedSnapPermissions();
          return acc;
        }
        acc[permissionName] = permissionValue;
        return acc;
      },
      {},
    );
  }

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

  componentDidMount() {
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Auth,
      event: 'Tab Opened',
      properties: {
        action: 'Connect',
        legacy_event: true,
      },
    });

    if (this.props.request.permissions[WALLET_SNAP_PERMISSION_KEY]) {
      if (this.props.snapsInstallPrivacyWarningShown === false) {
        this.showSnapsPrivacyWarning();
      }
    }
  }

  goBack() {
    const { history, connectPath } = this.props;
    history.push(connectPath);
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
      selectedAccounts,
      requestedChainIds,
    } = this.props;

    const approvedAccounts = selectedAccounts.map(
      (selectedAccount) => selectedAccount.address,
    );

    const requestedCaip25CaveatValue = getCaip25CaveatValueFromPermissions(
      _request.permissions,
    );

    const request = {
      ..._request,
      permissions: {
        ..._request.permissions,
        ...getCaip25PermissionsResponse(
          requestedCaip25CaveatValue,
          approvedAccounts,
          requestedChainIds,
        ),
      },
    };

    if (Object.keys(request.permissions).length > 0) {
      approvePermissionsRequest(request);
    } else {
      rejectPermissionsRequest(request.metadata.id);
    }
  };

  onLeftFooterClick = () => {
    const requestedPermissions = this.getRequestedPermissions();
    if (requestedPermissions[Caip25EndowmentPermissionName] === undefined) {
      this.goBack();
    } else {
      this.onCancel();
    }
  };

  render() {
    const {
      request,
      requestMetadata,
      targetSubjectMetadata,
      selectedAccounts,
      allAccountsSelected,
      requestedChainIds,
    } = this.props;

    const requestedPermissions = this.getRequestedPermissions();

    const setIsShowingSnapsPrivacyWarning = (value) => {
      this.setState({
        isShowingSnapsPrivacyWarning: value,
      });
    };

    const confirmSnapsPrivacyWarning = () => {
      setIsShowingSnapsPrivacyWarning(false);
      this.props.setSnapsInstallPrivacyWarningShownStatus(true);
    };

    const footerLeftActionText = requestedPermissions[
      Caip25EndowmentPermissionName
    ]
      ? this.context.t('cancel')
      : this.context.t('back');

    return (
      <TemplateAlertContextProvider
        onSubmit={() => this.onSubmit()}
        confirmationId={request?.metadata?.id}
      >
        {this.state.isShowingSnapsPrivacyWarning && (
          <SnapPrivacyWarning
            onAccepted={() => confirmSnapsPrivacyWarning()}
            onCanceled={() => this.onCancel()}
          />
        )}
        <PermissionPageContainerContent
          request={request}
          requestMetadata={requestMetadata}
          subjectMetadata={targetSubjectMetadata}
          selectedPermissions={requestedPermissions}
          requestedChainIds={requestedChainIds}
          selectedAccounts={selectedAccounts}
          allAccountsSelected={allAccountsSelected}
        />
        <Box
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundAlternative}
          flexDirection={FlexDirection.Column}
        >
          {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
            <PermissionsConnectFooter />
          )}
          <PermissionPageContainerFooter
            onCancel={() => this.onLeftFooterClick()}
            cancelText={footerLeftActionText}
            onSubmit={() => this.onSubmit()}
            disabled={containsEthPermissionsAndNonEvmAccount(
              selectedAccounts,
              requestedPermissions,
            )}
          />
        </Box>
      </TemplateAlertContextProvider>
    );
  }
}
