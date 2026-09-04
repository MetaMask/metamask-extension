import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useSelector } from 'react-redux';
import { isSnapId } from '@metamask/snaps-utils';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { Content, Footer, Header, Page } from '../page';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PermissionsEmptyState } from '../gator-permissions/components';
import { BackgroundColor } from '../../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  REVIEW_PERMISSIONS,
  TOKEN_TRANSFER_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  getConnectedSitesListWithNetworkInfo,
  getPermissionSubjects,
} from '../../../../selectors';
import { getMergedConnectionsListWithGatorPermissions } from '../../../../selectors/gator-permissions/gator-permissions';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../../shared/lib/environment';
import { removePermissionsFor } from '../../../../store/actions';
import { useGlobalMenuRouteTransition } from '../../../../pages/routes/global-menu-route-transition';
import { transitionForward } from '../../../ui/transition';
import { DisconnectAllSitesModal } from '../../disconnect-all-modal';
import { toast } from '../../../ui/toast/toast';
import { useDispatch } from '../../../../store/hooks';
import { ConnectionListItem } from './connection-list-item';

const PermissionsPage = () => {
  const t = useI18nContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();
  const dispatch = useDispatch();
  const headerRef = useRef();

  const fromPath = searchParams.get('from') ?? DEFAULT_ROUTE;

  const handleBack = () => {
    if (fromPath === DEFAULT_ROUTE) {
      runCloseTransition(() => navigate(-1));
    } else {
      navigate(DEFAULT_ROUTE);
    }
  };
  const [showDisconnectAllModal, setShowDisconnectAllModal] = useState(false);

  const mergedConnectionsList = useSelector((state) => {
    if (!isGatorPermissionsRevocationFeatureEnabled()) {
      return getConnectedSitesListWithNetworkInfo(state);
    }
    return getMergedConnectionsListWithGatorPermissions(state);
  });

  const subjects = useSelector(getPermissionSubjects);

  const nonSnapConnections = useMemo(() => {
    return Object.entries(mergedConnectionsList).filter(
      ([origin]) => !isSnapId(origin),
    );
  }, [mergedConnectionsList]);

  const handleDisconnectAll = useCallback(() => {
    const errors = [];
    const origins = nonSnapConnections.map(([origin]) => origin);

    origins.forEach((origin) => {
      try {
        const subject = subjects[origin];
        if (subject) {
          const permissionMethodNames = Object.values(subject.permissions).map(
            ({ parentCapability }) => parentCapability,
          );
          if (permissionMethodNames.length > 0) {
            const permissionsRecord = {
              [origin]: permissionMethodNames,
            };
            dispatch(removePermissionsFor(permissionsRecord));
          }
        }
      } catch (error) {
        errors.push({ origin, error });
      }
    });

    setShowDisconnectAllModal(false);

    if (errors.length > 0) {
      toast.error(t('disconnectAllSitesError'), {
        id: 'disconnect-all-error-toast',
      });
    } else {
      toast.success(t('disconnectAllSitesSuccess'), {
        id: 'disconnect-all-success-toast',
      });
    }
  }, [dispatch, nonSnapConnections, subjects, t]);

  const handleConnectionClick = (connection) => {
    const hasOnlyAdvancedPermissions =
      !connection.addresses?.length &&
      (connection.advancedPermissionsCount ?? 0) > 0;

    transitionForward(() => {
      if (hasOnlyAdvancedPermissions) {
        navigate(
          `${TOKEN_TRANSFER_ROUTE}/${encodeURIComponent(connection.origin)}`,
        );
        return;
      }

      navigate({
        pathname: REVIEW_PERMISSIONS,
        search: createSearchParams({
          origin: connection.origin,
        }).toString(),
      });
    });
  };

  const renderConnectionsList = () =>
    nonSnapConnections.map(([itemKey, connection]) => (
      <ConnectionListItem
        data-testid="connection-list-item"
        key={itemKey}
        connection={connection}
        onClick={() => handleConnectionClick(connection)}
      />
    ));

  return (
    <Page
      className="main-container"
      data-testid="parent-selector-permission-list"
    >
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            iconProps={{ className: IconColor.IconDefault }}
            onClick={handleBack}
            size={ButtonIconSize.Md}
            data-testid="permissions-page-back"
          />
        }
        textProps={{ 'data-testid': 'permissions-page-title' }}
      >
        {t('permissions')}
      </Header>
      <Content className="p-0">
        <Box ref={headerRef} />
        {nonSnapConnections.length > 0 ? (
          renderConnectionsList()
        ) : (
          <Box
            data-testid="no-connections"
            className="flex h-full flex-col items-center justify-center p-4"
          >
            <PermissionsEmptyState />
          </Box>
        )}
      </Content>
      {nonSnapConnections.length > 0 && (
        <Footer>
          <Box className="flex w-full flex-col items-center gap-2">
            <Button
              size={ButtonSize.Lg}
              isFullWidth
              variant={ButtonVariant.Secondary}
              isDanger
              onClick={() => setShowDisconnectAllModal(true)}
              data-testid="disconnect-all-button"
            >
              {t('disconnectAllSites')}
            </Button>
          </Box>
        </Footer>
      )}
      <DisconnectAllSitesModal
        isOpen={showDisconnectAllModal}
        onClose={() => setShowDisconnectAllModal(false)}
        onClick={handleDisconnectAll}
      />
    </Page>
  );
};

export default PermissionsPage;
