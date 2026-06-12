import { Box } from '@metamask/design-system-react';
import React from 'react';

import { Icon, IconName } from '../../../components/component-library';
import { Toast } from '../../../components/multichain/toast/toast';
import { IconColor } from '../../../helpers/constants/design-system';

export const STELLAR_TRUSTLINE_ERROR_TOAST_DURATION_MS = 5000;

export type StellarClassicTrustlineErrorToastProps = {
  message: string | null;
  onClose: () => void;
  dataTestId: string;
};

/**
 * Dismissible inline error toast for Stellar classic trustline actions on the asset page.
 * @param options0
 * @param options0.message
 * @param options0.onClose
 * @param options0.dataTestId
 */
export const StellarClassicTrustlineErrorToast = ({
  message,
  onClose,
  dataTestId,
}: StellarClassicTrustlineErrorToastProps) => {
  if (!message) {
    return null;
  }

  return (
    <Box marginTop={3} data-testid={`${dataTestId}-container`}>
      <Toast
        dataTestId={dataTestId}
        startAdornment={
          <Icon name={IconName.Danger} color={IconColor.errorDefault} />
        }
        text={message}
        onClose={onClose}
        autoHideTime={STELLAR_TRUSTLINE_ERROR_TOAST_DURATION_MS}
        onAutoHideToast={onClose}
      />
    </Box>
  );
};
