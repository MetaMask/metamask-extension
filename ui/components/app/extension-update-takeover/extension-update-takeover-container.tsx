import React from 'react';
import { useSelector } from 'react-redux';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  getExtensionUpdatePromptType,
  getIsExtensionUpdatePromptOnNotificationEnabled,
} from '../../../selectors/extension-update-prompt';
import {
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
  selectIsUpdateModalDeferredByOpenFlow,
} from '../../../selectors/home-modals';
import { ExtensionUpdateTakeover } from './extension-update-takeover';

/**
 * Mounts the extension update takeover once the wallet is ready for modals and
 * no flow the user is in the middle of is open.
 *
 * Notification windows stay on the confirmation unless
 * `extensionUpdatePromptOnNotification` is exactly true. When it is, a pending
 * confirmation does not hide the takeover: that confirmation is the window.
 */
export function ExtensionUpdateTakeoverContainer() {
  const promptType = useSelector(getExtensionUpdatePromptType);
  const displayUpdateModal = useSelector(selectDisplayUpdateModal);
  const isDeferred = useSelector(selectIsUpdateModalDeferred);
  const isDeferredByOpenFlow = useSelector(
    selectIsUpdateModalDeferredByOpenFlow,
  );
  const showOnNotification = useSelector(
    getIsExtensionUpdatePromptOnNotificationEnabled,
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

  if (isDeferred) {
    return null;
  }

  return <ExtensionUpdateTakeover promptType={promptType} />;
}
