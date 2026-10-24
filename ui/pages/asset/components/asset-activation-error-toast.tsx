import { Box, Icon, IconColor, IconName } from '@metamask/design-system-react';
import React from 'react';

import { Toast } from '../../../components/multichain/toast/toast';

export const ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS = 5000;

export type AssetActivationErrorToastProps = {
  message: string | null;
  onClose: () => void;
};

/**
 * Asset activation error toast: displays an error message when an asset activation fails.
 *
 * @param params - Asset activation error toast parameters
 * @param params.message - The error message
 * @param params.onClose - The function to call when the toast is closed
 */
export const AssetActivationErrorToast = ({
  message,
  onClose,
}: AssetActivationErrorToastProps) => {
  if (!message) {
    return null;
  }

  return (
    <Box marginTop={3} data-testid={`asset-activation-error-container`}>
      <Toast
        startAdornment={
          <Icon name={IconName.Danger} color={IconColor.ErrorDefault} />
        }
        text={message}
        onClose={onClose}
        autoHideTime={ASSET_ACTIVATION_ERROR_TOAST_DURATION_MS}
        onAutoHideToast={onClose}
      />
    </Box>
  );
};
