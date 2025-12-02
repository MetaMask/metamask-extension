import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  useNavigate,
  useLocation,
  useParams,
  Routes,
  Route,
} from 'react-router-dom';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { SubjectType } from '@metamask/permission-controller';
import { isSnapId } from '@metamask/snaps-utils';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-rpc-methods';
import { isEvmAccountType } from '@metamask/keyring-api';
import {
  Caip25EndowmentPermissionName,
  getAllNamespacesFromCaip25CaveatValue,
  getAllScopesFromCaip25CaveatValue,
  getEthAccounts,
  getPermittedEthChainIds,
} from '@metamask/chain-agnostic-permission';
import {
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { toRelativeRoutePath } from '../routes/utils';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isEthAddress } from '../../../app/scripts/lib/multichain/address';
import { MILLISECOND } from '../../../shared/constants/time';
import {
  DEFAULT_ROUTE,
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  CONNECT_SNAPS_CONNECT_ROUTE,
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  CONNECT_SNAP_RESULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsRequests,
  getSelectedInternalAccount,
  getSnapInstallOrUpdateRequests,
  getRequestState,
  getSnapsInstallPrivacyWarningShown,
  getRequestType,
  getTargetSubjectMetadata,
} from '../../selectors';
import { getNativeCurrency } from '../../ducks/metamask/metamask';
import { formatDate, getURLHostName } from '../../helpers/utils/util';
import {
  approvePermissionsRequest as approvePermissionsRequestAction,
  rejectPermissionsRequest as rejectPermissionsRequestAction,
  showModal,
  getRequestAccountTabIds as getRequestAccountTabIdsAction,
  resolvePendingApproval,
  rejectPendingApproval as rejectPendingApprovalAction,
  setSnapsInstallPrivacyWarningShownStatus as setSnapsInstallPrivacyWarningShownStatusAction,
} from '../../store/actions';
import { getAccountGroupWithInternalAccounts } from '../../selectors/multichain-accounts/account-tree';
import PermissionPageContainer from '../../components/app/permission-page-container';
import { Box } from '../../components/component-library';
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header/snap-authorship-header';
import { State2Wrapper } from '../../components/multichain-accounts/state2-wrapper/state2-wrapper';
import { MultichainAccountsConnectPage } from '../multichain-accounts/multichain-accounts-connect-page/multichain-accounts-connect-page';
import { supportsChainIds } from '../../hooks/useAccountGroupsForPermissions';
import { getCaip25AccountIdsFromAccountGroupAndScope } from '../../../shared/lib/multichain/scope-utils';
import { MultichainEditAccountsPageWrapper } from '../../components/multichain-accounts/permissions/multichain-edit-accounts-page/multichain-edit-account-wrapper';
import { useI18nContext } from '../../hooks/useI18nContext';
import ChooseAccount from './choose-account';
import PermissionsRedirect from './redirect';
import SnapsConnect from './snaps/snaps-connect';
import SnapInstall from './snaps/snap-install';
import SnapUpdate from './snaps/snap-update';
import SnapResult from './snaps/snap-result';
import { ConnectPage } from './connect-page/connect-page';
import {
  getCaip25CaveatValueFromPermissions,
  PermissionsRequest,
} from './connect-page/utils';

const APPROVE_TIMEOUT = MILLISECOND * 1200;

function getDefaultSelectedAccounts(
  currentAddress: string,
  permissions: PermissionsRequest,
) {
  const requestedCaip25CaveatValue =
    getCaip25CaveatValueFromPermissions(permissions);
  const requestedAccounts = getEthAccounts(requestedCaip25CaveatValue);

  if (requestedAccounts.length > 0) {
    return new Set(
      requestedAccounts
        .map((address) => address.toLowerCase())
        // We only consider EVM accounts here (used for `eth_requestAccounts` or `eth_accounts`)
        .filter(isEthAddress),
    );
  }

  // We only consider EVM accounts here (used for `eth_requestAccounts` or `eth_accounts`)
  return new Set(isEthAddress(currentAddress) ? [currentAddress] : []);
}

