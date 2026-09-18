import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  ALL_LEDGER_CONNECTION_STATUSES,
  getIllustrationImage,
} from '../../../../../../test/unit/hardware-wallets/ledger/helpers';
import { LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL } from '../ledger-connection-status.constants';
import { LedgerConnectionStatusIllustration } from '.';

describe('LedgerConnectionStatusIllustration', () => {
  ALL_LEDGER_CONNECTION_STATUSES.forEach((status) => {
    it(`renders the illustration mapped to ${status}`, () => {
      const { container } = render(
        <LedgerConnectionStatusIllustration status={status} />,
      );

      expect(
        screen.getByTestId('ledger-connection-status-illustration'),
      ).toBeInTheDocument();

      const image = getIllustrationImage(container);
      expect(image).toHaveAttribute(
        'src',
        LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[status],
      );
      expect(image).toHaveAttribute('alt', '');
    });
  });
});
