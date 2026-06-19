import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

import {
  LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL,
  type LedgerConnectionStatusType,
} from '../ledger-connection-status/ledger-connection-status.constants';

type LedgerConnectionStatusIllustrationProps = {
  /** Connection state that determines which illustration PNG to render. */
  status: LedgerConnectionStatusType;
};

/**
 * Renders the Ledger device illustration for a given connection state.
 * @param options0
 * @param options0.status
 */
export const LedgerConnectionStatusIllustration = ({
  status,
}: LedgerConnectionStatusIllustrationProps) => (
  <Box
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Center}
    className="ledger-connection-status__illustration w-full shrink-0"
    data-testid="ledger-connection-status-illustration"
  >
    <img
      src={LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[status]}
      alt=""
      className="ledger-connection-status__illustration-image block h-auto max-h-[278px] w-full object-contain"
    />
  </Box>
);

export default LedgerConnectionStatusIllustration;
