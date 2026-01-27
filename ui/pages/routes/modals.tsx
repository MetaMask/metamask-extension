import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import type { AccountGroupId } from '@metamask/account-api';
import { NetworkListMenu } from '../../components/multichain/network-list-menu';
import { MultichainAccountEditModal } from '../../components/multichain-accounts/multichain-account-edit-modal';
import { setEditedNetwork } from '../../store/actions';
import { useQueryState } from '../../hooks/useQueryState';

export const Modals = () => {
  const dispatch = useDispatch();
  const [, setSearchParams] = useSearchParams();
  const [show] = useQueryState('show');
  const [accountId] = useQueryState('account-id');

  const handleClose = useCallback(() => {
    setSearchParams({}, { replace: true });
    dispatch(setEditedNetwork());
  }, [setSearchParams, dispatch]);

  return (
    <>
      {show === 'network' && <NetworkListMenu onClose={handleClose} />}

      {show === 'rename-account' && accountId && (
        <MultichainAccountEditModal
          isOpen={true}
          accountGroupId={decodeURIComponent(accountId) as AccountGroupId}
          onClose={handleClose}
        />
      )}
    </>
  );
};
