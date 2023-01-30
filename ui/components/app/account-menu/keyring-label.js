import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { HardwareKeyringNames } from '../../../../shared/constants/hardware-wallets';
import { KeyringTypes } from '../../../../shared/constants/keyring';

export default function KeyRingLabel({ keyring }) {
  const t = useI18nContext();

  let label = null;

  // Keyring value might take a while to get a value
  if (!keyring) {
    return null;
  }
  const { type } = keyring;

  switch (type) {
    case KeyringTypes.qr:
      label = HardwareKeyringNames.qr;
      break;
    case KeyringTypes.imported:
      label = t('imported');
      break;
    case KeyringTypes.trezor:
      label = HardwareKeyringNames.trezor;
      break;
    case KeyringTypes.ledger:
      label = HardwareKeyringNames.ledger;
      break;
    case KeyringTypes.lattice:
      label = HardwareKeyringNames.lattice;
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
