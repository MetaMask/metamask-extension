import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  getExtensionUpdatePromptType,
  getIsExtensionUpdatePromptOnAnyRouteEnabled,
  getIsExtensionUpdatePromptOnNotificationEnabled,
} from '../../../selectors/extension-update-prompt';
import {
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
  selectIsUpdateModalDeferredByOpenFlow,
} from '../../../selectors/home-modals';
import { ExtensionUpdateTakeover } from './extension-update-takeover';
import { isExtensionUpdateRestingPathname } from './resting-routes';

/**
 * Mounts the extension update takeover once the wallet is ready for modals.
 *
 * It waits while a dialog or confirmation is open. Unless
 * `extensionUpdatePromptOnAnyRoute` is exactly true, it also waits until the
 * user is on a resting screen.
 *
 * Notification windows stay on the confirmation unless
 * `extensionUpdatePromptOnNotification` is exactly true. When it is, a pending
 * confirmation does not hide the takeover: that confirmation is the window,
 * so the resting-screen check does not apply there.
 */
export function ExtensionUpdateTakeoverContainer() {
  const { pathname } = useLocation();
  const promptType = useSelector(getExtensionUpdatePromptType);
  const displayUpdateModal = useSelector(selectDisplayUpdateModal);
  const isDeferred = useSelector(selectIsUpdateModalDeferred);
  const isDeferredByOpenFlow = useSelector(
    selectIsUpdateModalDeferredByOpenFlow,
  );
  const showOnNotification = useSelector(
    getIsExtensionUpdatePromptOnNotificationEnabled,
  );
  const showOnAnyRoute = useSelector(
    getIsExtensionUpdatePromptOnAnyRouteEnabled,
  );
  const isNotification = getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION;

  if (!displayUpdateModal || promptType === 'none') {
    return null;
  }

  if (isNotification) {
    if (!showOnNotification || isDeferredByOpenFlow) {
      return null;
    }
    return <ExtensionUpdateTakeover promptType={promptType} />;
  }

  if (
    isDeferred ||
    (!showOnAnyRoute && !isExtensionUpdateRestingPathname(pathname))
  ) {
    return null;
  }

  return <ExtensionUpdateTakeover promptType={promptType} />;
}
