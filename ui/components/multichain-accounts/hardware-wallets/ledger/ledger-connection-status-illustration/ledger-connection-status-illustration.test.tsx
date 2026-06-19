import React from 'react';
import { render, screen } from '@testing-library/react';

import {
  ALL_LEDGER_CONNECTION_STATUSES,
  getIllustrationImage,
} from '../../../../../../test/unit/hardware-wallets/ledger/helpers';
import {
  LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL,
  type LedgerConnectionStatusType,
} from '../ledger-connection-status';
import { LedgerConnectionStatusIllustration } from '.';

describe('LedgerConnectionStatusIllustration', () => {
  // @ts-expect-error: each is a valid test function in jest
  it.each(ALL_LEDGER_CONNECTION_STATUSES)(
    'renders the illustration mapped to %s',
    (status: LedgerConnectionStatusType) => {
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
    },
  );
});
