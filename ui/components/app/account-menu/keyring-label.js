import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  HardwareKeyringNames,
  HardwareKeyringTypes,
} from '../../../../shared/constants/hardware-wallets';

export default function KeyRingLabel({ keyring }) {
  const t = useI18nContext();

  let label = null;

  // Keyring value might take a while to get a value
  if (!keyring) {
    return null;
  }
  const { type } = keyring;

  switch (type) {
    case HardwareKeyringTypes.qr:
      label = HardwareKeyringNames.qr;
      break;
    case HardwareKeyringTypes.imported:
      label = t('imported');
      break;
    case HardwareKeyringTypes.trezor:
      label = HardwareKeyringNames.trezor;
      break;
    case HardwareKeyringTypes.ledger:
      label = HardwareKeyringNames.ledger;
      break;
    case HardwareKeyringTypes.lattice:
      label = HardwareKeyringNames.lattice;
      break;
    case 'Snap Keyring':
      label = HardwareKeyringNames.snap;
      break;
    default:
      return null;
  }

  return (
    <>{label ? <div className="keyring-label allcaps">{label}</div> : null}</>
  );
}

KeyRingLabel.propTypes = {
  keyring: PropTypes.object,
};
