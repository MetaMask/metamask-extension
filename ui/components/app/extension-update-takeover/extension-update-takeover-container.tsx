import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  getExtensionUpdatePromptType,
  getIsExtensionUpdatePromptOnAnyRouteEnabled,
} from '../../../selectors/extension-update-prompt';
import {
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
} from '../../../selectors/home-modals';
import { ExtensionUpdateTakeover } from './extension-update-takeover';
import { isExtensionUpdateRestingPathname } from './resting-routes';

/**
 * Mounts the extension update takeover once the wallet is ready for modals.
 *
 * It waits while a dialog or confirmation is open. Unless
 * `extensionUpdatePromptOnAnyRoute` is exactly true, it also waits until the
 * user is on a resting screen. Notification windows never show it.
 */
export function ExtensionUpdateTakeoverContainer() {
  const { pathname } = useLocation();
  const promptType = useSelector(getExtensionUpdatePromptType);
  const displayUpdateModal = useSelector(selectDisplayUpdateModal);
  const isDeferred = useSelector(selectIsUpdateModalDeferred);
  const showOnAnyRoute = useSelector(
    getIsExtensionUpdatePromptOnAnyRouteEnabled,
  );

  if (
    !displayUpdateModal ||
    isDeferred ||
    promptType === 'none' ||
    getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION ||
    (!showOnAnyRoute && !isExtensionUpdateRestingPathname(pathname))
  ) {
    return null;
  }

  return <ExtensionUpdateTakeover promptType={promptType} />;
}
