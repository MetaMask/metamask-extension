import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { Popover, PopoverPosition } from '../../../../component-library';
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
import { OptionsButton } from './options-button';
import {
  controlPopoverStyle,
  useAssetControl,
  useIsControlBarFullScreen,
} from './asset-controls';
import { useOpenTokenManagement } from './use-open-token-management';

/**
 * Token more-menu: manage tokens and refresh the list.
 */
export const TokenOptionsMenu = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isFullScreen = useIsControlBarFullScreen();
  const { isOpen, toggle, close } = useAssetControl('tokens');
  const openTokenManagement = useOpenTokenManagement();
  const [referenceElement, setReferenceElement] =
    useState<HTMLButtonElement | null>(null);
  const setButtonRef = useCallback((node: HTMLButtonElement | null) => {
    setReferenceElement(node);
  }, []);
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
    <>
      <OptionsButton ref={setButtonRef} showTokensLinks onClick={toggle} />
      <Popover
        onClickOutside={close}
        isOpen={isOpen}
        position={PopoverPosition.BottomEnd}
        referenceElement={referenceElement}
        matchWidth={false}
        style={controlPopoverStyle(isFullScreen, '158px')}
      >
        <SelectableListItem
          onClick={openTokenManagement}
          testId="manageTokens"
          className="min-h-12"
        >
          <Icon name={IconName.Setting} size={IconSize.Sm} className="mr-2" />
          {t('manageTokens')}
        </SelectableListItem>
        <SelectableListItem onClick={handleRefresh} testId="refreshList">
          <Icon name={IconName.Refresh} size={IconSize.Sm} className="mr-2" />
          {t('refreshList')}
        </SelectableListItem>
      </Popover>
    </>
  );
};
