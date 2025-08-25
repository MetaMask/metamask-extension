import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Box,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ModalBody,
} from '../../../component-library';

import {
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { MultichainAccountList } from '../../multichain-account-list';
import { getAccountTree } from '../../../../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../../../../selectors/multichain-accounts/account-tree.types';

type MultichainEditAccountsModalProps = {
  defaultSelectedAccountGroups: AccountGroupId[];
  supportedAccountGroups: AccountGroupWithInternalAccounts[];
  onClose: () => void;
  onSubmit: (accountGroups: AccountGroupId[]) => void;
};

export const MultichainEditAccountsModal: React.FC<
  MultichainEditAccountsModalProps
> = ({
  defaultSelectedAccountGroups,
  supportedAccountGroups,
  onClose,
  onSubmit,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [selectedAccountGroups, setSelectedAccountGroups] = useState(
    defaultSelectedAccountGroups,
  );
  const accountTree = useSelector(getAccountTree);

  const walletsWithSupportedAccountGroups = useMemo(() => {
    const walletMap = new Map();

    // Build wallets from scratch using only supported account groups
    supportedAccountGroups.forEach((group) => {
      const [walletId] = group.id.split('/');
      const walletIdTyped = walletId as AccountWalletId;
      const wallet = accountTree.wallets[walletIdTyped];

      if (group && wallet) {
        if (!walletMap.has(walletId)) {
          walletMap.set(walletId, {
            id: wallet.id,
            type: wallet.type,
            metadata: wallet.metadata,
            groups: {},
          });
        }
        walletMap.get(walletId).groups[group.id] = group;
      }
    });

    return Object.fromEntries(walletMap);
  }, [accountTree.wallets, supportedAccountGroups]);

  useEffect(() => {
    setSelectedAccountGroups(defaultSelectedAccountGroups);
  }, [
    // TODO: Fix the source of this prop value to be the same array instance each render
    JSON.stringify(defaultSelectedAccountGroups),
  ]);

  const handleAccountClick = useCallback(
    (accountGroupId: AccountGroupId) => {
      const existingIndex = selectedAccountGroups.findIndex(
        (selectedAccountGroupId) => selectedAccountGroupId === accountGroupId,
      );

      // eslint-disable-next-line no-negated-condition: Checking explicitly for -1
      if (existingIndex !== -1) {
        const newSelection = [...selectedAccountGroups];
        newSelection.splice(existingIndex, 1);
        setSelectedAccountGroups(newSelection);
      } else {
        setSelectedAccountGroups([...selectedAccountGroups, accountGroupId]);
      }
    },
    [selectedAccountGroups],
  );

  const defaultSet = new Set(defaultSelectedAccountGroups);
  const selectedSet = new Set(selectedAccountGroups);

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="edit-accounts-modal"
      className="edit-accounts-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('editAccounts')}</ModalHeader>
        <ModalBody
          paddingLeft={0}
          paddingRight={0}
          className="edit-accounts-modal__body"
        >
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <MultichainAccountList
              wallets={walletsWithSupportedAccountGroups}
              selectedAccountGroups={selectedAccountGroups}
              handleAccountClick={handleAccountClick}
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <ButtonPrimary
            data-testid="connect-more-accounts-button"
            onClick={() => {
              const addedAccounts = selectedAccountGroups.filter(
                (accountGroup) => !defaultSet.has(accountGroup),
              );
              const removedAccounts = defaultSelectedAccountGroups.filter(
                (accountGroup) => !selectedSet.has(accountGroup),
              );

              onSubmit(selectedAccountGroups);
              trackEvent({
                category: MetaMetricsEventCategory.Permissions,
                event: MetaMetricsEventName.UpdatePermissionedAccounts,
                properties: {
                  addedAccounts: addedAccounts.length,
                  removedAccounts: removedAccounts.length,
                  location: 'Edit Accounts Modal',
                },
              });

              onClose();
            }}
            size={ButtonPrimarySize.Lg}
            block
          >
            {t('connect')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
