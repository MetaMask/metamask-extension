import React from 'react';
import { useSelector } from 'react-redux';

import { useI18nContext } from '../../../hooks/useI18nContext';

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

// TODO:  figure out the proper t/context usage:
const t = (name) => name;

export const LEDGER_TRANSPORT_NAMES = {
  LIVE: t('ledgerLive'),
  WEBHID: t('webhid'),
  U2F: t('u2f'),
};

const TRANSPORT_TYPE_OPTIONS = [
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
  TRANSPORT_TYPE_OPTIONS.push({
    name: LEDGER_TRANSPORT_NAMES.WEBHID,
    value: LEDGER_TRANSPORT_TYPES.WEBHID,
  });
}

export default function LedgerTransportDropdown() {
  const ledgerTransportType = useSelector(getLedgerTransportType);
  const userHasALedgerAccount = useSelector(doesUserHaveALedgerAccount);

  return (
    <>
      <Dropdown
        id="select-ledger-transport-type"
        options={TRANSPORT_TYPE_OPTIONS}
        selectedOption={ledgerTransportType}
        onChange={async (transportType) => {
          if (
            ledgerTransportType === LEDGER_TRANSPORT_TYPES.LIVE &&
            transportType === LEDGER_TRANSPORT_TYPES.WEBHID
          ) {
            this.setState({ showLedgerTransportWarning: true });
          }
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
    </>
  );
}
