import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { KEYRING_TYPES } from '../../../../shared/constants/hardware-wallets';

export default function KeyRingLabel(props) {
  const t = useI18nContext();

  const { keyring } = props;

  let label = null;

  // Keyring value might take a while to get a value
  if (!keyring) {
    return null;
  }

  const { type } = keyring;

  switch (type) {
    case KEYRING_TYPES.QR:
      label = 'QR';
      break;
    case 'Simple Key Pair':
      label = t('imported');
      break;
    case KEYRING_TYPES.TREZOR:
      label = 'Trezor';
      break;
    case KEYRING_TYPES.LEDGER:
      label = 'Ledger';
      break;
    case KEYRING_TYPES.LATTICE:
      label = 'Lattice1';
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
