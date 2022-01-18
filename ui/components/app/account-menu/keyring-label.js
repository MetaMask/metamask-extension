import React from 'react';
import PropTypes from 'prop-types';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { KEYRING_TYPES } from '../../../../shared/constants/hardware-wallets';

export default function KeyRingLabel(props) {
  const t = useI18nContext();

  const { keyring } = props;

  let label = null;

  // Keyring value might take a while to get a value
  if (keyring) {
    const { type } = keyring;
    if (type === KEYRING_TYPES.QR) {
      label = 'QR';
    } else if (type === 'Simple Key Pair') {
      label = t('imported');
    } else if (type === KEYRING_TYPES.TREZOR) {
      label = 'Trezor';
    } else if (type === KEYRING_TYPES.LEDGER) {
      label = 'Ledger';
    } else if (type === KEYRING_TYPES.LATTICE) {
      label = 'Lattice1';
    }
  }

  return (
    <>{label ? <div className="keyring-label allcaps">{label}</div> : null}</>
  );
}

KeyRingLabel.propTypes = {
  keyring: PropTypes.object,
};
