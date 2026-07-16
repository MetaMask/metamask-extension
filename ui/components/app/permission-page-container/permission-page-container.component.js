import PropTypes from 'prop-types';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/snaps-rpc-methods';
import {
  Caip25EndowmentPermissionName,
  generateCaip25Caveat,
  getCaipAccountIdsFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { SubjectType } from '@metamask/permission-controller';
import { Box } from '@metamask/design-system-react';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { I18nContext } from '../../../contexts/i18n';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import PermissionsConnectFooter from '../permissions-connect-footer';
import { RestrictedMethods } from '../../../../shared/constants/permissions';
import SnapPrivacyWarning from '../snaps/snap-privacy-warning';
import { getDedupedSnaps } from '../../../helpers/utils/util';
import {
  getCaip25CaveatValueFromPermissions,
  getCaip25PermissionsResponse,
} from '../../../helpers/utils/caip25-permissions';
import { TemplateAlertContextProvider } from '../../../pages/confirmations/confirmation/alerts/TemplateAlertContext';
import { containsEthPermissionsAndNonEvmAccount } from '../../../helpers/utils/permissions';
import { PermissionPageContainerFooter } from './permission-page-container-footer.component';
import PermissionPageContainerContent from './permission-page-container-content';

function PermissionPageContainerBase({
  approvePermissionsRequest,
  rejectPermissionsRequest,
  t,
  trackEvent,
  selectedAccounts = [],
  requestedChainIds,
  selectedCaipAccountIds = null,
  selectedCaipChainIds = null,
  allAccountsSelected = false,
  currentPermissions = {},
  snapsInstallPrivacyWarningShown,
  setSnapsInstallPrivacyWarningShownStatus,
  request = {},
  requestMetadata = {},
  targetSubjectMetadata,
  navigate,
  connectPath,
}) {
  const [isShowingSnapsPrivacyWarning, setIsShowingSnapsPrivacyWarning] =
    useState(false);
  const hasTrackedTabOpenedRef = useRef(false);
  const hasHandledSnapsPrivacyWarningRef = useRef(false);

  const getDedupedSnapPermissions = useCallback(() => {
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
  }, [currentPermissions, request]);

  const requestedPermissions = useMemo(() => {
    const permissions =
      request?.diff?.permissionDiffMap ?? request.permissions ?? {};

    return Object.entries(permissions).reduce(
      (acc, [permissionName, permissionValue]) => {
        if (permissionName === RestrictedMethods.wallet_snap) {
          acc[permissionName] = getDedupedSnapPermissions();
          return acc;
        }
        acc[permissionName] = permissionValue;
        return acc;
      },
      {},
    );
  }, [getDedupedSnapPermissions, request]);

  useEffect(() => {
    if (hasTrackedTabOpenedRef.current) {
      return;
    }
    hasTrackedTabOpenedRef.current = true;
    trackEvent({
      category: MetaMetricsEventCategory.Auth,
      event: 'Tab Opened',
      properties: {
        action: 'Connect',
        legacy_event: true,
      },
    });
  }, [trackEvent]);

  useEffect(() => {
    if (hasHandledSnapsPrivacyWarningRef.current) {
      return;
    }

    if (!request.permissions?.[WALLET_SNAP_PERMISSION_KEY]) {
      return;
    }

    hasHandledSnapsPrivacyWarningRef.current = true;

    if (snapsInstallPrivacyWarningShown === false) {
      setIsShowingSnapsPrivacyWarning(true);
    }
  }, [request.permissions, snapsInstallPrivacyWarningShown]);

  const goBack = useCallback(() => {
    navigate(connectPath);
  }, [connectPath, navigate]);

  const onCancel = useCallback(() => {
    rejectPermissionsRequest(request?.metadata?.id);
  }, [rejectPermissionsRequest, request?.metadata?.id]);

  const onSubmit = useCallback(() => {
    const requestedCaip25CaveatValue = getCaip25CaveatValueFromPermissions(
      request.permissions,
    );

    let permissionsResponse;

    if (
      selectedCaipAccountIds?.length > 0 &&
      selectedCaipChainIds?.length > 0
    ) {
      permissionsResponse = generateCaip25Caveat(
        requestedCaip25CaveatValue,
        selectedCaipAccountIds,
        selectedCaipChainIds,
      );
    } else if (selectedAccounts?.length > 0) {
      permissionsResponse = getCaip25PermissionsResponse(
        requestedCaip25CaveatValue,
        selectedAccounts.map((account) => account.address),
        requestedChainIds,
      );
    } else {
      const originalCaipAccountIds = getCaipAccountIdsFromCaip25CaveatValue(
        requestedCaip25CaveatValue,
      );
      const originalCaipChainIds = getAllScopesFromCaip25CaveatValue(
        requestedCaip25CaveatValue,
      );

      permissionsResponse = generateCaip25Caveat(
        requestedCaip25CaveatValue,
        originalCaipAccountIds,
        originalCaipChainIds,
      );
    }

    const nextRequest = {
      ...request,
      permissions: {
        ...request.permissions,
        ...permissionsResponse,
      },
    };

    if (Object.keys(nextRequest.permissions).length > 0) {
      approvePermissionsRequest(nextRequest);
    } else {
      rejectPermissionsRequest(request?.metadata?.id);
    }
  }, [
    approvePermissionsRequest,
    rejectPermissionsRequest,
    request,
    requestedChainIds,
    selectedAccounts,
    selectedCaipAccountIds,
    selectedCaipChainIds,
  ]);

  const onLeftFooterClick = useCallback(() => {
    if (requestedPermissions[Caip25EndowmentPermissionName] === undefined) {
      goBack();
    } else {
      onCancel();
    }
  }, [goBack, onCancel, requestedPermissions]);

  const confirmSnapsPrivacyWarning = useCallback(() => {
    hasHandledSnapsPrivacyWarningRef.current = true;
    setIsShowingSnapsPrivacyWarning(false);
    setSnapsInstallPrivacyWarningShownStatus(true);
  }, [setSnapsInstallPrivacyWarningShownStatus]);

  const footerLeftActionText = requestedPermissions[
    Caip25EndowmentPermissionName
  ]
    ? t('cancel')
    : t('back');

  return (
    <TemplateAlertContextProvider
      onSubmit={onSubmit}
      confirmationId={request?.metadata?.id}
    >
      {isShowingSnapsPrivacyWarning && (
        <SnapPrivacyWarning
          onAccepted={confirmSnapsPrivacyWarning}
          onCanceled={onCancel}
        />
      )}
      <PermissionPageContainerContent
        request={request}
        requestMetadata={requestMetadata}
        subjectMetadata={targetSubjectMetadata}
        selectedPermissions={requestedPermissions}
        requestedChainIds={requestedChainIds}
        selectedCaipChainIds={selectedCaipChainIds}
        selectedAccounts={selectedAccounts}
        allAccountsSelected={allAccountsSelected}
      />
      <Box className="flex flex-col">
        {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
          <PermissionsConnectFooter />
        )}
        <PermissionPageContainerFooter
          onCancel={onLeftFooterClick}
          cancelText={footerLeftActionText}
          onSubmit={onSubmit}
          disabled={containsEthPermissionsAndNonEvmAccount(
            selectedAccounts,
            requestedPermissions,
          )}
        />
      </Box>
    </TemplateAlertContextProvider>
  );
}

PermissionPageContainerBase.propTypes = {
  approvePermissionsRequest: PropTypes.func.isRequired,
  rejectPermissionsRequest: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  trackEvent: PropTypes.func.isRequired,
  selectedAccounts: PropTypes.array,
  requestedChainIds: PropTypes.array,
  selectedCaipAccountIds: PropTypes.arrayOf(PropTypes.string),
  selectedCaipChainIds: PropTypes.arrayOf(PropTypes.string),
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
  navigate: PropTypes.func.isRequired,
  connectPath: PropTypes.string.isRequired,
};

function PermissionPageContainer(props) {
  const t = useContext(I18nContext);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const trackEventForPermissionPage = useCallback(
    (payload) => {
      trackEvent(
        createEventBuilder(payload.event)
          .addCategory(payload.category)
          .addProperties(payload.properties)
          .build(),
      );
    },
    [createEventBuilder, trackEvent],
  );
  return (
    <PermissionPageContainerBase
      {...props}
      t={t}
      trackEvent={trackEventForPermissionPage}
    />
  );
}

export default PermissionPageContainer;
