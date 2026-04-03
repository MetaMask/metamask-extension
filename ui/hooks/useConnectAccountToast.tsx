import React, { useCallback, useEffect } from 'react';
import { batch, useDispatch, useSelector, shallowEqual } from 'react-redux';
import { createSelector } from 'reselect';
import { getAllScopesFromCaip25CaveatValue } from '@metamask/chain-agnostic-permission';
import { toast } from '../../shared/lib/toast';
import { getOriginOfCurrentTab, getPermissions } from '../selectors';
import {
  getSelectedAccountGroup,
  selectSelectedAccountGroup,
  selectSeedAddressForSelectedAccountGroup,
} from '../selectors/multichain-accounts/account-tree';
import { hasChainIdSupport } from '../../shared/lib/multichain/scope-utils';
import { getCaip25CaveatValueFromPermissions } from '../pages/permissions-connect/connect-page/utils';
import { selectShowConnectAccountGroupToast } from '../components/app/toast-master/selectors';
import { PreferredAvatar } from '../components/app/preferred-avatar';
import { addPermittedAccount } from '../store/actions';
import { getURLHost } from '../helpers/utils/util';
import { ToastContent } from '../components/ui/toast/toast';
import { useI18nContext } from './useI18nContext';

const toastId = (accountGroupId: string) => `connect-account-${accountGroupId}`;

const selectActiveTabChainIds = createSelector(
  (state) => getPermissions(state, getOriginOfCurrentTab(state)),
  (permissions) =>
    getAllScopesFromCaip25CaveatValue(
      getCaip25CaveatValueFromPermissions(permissions),
    ),
);

const selectConnectAccountToastData = createSelector(
  selectSelectedAccountGroup,
  getOriginOfCurrentTab,
  selectActiveTabChainIds,
  selectSeedAddressForSelectedAccountGroup,
  selectShowConnectAccountGroupToast,
  (accountGroup, origin, chainIds, seedAddress, showToast) => {
    if (!accountGroup) {
      return {
        accountGroup: null,
        seedAddress: null,
        addressesToPermit: [],
        showToast: false,
        activeTabOrigin: null,
      };
    }
    return {
      accountGroup,
      seedAddress,
      addressesToPermit: accountGroup.accounts
        .filter((account) => hasChainIdSupport(account.scopes, chainIds))
        .map((account) => account.address),
      showToast,
      activeTabOrigin: origin,
    };
  },
);

export function useConnectAccountToast() {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const {
    accountGroup,
    seedAddress,
    addressesToPermit,
    showToast,
    activeTabOrigin,
  } = useSelector(selectConnectAccountToastData, shallowEqual);

  const handleClick = useCallback(() => {
    batch(() => {
      addressesToPermit.forEach((address) => {
        dispatch(addPermittedAccount(activeTabOrigin, address));
      });
    });

    toast.dismiss(toastId(selectedAccountGroupId));
  }, [dispatch, addressesToPermit, activeTabOrigin, selectedAccountGroupId]);

  useEffect(() => {
    const id = toastId(selectedAccountGroupId);

    if (!showToast || !accountGroup || !seedAddress) {
      toast.dismiss(id);
      return;
    }

    const title = t('accountIsntConnectedToastText', [
      accountGroup.metadata?.name,
      getURLHost(activeTabOrigin),
    ]);

    toast(
      <ToastContent
        title={title}
        actionText={t('connectAccount')}
        onActionClick={handleClick}
      />,
      {
        icon: <PreferredAvatar address={seedAddress} />,
        id,
        duration: Infinity,
        style: {
          animation: 'none',
        },
      },
    );

    return () => toast.remove(id);
  }, [
    showToast,
    selectedAccountGroupId,
    accountGroup,
    seedAddress,
    handleClick,
    activeTabOrigin,
    t,
  ]);
}
