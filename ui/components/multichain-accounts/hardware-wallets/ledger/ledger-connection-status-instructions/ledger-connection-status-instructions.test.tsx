import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../../../../test/lib/render-helpers';
import { LEDGER_CONNECTION_STATUS } from '../ledger-connection-status.constants';
import {
  DEVICE_NOT_FOUND_INSTRUCTION_MESSAGE_KEYS,
  getLocalizedMessage,
} from '../../../../../../test/unit/hardware-wallets/ledger/helpers';
import { LedgerConnectionStatusInstructions } from '.';

describe('LedgerConnectionStatusInstructions', () => {
  it('renders exactly four troubleshooting steps for device-not-found', () => {
    renderWithLocalization(
      <LedgerConnectionStatusInstructions
        status={LEDGER_CONNECTION_STATUS.DeviceNotFound}
      />,
    );

    expect(
      screen.getAllByTestId(/^ledger-connection-status-instruction-/u),
    ).toHaveLength(4);
  });

  DEVICE_NOT_FOUND_INSTRUCTION_MESSAGE_KEYS.forEach((messageKey) => {
    it(`renders localized copy for ${messageKey}`, () => {
      renderWithLocalization(
        <LedgerConnectionStatusInstructions
          status={LEDGER_CONNECTION_STATUS.DeviceNotFound}
        />,
      );

      expect(
        screen.getByText(getLocalizedMessage(messageKey)),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(
          `ledger-connection-status-instruction-${messageKey}`,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('ledger-connection-status-instructions'),
      ).toBeInTheDocument();
    });
  });
});
