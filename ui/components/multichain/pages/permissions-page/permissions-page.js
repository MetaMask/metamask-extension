import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isSnapId } from '@metamask/snaps-utils';
import { toast } from '@metamask/design-system-react';
import { Content, Footer, Header, Page } from '../page';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useTheme } from '../../../../hooks/useTheme';
import { TabEmptyState } from '../../../ui/tab-empty-state';
import { ThemeType } from '../../../../../shared/constants/preferences';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Color,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
  REVIEW_PERMISSIONS,
  GATOR_PERMISSIONS,
} from '../../../../helpers/constants/routes';
import {
  getConnectedSitesListWithNetworkInfo,
  getPermissionSubjects,
} from '../../../../selectors';
import { getMergedConnectionsListWithGatorPermissions } from '../../../../selectors/gator-permissions/gator-permissions';
import { isGatorPermissionsRevocationFeatureEnabled } from '../../../../../shared/lib/environment';
import { removePermissionsFor } from '../../../../store/actions';
import { DisconnectAllSitesModal } from '../../disconnect-all-modal';
import { ConnectionListItem } from './connection-list-item';

const TOAST_VISIBLE_DURATION_MS = 5000;

const PermissionsPage = () => {
  const t = useI18nContext();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const headerRef = useRef();

  const fromPath = searchParams.get('from') ?? undefined;

  const handleBack = () => {
    if (fromPath === DEFAULT_ROUTE) {
      navigate(PREVIOUS_ROUTE);
    } else {
      navigate(
        isGatorPermissionsRevocationFeatureEnabled()
          ? GATOR_PERMISSIONS
          : DEFAULT_ROUTE,
      );
    }
  };
  const [totalConnections, setTotalConnections] = useState(0);
  const [showDisconnectAllModal, setShowDisconnectAllModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const mergedConnectionsList = useSelector((state) => {
    if (!isGatorPermissionsRevocationFeatureEnabled()) {
      return getConnectedSitesListWithNetworkInfo(state);
    }
    return getMergedConnectionsListWithGatorPermissions(state);
  });

  const subjects = useSelector(getPermissionSubjects);

  useEffect(() => {
    setTotalConnections(Object.keys(mergedConnectionsList).length);
  }, [mergedConnectionsList]);

  useEffect(() => {
    if (!showSuccessToast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setShowSuccessToast(false);
    }, TOAST_VISIBLE_DURATION_MS);

    toast({
      severity: 'success',
      title: t('disconnectAllSitesSuccess'),
      'data-testid': 'disconnect-all-success-toast',
      hasNoTimeout: true,
      onClose: () => setShowSuccessToast(false),
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [showSuccessToast, t]);

  useEffect(() => {
    if (!showErrorToast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setShowErrorToast(false);
    }, TOAST_VISIBLE_DURATION_MS);

    toast({
      severity: 'danger',
      title: t('disconnectAllSitesError'),
      'data-testid': 'disconnect-all-error-toast',
      hasNoTimeout: true,
      onClose: () => setShowErrorToast(false),
    });

    return () => {
      clearTimeout(timeoutId);
      toast.dismiss();
    };
  }, [showErrorToast, t]);

  const handleDisconnectAll = useCallback(() => {
    const errors = [];
    // Get all non-snap origins from the merged connections list
    const origins = Object.keys(mergedConnectionsList).filter(
      (origin) => !isSnapId(origin),
    );

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
      setShowErrorToast(true);
    } else {
      setShowSuccessToast(true);
    }
  }, [dispatch, mergedConnectionsList, subjects]);

  const handleConnectionClick = (connection) => {
    navigate({
      pathname: REVIEW_PERMISSIONS,
      search: createSearchParams({
        origin: connection.origin,
      }).toString(),
    });
  };

  const renderConnectionsList = (connectionList) =>
    Object.entries(connectionList).map(([itemKey, connection]) => {
      const isSnap = isSnapId(connection.origin);
      return isSnap ? null : (
        <ConnectionListItem
          data-testid="connection-list-item"
          key={itemKey}
          connection={connection}
          onClick={() => handleConnectionClick(connection)}
        />
      );
    });

  return (
    <Page className="main-container" data-testid="permissions-page">
      <Header
        backgroundColor={BackgroundColor.backgroundDefault}
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            className="connections-header__start-accessory"
            color={Color.iconDefault}
            onClick={handleBack}
            size={ButtonIconSize.Sm}
            data-testid="permissions-page-back"
          />
        }
      >
        <Text
          as="span"
          variant={TextVariant.headingMd}
          textAlign={TextAlign.Center}
          data-testid="permissions-page-title"
        >
          {isGatorPermissionsRevocationFeatureEnabled()
            ? t('sites')
            : t('dappConnections')}
        </Text>
      </Header>
      <Content padding={0}>
        <Box ref={headerRef}></Box>
        {totalConnections > 0 ? (
          renderConnectionsList(mergedConnectionsList)
        ) : (
          <Box
            data-testid="no-connections"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.center}
            height={BlockSize.Full}
            padding={4}
          >
            <TabEmptyState
              icon={
                <img
                  src={
                    theme === ThemeType.dark
                      ? '/images/empty-state-permissions-dark.png'
                      : '/images/empty-state-permissions-light.png'
                  }
                  alt={t('permissionsPageEmptyDescription')}
                  width={72}
                  height={72}
                />
              }
              description={t('permissionsPageEmptyDescription')}
              className="mx-auto"
            />
          </Box>
        )}
      </Content>
      {totalConnections > 0 && (
        <Footer>
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
            gap={2}
            alignItems={AlignItems.center}
          >
            <Button
              size={ButtonSize.Lg}
              block
              variant={ButtonVariant.Secondary}
              startIconName={IconName.Logout}
              danger
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
