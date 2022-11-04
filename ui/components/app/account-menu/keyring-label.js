import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  KEYRING_NAMES,
  KEYRING_TYPES,
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
    case KEYRING_TYPES.QR:
      label = KEYRING_NAMES.QR;
      break;
    case KEYRING_TYPES.IMPORTED:
      label = t('imported');
      break;
    case KEYRING_TYPES.TREZOR:
      label = KEYRING_NAMES.TREZOR;
      break;
    case KEYRING_TYPES.LEDGER:
      label = KEYRING_NAMES.LEDGER;
      break;
    case KEYRING_TYPES.LATTICE:
      label = KEYRING_NAMES.LATTICE;
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
