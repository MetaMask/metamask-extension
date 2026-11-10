import React from 'react';
import { useSelector } from 'react-redux';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getExtensionUpdatePromptType } from '../../../selectors/extension-update-prompt';
import {
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
} from '../../../selectors/home-modals';
import { ExtensionUpdateTakeover } from './extension-update-takeover';

/**
 * Mounts the extension update takeover once the wallet is ready for modals and
 * no flow the user is in the middle of is open. Notification windows never
 * show it.
 */
export function ExtensionUpdateTakeoverContainer() {
  const promptType = useSelector(getExtensionUpdatePromptType);
  const displayUpdateModal = useSelector(selectDisplayUpdateModal);
  const isDeferred = useSelector(selectIsUpdateModalDeferred);

  if (
    !displayUpdateModal ||
    isDeferred ||
    promptType === 'none' ||
    getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION
  ) {
    return null;
  }

  return <ExtensionUpdateTakeover promptType={promptType} />;
}
