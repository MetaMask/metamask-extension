import React, { useCallback, useMemo } from 'react';
import { PageContainerFooter } from '../../../components/ui/page-container';
import PermissionsConnectPermissionList from '../../../components/app/permissions-connect-permission-list';
import PermissionsConnectFooter from '../../../components/app/permissions-connect-footer';
import PermissionConnectHeader from '../../../components/app/permissions-connect-header';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useDispatch } from 'react-redux';
import { hideModal, showSnapInstallWarning } from '../../../store/actions';

export default function SnapInstall({
  request,
  approveSnapInstall,
  rejectSnapInstall,
  targetSubjectMetadata,
}) {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const onCancel = useCallback(() => rejectSnapInstall(request.metadata.id), [
    request,
  ]);
  const onSubmit = useCallback(() => approveSnapInstall(request), [request]);
  const showWarning = useCallback(
    () =>
      dispatch(
        showSnapInstallWarning(targetSubjectMetadata.name, () => {
          dispatch(hideModal());
          approveSnapInstall(request);
        }),
      ),
    [request, targetSubjectMetadata],
  );

  const npmId = useMemo(() => {
    if (!targetSubjectMetadata.origin.startsWith('npm:')) {
      return undefined;
    }
    return targetSubjectMetadata.origin.substring(4);
  }, [targetSubjectMetadata]);
  const shouldShowWarning = useMemo(
    () =>
      Boolean(
        Object.keys(request.permissions).find((v) =>
          v.startsWith('snap_getBip44Entropy_'),
        ),
      ),
    [request.permissions],
  );

  return (
    <div className="page-container snap-install">
      <div className="headers">
        <PermissionConnectHeader
          icon={targetSubjectMetadata.iconUrl}
          iconName={targetSubjectMetadata.name}
          headerTitle={'Install Snap'}
          headerText={null} // TODO(ritave): Add header text when snaps support description
          siteOrigin={targetSubjectMetadata.name}
          npmPackageName={npmId}
        />
        <div className="snap-requests-permission">
          {t('snapRequestsPermission')}
        </div>
        <PermissionsConnectPermissionList permissions={request.permissions} />
      </div>
      <div className="footers">
        {targetSubjectMetadata.sourceCode ? (
          <div className="source-code">
            <div className="text">{t('areYouDeveloper')}</div>
            <div
              className="link"
              onClick={() =>
                global.platform.openTab({
                  url: targetSubjectMetadata.sourceCode,
                })
              }
            >
              {t('openSourceCode')}
            </div>
          </div>
        ) : null}
        <PermissionsConnectFooter />
        <PageContainerFooter
          cancelButtonTyype="default"
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={shouldShowWarning ? showWarning : onSubmit}
          submitText={t('approveAndInstall')}
          buttonsSizeLarge={false}
        />
      </div>
    </div>
  );
}
