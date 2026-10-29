import React from 'react';
import { useSelector } from 'react-redux';
import { getShowShieldEntryModal } from '../../../selectors';
import ShieldEntryModal from './shield-entry-modal';

export function ShieldEntryModalContainer() {
  const showShieldEntryModal = useSelector(getShowShieldEntryModal);

  if (!showShieldEntryModal) {
    return null;
  }

  return <ShieldEntryModal />;
}
