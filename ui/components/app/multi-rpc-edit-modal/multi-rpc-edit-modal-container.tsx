import React from 'react';
import { useSelector } from 'react-redux';
import { selectShowMultiRpcEditModal } from '../../../selectors';
import MultiRpcEditModal from './multi-rpc-edit-modal';

export function MultiRpcEditModalContainer() {
  const showMultiRpcEditModal = useSelector(selectShowMultiRpcEditModal);

  if (!showMultiRpcEditModal) {
    return null;
  }

  return <MultiRpcEditModal />;
}
