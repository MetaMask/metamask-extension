import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithLocalization } from '../../../../../../test/lib/render-helpers';
import {
  ALL_LEDGER_CONNECTION_STATUSES,
  getConfiguredLocaleMessageKeys,
  getLocalizedMessage,
  getStatusRootTestId,
  STATUSES_WITHOUT_DESCRIPTION,
  STATUSES_WITHOUT_INSTRUCTIONS,
  STATUSES_WITH_DESCRIPTION,
} from '../../../../../../test/unit/hardware-wallets/ledger/helpers';
import type { LedgerConnectionStatusProps } from './ledger-connection-status.types';
import {
  LEDGER_CONNECTION_STATUS,
  LEDGER_CONNECTION_STATUS_CONTENT,
  LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL,
  LedgerConnectionStatus,
} from '.';

const renderLedgerConnectionStatus = (props: LedgerConnectionStatusProps) =>
  renderWithLocalization(<LedgerConnectionStatus {...props} />);

describe('LedgerConnectionStatus', () => {
  describe('status content', () => {
    STATUSES_WITH_DESCRIPTION.forEach(
      ({ status, titleKey, descriptionKey }) => {
        it(`renders localized title and description for ${status}`, () => {
          renderLedgerConnectionStatus({ status });

          expect(
            screen.getByTestId(getStatusRootTestId(status)),
          ).toBeInTheDocument();
          expect(
            screen.getByTestId('ledger-connection-status-title'),
          ).toHaveTextContent(getLocalizedMessage(titleKey));
          expect(
            screen.getByTestId('ledger-connection-status-description'),
          ).toHaveTextContent(getLocalizedMessage(descriptionKey));
          expect(
            screen.getByTestId('ledger-connection-status-illustration'),
          ).toBeInTheDocument();
        });
      },
    );

    STATUSES_WITHOUT_DESCRIPTION.forEach(({ status, titleKey }) => {
      it(`renders localized title without a description for ${status}`, () => {
        renderLedgerConnectionStatus({ status });

        expect(
          screen.getByTestId('ledger-connection-status-title'),
        ).toHaveTextContent(getLocalizedMessage(titleKey));
        expect(
          screen.queryByTestId('ledger-connection-status-description'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('device selector integration', () => {
    it('renders the device selector when device-found includes a model name', () => {
      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.DeviceFound,
        deviceModelName: 'Nano X',
      });

      expect(screen.getByText('Nano X')).toBeInTheDocument();
      expect(
        screen.getByTestId('ledger-connection-status-device-selector'),
      ).toBeInTheDocument();
    });

    it('omits the device selector when the model name is missing', () => {
      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.DeviceFound,
      });

      expect(
        screen.queryByTestId('ledger-connection-status-device-selector'),
      ).not.toBeInTheDocument();
    });

    it('omits the device selector when the model name is an empty string', () => {
      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.DeviceFound,
        deviceModelName: '',
      });

      expect(
        screen.queryByTestId('ledger-connection-status-device-selector'),
      ).not.toBeInTheDocument();
    });

    it('omits the device selector outside the device-found state even with a model name', () => {
      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.Searching,
        deviceModelName: 'Nano X',
      });

      expect(
        screen.queryByTestId('ledger-connection-status-device-selector'),
      ).not.toBeInTheDocument();
    });
  });

  describe('instructions integration', () => {
    it('renders troubleshooting instructions for device-not-found', () => {
      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.DeviceNotFound,
      });

      expect(
        screen.getByTestId('ledger-connection-status-instructions'),
      ).toBeInTheDocument();
    });

    STATUSES_WITHOUT_INSTRUCTIONS.forEach((status) => {
      it(`does not render troubleshooting instructions for ${status}`, () => {
        renderLedgerConnectionStatus({ status });

        expect(
          screen.queryByTestId('ledger-connection-status-instructions'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('back navigation', () => {
    it('renders the back button and invokes onBack when clicked', async () => {
      const user = userEvent.setup();
      const onBack = jest.fn();

      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.Searching,
        onBack,
      });

      await user.click(screen.getByTestId('ledger-connection-status-back'));

      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('omits the back button when onBack is not provided', () => {
      renderLedgerConnectionStatus({
        status: LEDGER_CONNECTION_STATUS.Searching,
      });

      expect(
        screen.queryByTestId('ledger-connection-status-back'),
      ).not.toBeInTheDocument();
    });
  });
});

describe('ledger connection status configuration', () => {
  it('defines a title and illustration for every status', () => {
    ALL_LEDGER_CONNECTION_STATUSES.forEach((status) => {
      expect(LEDGER_CONNECTION_STATUS_CONTENT[status].titleKey).toBeTruthy();
      expect(LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[status]).toMatch(
        /^\.\/images\/hardware-wallets\/ledger-connection\/.+\.png$/u,
      );
    });
  });

  it('maps every configured message key to an English locale entry', () => {
    getConfiguredLocaleMessageKeys().forEach((messageKey) => {
      expect(getLocalizedMessage(messageKey)).toBeTruthy();
    });
  });

  it('marks only device-found as the selector state', () => {
    ALL_LEDGER_CONNECTION_STATUSES.forEach((status) => {
      const { showDeviceSelector } = LEDGER_CONNECTION_STATUS_CONTENT[status];
      expect(Boolean(showDeviceSelector)).toBe(
        status === LEDGER_CONNECTION_STATUS.DeviceFound,
      );
    });
  });

  it('defines instructions only for device-not-found', () => {
    ALL_LEDGER_CONNECTION_STATUSES.forEach((status) => {
      const { instructions } = LEDGER_CONNECTION_STATUS_CONTENT[status];
      if (status === LEDGER_CONNECTION_STATUS.DeviceNotFound) {
        expect(instructions).toHaveLength(4);
        return;
      }

      expect(instructions).toBeUndefined();
    });
  });

  it('reuses the inactive illustration for unresponsive, locked, and not-found states', () => {
    const inactiveIllustration =
      LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[
        LEDGER_CONNECTION_STATUS.DeviceUnresponsive
      ];

    expect(
      LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[
        LEDGER_CONNECTION_STATUS.DeviceLocked
      ],
    ).toBe(inactiveIllustration);
    expect(
      LEDGER_CONNECTION_STATUS_ILLUSTRATION_URL[
        LEDGER_CONNECTION_STATUS.DeviceNotFound
      ],
    ).toBe(inactiveIllustration);
  });
});
