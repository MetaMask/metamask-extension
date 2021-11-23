import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Dialog from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';
import Dropdown from '../../../components/ui/dropdown/dropdown';

import {
  LEDGER_TRANSPORT_TYPES,
  LEDGER_USB_VENDOR_ID,
} from '../../../../shared/constants/hardware-wallets';

import {
  getLedgerTransportType,
  doesUserHaveALedgerAccount,
} from '../../../ducks/metamask/metamask';

import { setLedgerTransportPreference } from '../../../store/actions';

export default function LedgerTransportDropdown() {
  const [showLedgerTransportWarning, setShowLedgerTransportWarning] = useState(
    false,
  );
  const [ledgerTransportType, setLedgerTransportType] = useState(
    useSelector(getLedgerTransportType),
  );

  const t = useI18nContext();

  const userHasALedgerAccount = useSelector(doesUserHaveALedgerAccount);

  const LEDGER_TRANSPORT_NAMES = {
    LIVE: t('ledgerLive'),
    WEBHID: t('webhid'),
    U2F: t('u2f'),
  };

  const transportTypeOptions = [
    {
      name: LEDGER_TRANSPORT_NAMES.LIVE,
      value: LEDGER_TRANSPORT_TYPES.LIVE,
    },
    {
      name: LEDGER_TRANSPORT_NAMES.U2F,
      value: LEDGER_TRANSPORT_TYPES.U2F,
    },
  ];

  if (window.navigator.hid) {
    transportTypeOptions.push({
      name: LEDGER_TRANSPORT_NAMES.WEBHID,
      value: LEDGER_TRANSPORT_TYPES.WEBHID,
    });
  }

  const recommendedLedgerOption = window.navigator.hid
    ? LEDGER_TRANSPORT_NAMES.WEBHID
    : LEDGER_TRANSPORT_NAMES.U2F;

  return (
    <div className="settings-page__content-row">
      <div className="settings-page__content-item">
        <span>{t('preferredLedgerConnectionType')}</span>
        <div className="settings-page__content-description">
          {t('ledgerConnectionPreferenceDescription', [
            recommendedLedgerOption,
            <Button
              key="ledger-connection-settings-learn-more"
              type="link"
              href="https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet"
              target="_blank"
              rel="noopener noreferrer"
              className="settings-page__inline-link"
            >
              {t('learnMore')}
            </Button>,
          ])}
        </div>
      </div>
      <div className="settings-page__content-item">
        <div className="settings-page__content-item-col">
          <Dropdown
            id="select-ledger-transport-type"
            options={transportTypeOptions}
            selectedOption={ledgerTransportType}
            onChange={async (transportType) => {
              if (
                ledgerTransportType === LEDGER_TRANSPORT_TYPES.LIVE &&
                transportType === LEDGER_TRANSPORT_TYPES.WEBHID
              ) {
                setShowLedgerTransportWarning(true);
              }
              setLedgerTransportType(transportType);
              setLedgerTransportPreference(transportType);
              if (
                transportType === LEDGER_TRANSPORT_TYPES.WEBHID &&
                userHasALedgerAccount
              ) {
                await window.navigator.hid.requestDevice({
                  filters: [{ vendorId: LEDGER_USB_VENDOR_ID }],
                });
              }
            }}
          />
          {showLedgerTransportWarning ? (
            <Dialog type="message">
              <div className="settings-page__content-item-dialog">
                {t('ledgerTransportChangeWarning')}
              </div>
            </Dialog>
          ) : null}
        </div>
      </div>
    </div>
  );
}
