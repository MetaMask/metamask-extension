import React from 'react';
import { useSelector } from 'react-redux';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { SelectableListItem } from '../sort-control/sort-control';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { selectEnabledNetworksAsCaipChainIds } from '../../../../../selectors/multichain/networks';
import { refreshAssetsForSelectedAccount } from '../../../../../store/actions';
import type { MetaMaskReduxState } from '../../../../../store/store';
import {
  getInternalAccountsFromGroupById,
  getSelectedAccountGroup,
} from '../../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../../selectors/multichain-accounts/account-tree.types';
import { useDispatch } from '../../../../../store/hooks';
import { useAssetControls } from './asset-controls';
import { OptionsMenu } from './options-menu';
import { RefreshItem } from './refresh-item';
import { useOpenTokenManagement } from './use-open-token-management';

/**
 * Token more-menu: manage tokens and refresh the list.
 */
export const TokenOptionsMenu = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { close } = useAssetControls();
  const openTokenManagement = useOpenTokenManagement();
  const selectedAccountGroupAccounts = useSelector(
    (state: MetaMaskReduxState) => {
      const multichainAccountsState =
        state as unknown as MultichainAccountsState;
      const selectedAccountGroup = getSelectedAccountGroup(
        multichainAccountsState,
      );
      return getInternalAccountsFromGroupById(
        multichainAccountsState,
        selectedAccountGroup,
      );
    },
  );
  const selectedCaipChainIds = useSelector(selectEnabledNetworksAsCaipChainIds);

  const handleRefresh = () => {
    if (selectedAccountGroupAccounts.length > 0) {
      dispatch(
        refreshAssetsForSelectedAccount(selectedAccountGroupAccounts, {
          chainIds: selectedCaipChainIds,
          assetTypes: ['token', 'price', 'metadata'],
        }),
      );
    }
    close();
  };

  return (
    <OptionsMenu>
      <SelectableListItem
        onClick={openTokenManagement}
        testId="manageTokens"
        className="min-h-12"
      >
        <Icon name={IconName.Setting} size={IconSize.Sm} className="mr-2" />
        {t('manageTokens')}
      </SelectableListItem>
      <RefreshItem onClick={handleRefresh} />
    </OptionsMenu>
  );
};