function getRequestedChainIds(permissions: PermissionsRequest | undefined) {
  const requestedCaip25CaveatValue =
    getCaip25CaveatValueFromPermissions(permissions);
  return getPermittedEthChainIds(requestedCaip25CaveatValue);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function PermissionsConnect() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const t = useI18nContext();

  const permissionsRequestId = params.id;

  // Selectors
  const { pathname } = location;
  let permissionsRequests = useSelector(getPermissionsRequests);
  permissionsRequests = [
    ...permissionsRequests,
    ...useSelector(getSnapInstallOrUpdateRequests),
  ];
  const { address: currentAddress } = useSelector(getSelectedInternalAccount);

  const permissionsRequest = permissionsRequests.find(
    (req: Record<string, unknown>) =>
      (req.metadata as Record<string, unknown>)?.id === permissionsRequestId,
  ) as Record<string, unknown> | undefined;

  const { metadata = {}, diff = {} } = permissionsRequest || {};
  const { origin: originFromRequest } = (metadata || {}) as Record<
    string,
    string
  >;
  const nativeCurrency = useSelector(getNativeCurrency);

  const isRequestApprovalPermittedChains = Boolean(
    (diff as Record<string, unknown>)?.permissionDiffMap,
  );
  const permissions = permissionsRequest?.permissions as
    | Record<string, unknown>
    | undefined;
  const isRequestingAccounts = Boolean(
    permissions?.[Caip25EndowmentPermissionName] &&
      !isRequestApprovalPermittedChains,
  );

  const targetSubjectMetadataFromSelector = useSelector((state) =>
    getTargetSubjectMetadata(state, originFromRequest),
  );

  const targetSubjectMetadataProp = useMemo(
    () =>
      targetSubjectMetadataFromSelector ?? {
        name: getURLHostName(originFromRequest) || originFromRequest,
        origin: originFromRequest,
        iconUrl: null,
        extensionId: null,
        subjectType: SubjectType.Unknown,
      },
    [targetSubjectMetadataFromSelector, originFromRequest],
  );

  let requestType = useSelector((state) =>
    getRequestType(state, permissionsRequestId),
  );

  // We want to only assign the wallet_connectSnaps request type (i.e. only show
  // SnapsConnect) if and only if we get a singular wallet_snap permission request.
  // Any other request gets pushed to the normal permission connect flow.
  if (
    permissionsRequest &&
    Object.keys(permissions || {}).length === 1 &&
    permissions?.[WALLET_SNAP_PERMISSION_KEY]
  ) {
    requestType = 'wallet_connectSnaps';
  }

  const requestState =
    useSelector((state) => getRequestState(state, permissionsRequestId)) || {};

  // We only consider EVM accounts.
  // Connections with non-EVM accounts (Bitcoin only for now) are used implicitly and handled by the Bitcoin Snap itself.
  const accountsWithLabels = useSelector(getAccountsWithLabels).filter(
    (account: { type: string }) => isEvmAccountType(account.type),
  );

  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);
  const lastConnectedInfoRaw = useSelector(getLastConnectedInfo);

  const lastConnectedInfo = useMemo(
    () => lastConnectedInfoRaw || {},
    [lastConnectedInfoRaw],
  );

  const addressLastConnectedMap = useMemo(() => {
    const map = lastConnectedInfo[originFromRequest]?.accounts || {};
    const formattedMap: Record<string, string> = {};
    Object.keys(map).forEach((key) => {
      formattedMap[key] = formatDate(map[key], 'yyyy-MM-dd');
    });
    return formattedMap;
  }, [lastConnectedInfo, originFromRequest]);

  const connectPath = `${CONNECT_ROUTE}/${permissionsRequestId}`;
  const confirmPermissionPath = `${connectPath}${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`;
  const snapsConnectPath = `${connectPath}${CONNECT_SNAPS_CONNECT_ROUTE}`;
  const snapInstallPath = `${connectPath}${CONNECT_SNAP_INSTALL_ROUTE}`;
  const snapUpdatePath = `${connectPath}${CONNECT_SNAP_UPDATE_ROUTE}`;
  const snapResultPath = `${connectPath}${CONNECT_SNAP_RESULT_ROUTE}`;

  const isSnapInstallOrUpdateOrResult =
    pathname === snapInstallPath ||
    pathname === snapUpdatePath ||
    pathname === snapResultPath;

  const hideTopBar = isSnapInstallOrUpdateOrResult;
  const snapsInstallPrivacyWarningShownProp = useSelector(
    getSnapsInstallPrivacyWarningShown,
  );

  const newAccountNumber = accountsWithLabels.length + 1;

  // Local state
  const [redirecting, setRedirecting] = useState(false);
  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState(() =>
    getDefaultSelectedAccounts(
      currentAddress,
      permissions as PermissionsRequest,
    ),
  );
  const [permissionsApproved, setPermissionsApproved] = useState<
    boolean | null
  >(null);
  const [origin] = useState<string>(originFromRequest);
  const [targetSubjectMetadata, setTargetSubjectMetadata] = useState(
    targetSubjectMetadataProp || {},
  );
  const [snapsInstallPrivacyWarningShown] = useState(
    snapsInstallPrivacyWarningShownProp,
  );

  const prevPermissionsRequestRef =
    useRef<typeof permissionsRequest>(undefined);
  const prevTargetSubjectMetadataRef =
    useRef<typeof targetSubjectMetadataProp>(undefined);
  const prevLastConnectedInfoRef = useRef<typeof lastConnectedInfo>(undefined);

  // Define redirect function before it's used in effects
  const redirect = useCallback(
    (approved: boolean) => {
      let shouldRedirect = true;

      const isRequestingSnap =
        permissions && Object.keys(permissions).includes('wallet_snap');

      shouldRedirect = !isRequestingSnap;

      setRedirecting(shouldRedirect);
      setPermissionsApproved(approved);

      if (shouldRedirect && approved) {
        setTimeout(() => navigate(DEFAULT_ROUTE), APPROVE_TIMEOUT);
        return;
      }
      navigate(DEFAULT_ROUTE);
    },
    [permissions, navigate],
  );

  // Handle initial navigation on mount
  useEffect(() => {
    dispatch(getRequestAccountTabIdsAction());

    if (!permissionsRequest) {
      navigate(DEFAULT_ROUTE, { replace: true });
      return;
    }

    if (location.pathname === connectPath && !isRequestingAccounts) {
      switch (requestType) {
        case 'wallet_installSnap':
          navigate(snapInstallPath, { replace: true });
          break;
        case 'wallet_updateSnap':
          navigate(snapUpdatePath, { replace: true });
          break;
        case 'wallet_installSnapResult':
          navigate(snapResultPath, { replace: true });
          break;
        case 'wallet_connectSnaps':
          navigate(snapsConnectPath, { replace: true });
          break;
        default:
          navigate(confirmPermissionPath, { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache targetSubjectMetadata when it changes
  useEffect(() => {
    if (
      targetSubjectMetadataProp?.origin &&
      prevTargetSubjectMetadataRef.current?.origin !==
        targetSubjectMetadataProp?.origin
    ) {
      setTargetSubjectMetadata(targetSubjectMetadataProp);
    }
    prevTargetSubjectMetadataRef.current = targetSubjectMetadataProp;
  }, [targetSubjectMetadataProp]);

  // Handle redirect on permissions approval/rejection
  useEffect(() => {
    if (
      !permissionsRequest &&
      prevPermissionsRequestRef.current &&
      !redirecting
    ) {
      const lastConnectedForOrigin = lastConnectedInfo[origin] as
        | { lastApproved?: number; accounts?: Record<string, number> }
        | undefined;
      const prevLastConnectedForOrigin = prevLastConnectedInfoRef.current?.[
        origin
      ] as
        | { lastApproved?: number; accounts?: Record<string, number> }
        | undefined;

      const accountsLastApprovedTime =
        lastConnectedForOrigin?.lastApproved || 0;
      const initialAccountsLastApprovedTime =
        prevLastConnectedForOrigin?.lastApproved || 0;

      const approved =
        accountsLastApprovedTime > initialAccountsLastApprovedTime;
      redirect(approved);
    }
    prevPermissionsRequestRef.current = permissionsRequest;
    prevLastConnectedInfoRef.current = lastConnectedInfo;
  }, [permissionsRequest, lastConnectedInfo, redirecting, origin, redirect]);

  const selectAccounts = useCallback(
    (addresses: Set<string>) => {
      setSelectedAccountAddresses(addresses);
      // Navigate after state is updated
      setTimeout(() => {
        switch (requestType) {
          case 'wallet_installSnap':
            navigate(snapInstallPath);
            break;
          case 'wallet_updateSnap':
            navigate(snapUpdatePath);
            break;
          case 'wallet_installSnapResult':
            navigate(snapResultPath);
            break;
          case 'wallet_connectSnaps':
            navigate(snapsConnectPath, { replace: true });
            break;
          default:
            navigate(confirmPermissionPath);
        }
      }, 0);
    },
    [
      requestType,
      snapInstallPath,
      snapUpdatePath,
      snapResultPath,
      snapsConnectPath,
      confirmPermissionPath,
      navigate,
    ],
  );

  const cancelPermissionsRequest = useCallback(
    async (requestId: string) => {
      if (requestId) {
        await dispatch(rejectPermissionsRequestAction(requestId));
        redirect(false);
      }
    },
    [dispatch, redirect],
  );

  const approveConnection = useCallback(
    (request: Record<string, unknown>) => {
      dispatch(
        approvePermissionsRequestAction(
          request.metadata as Record<string, unknown>,
        ),
      );
      redirect(true);
    },
    [dispatch, redirect],
  );

  const showNewAccountModal = useCallback(
    ({
      onCreateNewAccount,
      newAccountNumber: accountNumber,
    }: {
      onCreateNewAccount: (address: string) => void;
      newAccountNumber: number;
    }) => {
      return dispatch(
        showModal({
          name: 'NEW_ACCOUNT',
          onCreateNewAccount,
          newAccountNumber: accountNumber,
        }),
      );
    },
    [dispatch],
  );

  const setSnapsInstallPrivacyWarningShownStatus = useCallback(
    (shown: boolean) => {
      dispatch(setSnapsInstallPrivacyWarningShownStatusAction(shown));
    },
    [dispatch],
  );

  const approvePendingApproval = useCallback(
    (id: string, value?: unknown) =>
      dispatch(resolvePendingApproval(id, value)),
    [dispatch],
  );

  const rejectPendingApproval = useCallback(
    (id: string, error: unknown) =>
      dispatch(rejectPendingApprovalAction(id, error)),
    [dispatch],
  );

  const renderSnapChooseAccountState1 = useCallback(() => {
    return (
      <ChooseAccount
        accounts={accountsWithLabels}
        nativeCurrency={nativeCurrency}
        selectAccounts={(addresses) => selectAccounts(addresses)}
        selectNewAccountViaModal={(
          handleAccountClick: (address: string) => void,
        ) => {
          showNewAccountModal({
            onCreateNewAccount: (address: string) =>
              handleAccountClick(address),
            newAccountNumber,
          });
        }}
        addressLastConnectedMap={addressLastConnectedMap}
        cancelPermissionsRequest={(requestId: string) =>
          cancelPermissionsRequest(requestId)
        }
        permissionsRequestId={permissionsRequestId || ''}
        selectedAccountAddresses={selectedAccountAddresses}
        targetSubjectMetadata={targetSubjectMetadata}
      />
    );
  }, [
    accountsWithLabels,
    nativeCurrency,
    selectAccounts,
    showNewAccountModal,
    newAccountNumber,
    addressLastConnectedMap,
    cancelPermissionsRequest,
    permissionsRequestId,
    selectedAccountAddresses,
    targetSubjectMetadata,
  ]);

  const renderSnapChooseAccountState2 = useCallback(() => {
    const requestedCaip25CaveatValue = getCaip25CaveatValueFromPermissions(
      permissions as PermissionsRequest | undefined,
    );

    const caipChainIdsToUse: `${string}:${string}`[] = [];

    const requestedCaipChainIds = getAllScopesFromCaip25CaveatValue(
      requestedCaip25CaveatValue,
    ).filter((chainId) => {
      const { namespace } = parseCaipChainId(chainId);
      return namespace !== KnownCaipNamespace.Wallet;
    });
    const requestedNamespaces = getAllNamespacesFromCaip25CaveatValue(
      requestedCaip25CaveatValue,
    );

    if (requestedCaipChainIds.length > 0) {
      requestedCaipChainIds.forEach((chainId) => {
        caipChainIdsToUse.push(chainId);
      });
    }

    if (requestedNamespaces.includes(KnownCaipNamespace.Eip155)) {
      caipChainIdsToUse.push(`${KnownCaipNamespace.Eip155}:0`);
    }

    return (
      <MultichainEditAccountsPageWrapper
        title={t('connectWithMetaMask')}
        permissions={permissions as PermissionsRequest}
        onSubmit={(accountGroupIds: string[]) => {
          const filteredAccountGroups = accountGroups.filter(
            (group) =>
              accountGroupIds.includes(group.id) &&
              supportsChainIds(group, caipChainIdsToUse),
          );
          const addresses = getCaip25AccountIdsFromAccountGroupAndScope(
            filteredAccountGroups,
            caipChainIdsToUse,
          ).map(
            (caip25AccountId) => parseCaipAccountId(caip25AccountId).address,
          );
          selectAccounts(new Set(addresses));
        }}
        onClose={() => cancelPermissionsRequest(permissionsRequestId || '')}
      />
    );
  }, [
    permissions,
    accountGroups,
    t,
    selectAccounts,
    cancelPermissionsRequest,
    permissionsRequestId,
  ]);

  const renderConnectPageState1 = useCallback(() => {
    const connectPageProps = {
      rejectPermissionsRequest: (requestId: string) =>
        cancelPermissionsRequest(requestId),
      activeTabOrigin: origin,
      request: permissionsRequest || {},
      permissionsRequestId: permissionsRequestId || '',
      approveConnection,
      targetSubjectMetadata,
    };

    return <ConnectPage {...connectPageProps} />;
  }, [
    cancelPermissionsRequest,
    origin,
    permissionsRequest,
    permissionsRequestId,
    approveConnection,
    targetSubjectMetadata,
  ]);

  const renderConnectPageState2 = useCallback(() => {
    const connectPageProps = {
      rejectPermissionsRequest: (requestId: string) =>
        cancelPermissionsRequest(requestId),
      activeTabOrigin: origin,
      request: permissionsRequest || {},
      permissionsRequestId: permissionsRequestId || '',
      approveConnection,
      targetSubjectMetadata,
    };

    return <MultichainAccountsConnectPage {...connectPageProps} />;
  }, [
    cancelPermissionsRequest,
    origin,
    permissionsRequest,
    permissionsRequestId,
    approveConnection,
    targetSubjectMetadata,
  ]);

  const renderTopBar = useCallback(
    (requestId: string) => {
      const handleCancelFromHeader = () => {
        cancelPermissionsRequest(requestId);
      };
      return (
        <Box
          style={{
            boxShadow:
              targetSubjectMetadata.subjectType === SubjectType.Snap
                ? 'var(--shadow-size-lg) var(--color-shadow-default)'
                : undefined,
          }}
        >
          {targetSubjectMetadata.subjectType === SubjectType.Snap && (
            <SnapAuthorshipHeader
              snapId={targetSubjectMetadata.origin}
              boxShadow="none"
              onCancel={handleCancelFromHeader}
            />
          )}
        </Box>
      );
    },
    [targetSubjectMetadata, cancelPermissionsRequest],
  );

  const isRequestingSnap = isSnapId(
    (metadata as Record<string, string>)?.origin,
  );

  return (
    <div className="permissions-connect">
      {!hideTopBar && renderTopBar(permissionsRequestId)}
      {redirecting && permissionsApproved ? (
        <PermissionsRedirect subjectMetadata={targetSubjectMetadata} />
      ) : (
        <Routes>
          <Route
            path="/"
            element={(() => {
              if (isRequestingSnap) {
                return (
                  <State2Wrapper
                    state1Component={renderSnapChooseAccountState1}
                    state2Component={renderSnapChooseAccountState2}
                  />
                );
              }
              return (
                <State2Wrapper
                  state1Component={renderConnectPageState1}
                  state2Component={renderConnectPageState2}
                />
              );
            })()}
          />
          <Route
            path={toRelativeRoutePath(CONNECT_CONFIRM_PERMISSIONS_ROUTE)}
            element={
              <PermissionPageContainer
                request={permissionsRequest || {}}
                approvePermissionsRequest={(
                  requestId: string,
                  requestData: unknown,
                ) => {
                  dispatch(
                    approvePermissionsRequestAction(requestId, requestData),
                  );
                  redirect(true);
                }}
                rejectPermissionsRequest={(requestId: string) =>
                  cancelPermissionsRequest(requestId)
                }
                selectedAccounts={accountsWithLabels.filter(
                  (account: { address: string }) =>
                    selectedAccountAddresses.has(account.address),
                )}
                requestedChainIds={getRequestedChainIds(
                  permissions as PermissionsRequest | undefined,
                )}
                targetSubjectMetadata={targetSubjectMetadata}
                navigate={navigate}
                connectPath={connectPath}
                snapsInstallPrivacyWarningShown={
                  snapsInstallPrivacyWarningShown
                }
                setSnapsInstallPrivacyWarningShownStatus={
                  setSnapsInstallPrivacyWarningShownStatus
                }
              />
            }
          />
          <Route
            path={toRelativeRoutePath(CONNECT_SNAPS_CONNECT_ROUTE)}
            element={
              <SnapsConnect
                request={permissionsRequest || {}}
                approveConnection={approveConnection}
                rejectConnection={(requestId) =>
                  cancelPermissionsRequest(requestId)
                }
                targetSubjectMetadata={targetSubjectMetadata}
                snapsInstallPrivacyWarningShown={
                  snapsInstallPrivacyWarningShown
                }
                setSnapsInstallPrivacyWarningShownStatus={
                  setSnapsInstallPrivacyWarningShownStatus
                }
              />
            }
          />
          <Route
            path={toRelativeRoutePath(CONNECT_SNAP_INSTALL_ROUTE)}
            element={
              <SnapInstall
                request={permissionsRequest || {}}
                requestState={requestState || {}}
                approveSnapInstall={(requestId) => {
                  approvePendingApproval(requestId, {
                    ...permissionsRequest,
                    permissions: requestState.permissions,
                    approvedAccounts: [...selectedAccountAddresses],
                  });
                  setPermissionsApproved(true);
                }}
                rejectSnapInstall={(requestId) => {
                  rejectPendingApproval(
                    requestId,
                    serializeError(providerErrors.userRejectedRequest()),
                  );
                  setPermissionsApproved(true);
                }}
                targetSubjectMetadata={targetSubjectMetadata}
              />
            }
          />
          <Route
            path={toRelativeRoutePath(CONNECT_SNAP_UPDATE_ROUTE)}
            element={
              <SnapUpdate
                request={permissionsRequest || {}}
                requestState={requestState || {}}
                approveSnapUpdate={(requestId) => {
                  approvePendingApproval(requestId, {
                    ...permissionsRequest,
                    permissions: requestState.permissions,
                    approvedAccounts: [...selectedAccountAddresses],
                  });
                  setPermissionsApproved(true);
                }}
                rejectSnapUpdate={(requestId) => {
                  rejectPendingApproval(
                    requestId,
                    serializeError(providerErrors.userRejectedRequest()),
                  );
                  setPermissionsApproved(false);
                }}
                targetSubjectMetadata={targetSubjectMetadata}
              />
            }
          />
          <Route
            path={toRelativeRoutePath(CONNECT_SNAP_RESULT_ROUTE)}
            element={
              <SnapResult
                request={permissionsRequest || {}}
                requestState={requestState || {}}
                approveSnapResult={(requestId: string) => {
                  approvePendingApproval(requestId, undefined);
                  setPermissionsApproved(true);
                }}
                targetSubjectMetadata={targetSubjectMetadata}
              />
            }
          />
        </Routes>
      )}
    </div>
  );
}

export default PermissionsConnect;
