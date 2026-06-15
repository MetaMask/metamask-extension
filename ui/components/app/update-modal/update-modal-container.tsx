import React from 'react';
import { useSelector } from 'react-redux';
import { selectDisplayUpdateModal } from '../../../selectors';
import UpdateModal from './update-modal';

export function UpdateModalContainer() {
  const displayUpdateModal = useSelector(selectDisplayUpdateModal);

  if (!displayUpdateModal) {
    return null;
  }

  return <UpdateModal />;
}
