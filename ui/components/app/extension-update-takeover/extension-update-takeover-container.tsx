import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
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
 * It stays hidden while the wallet is locked. It waits while a dialog or
 * confirmation is open. Unless `extensionUpdatePromptOnAnyRoute` is exactly
 * true, it also waits until the user is on a resting screen. That flag does
 * not skip the lock or the dialog check. Notification windows never show it.
 */
export function ExtensionUpdateTakeoverContainer() {
  const { pathname } = useLocation();
  const isUnlocked = useSelector(getIsUnlocked);
  const promptType = useSelector(getExtensionUpdatePromptType);
  const displayUpdateModal = useSelector(selectDisplayUpdateModal);
  const isDeferred = useSelector(selectIsUpdateModalDeferred);
  const showOnAnyRoute = useSelector(
    getIsExtensionUpdatePromptOnAnyRouteEnabled,
  );

  if (
    !isUnlocked ||
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
