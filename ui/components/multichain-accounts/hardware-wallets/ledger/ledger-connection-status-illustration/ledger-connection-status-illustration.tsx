import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

import { LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL } from '../ledger-connection-status.constants';
import type { LedgerConnectionStatusIllustrationProps } from './ledger-connection-status-illustration.types';

/**
 * Renders the Ledger device illustration for a given connection state.
 * @param options0
 * @param options0.status
 */
export const LedgerConnectionStatusIllustration = ({
  status,
}: Readonly<LedgerConnectionStatusIllustrationProps>) => (
  <Box
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Center}
    className="w-full shrink-0"
    data-testid="ledger-connection-status-illustration"
  >
    <img
      src={LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[status]}
      alt=""
      className="block h-auto max-h-[278px] w-full object-contain"
    />
  </Box>
);

export default LedgerConnectionStatusIllustration;
