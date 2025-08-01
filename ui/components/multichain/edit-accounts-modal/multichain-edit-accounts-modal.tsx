import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Checkbox,
  Box,
  ModalFooter,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonLink,
  ModalBody,
  Text,
  IconSize,
  IconName,
  Icon,
} from '../../component-library';
import { AccountListItem } from '..';

import {
  JustifyContent,
  Display,
  TextVariant,
  TextColor,
  IconColor,
  FlexDirection,
  AlignItems,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import {
  WalletClientType,
  EVM_WALLET_TYPE,
} from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { EditAccountModalAddNewAccountOption } from './add-new-account-option';
import { MultichainAccountCell } from '../../multichain-accounts/multichain-account-cell';
import { AccountGroupWithInternalAccounts } from '../../../selectors/multichain-accounts/account-tree';
import { AccountGroupObject } from '@metamask/account-tree-controller';

type MultichainEditAccountsModalProps = {
  accountsGroups: AccountGroupWithInternalAccounts[];
  defaultSelectedAccountGroups: AccountGroupObject['id'][];
  onClose: () => void;
  onSubmit: (accountGroups: AccountGroupObject['id'][]) => void;
};

enum MultichainEditAccountModalStage {
  AccountList = 'account-list',
  AddNewAccount = 'add-new-account',
  EditAccounts = 'edit-accounts',
}

export const MultichainEditAccountsModal: React.FC<
  MultichainEditAccountsModalProps
> = ({ accountsGroups, defaultSelectedAccountGroups, onClose, onSubmit }) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [modalStage, setModalStage] = useState<MultichainEditAccountModalStage>(
    MultichainEditAccountModalStage.AccountList,
  );
  const [selectedAccountGroups, setSelectedAccountGroups] = useState(
    defaultSelectedAccountGroups,
  );

  useEffect(() => {
    setSelectedAccountGroups(defaultSelectedAccountGroups);
  }, [
    // TODO: Fix the source of this prop value to be the same array instance each render
    JSON.stringify(defaultSelectedAccountGroups),
  ]);

  const selectAll = () => {
    const allNetworksAccountGroups = accountsGroups.map(({ id }) => id);
    setSelectedAccountGroups(allNetworksAccountGroups);
  };

  const deselectAll = () => {
    setSelectedAccountGroups([]);
  };

  const handleAccountClick = (accountGroupId: AccountGroupObject['id']) => {
    const existingIndex = selectedAccountGroups.findIndex(
      (selectedAccountGroupId) => selectedAccountGroupId === accountGroupId,
    );

    if (existingIndex !== -1) {
      // Remove: use splice for efficient removal
      const newSelection = [...selectedAccountGroups];
      newSelection.splice(existingIndex, 1);
      setSelectedAccountGroups(newSelection);
    } else {
      // Add: append to existing array
      setSelectedAccountGroups([...selectedAccountGroups, accountGroupId]);
    }
  };

  const allAreSelected = () =>
    accountsGroups.length === selectedAccountGroups.length;
  const checked = allAreSelected();
  const isIndeterminate = !checked && selectedAccountGroups.length > 0;

  const defaultSet = new Set(defaultSelectedAccountGroups);
  const selectedSet = new Set(selectedAccountGroups);

  const handleAddAccount = useCallback(
    async (completed: boolean, newAccountGroup?: AccountGroupObject) => {
      if (completed && newAccountGroup) {
        onSubmit([...selectedAccountGroups, newAccountGroup.id]);
        onClose();
      }
    },
    [selectedAccountGroups, onSubmit, onClose],
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="edit-accounts-modal"
      className="edit-accounts-modal"
    >
      <ModalOverlay />
      {modalStage === MultichainEditAccountModalStage.AccountList && (
        <ModalContent>
          <ModalHeader onClose={onClose}>{t('editAccounts')}</ModalHeader>
          <ModalBody
            paddingLeft={0}
            paddingRight={0}
            className="edit-accounts-modal__body"
          >
            <>
              <Box
                padding={4}
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
              >
                <Checkbox
                  label={t('selectAll')}
                  isChecked={checked}
                  gap={4}
                  onClick={() =>
                    allAreSelected() ? deselectAll() : selectAll()
                  }
                  isIndeterminate={isIndeterminate}
                />
                <ButtonLink
                  onClick={() =>
                    setModalStage(MultichainEditAccountModalStage.AddNewAccount)
                  }
                  data-testid="add-new-account-button"
                >
                  {t('newAccount')}
                </ButtonLink>
              </Box>

              {accountsGroups.map((accountGroup) => (
                <MultichainAccountCell
                  accountId={accountGroup.id}
                  balance={'1337'}
                  key={accountGroup.id}
                  endAccessory={
                    <Checkbox
                      isChecked={selectedAccountGroups.some(
                        (selectedAccountGroupId) =>
                          isEqualCaseInsensitive(
                            selectedAccountGroupId,
                            accountGroup.id,
                          ),
                      )}
                    />
                  }
                  selected={false}
                  onClick={() => handleAccountClick(accountGroup.id)}
                />
                // <AccountListItem
                //   onClick={() => handleAccountClick(account.caipAccountId)}
                //   account={account}
                //   key={account.caipAccountId}
                //   isPinned={Boolean(account.pinned)}
                //   showConnectedStatus={false}
                //   startAccessory={
                //     <Checkbox
                //       isChecked={selectedAccountAddresses.some(
                //         (selectedAccountAddress) =>
                //           isEqualCaseInsensitive(
                //             selectedAccountAddress,
                //             account.caipAccountId,
                //           ),
                //       )}
                //     />
                //   }
                //   selected={false}
                // />
              ))}
            </>
          </ModalBody>
          <ModalFooter>
            {selectedAccountGroups.length === 0 ? (
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={4}
                width={BlockSize.Full}
                alignItems={AlignItems.center}
              >
                <Box
                  display={Display.Flex}
                  gap={1}
                  alignItems={AlignItems.center}
                >
                  <Icon
                    name={IconName.Danger}
                    size={IconSize.Xs}
                    color={IconColor.errorDefault}
                  />
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.errorDefault}
                  >
                    {t('disconnectMessage')}
                  </Text>
                </Box>
                <ButtonPrimary
                  data-testid="disconnect-accounts-button"
                  onClick={() => {
                    onSubmit([]);
                    onClose();
                  }}
                  size={ButtonPrimarySize.Lg}
                  block
                  danger
                >
                  {t('disconnect')}
                </ButtonPrimary>
              </Box>
            ) : (
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
                {t('update')}
              </ButtonPrimary>
            )}
          </ModalFooter>
        </ModalContent>
      )}
      {modalStage === MultichainEditAccountModalStage.AddNewAccount && (
        <EditAccountModalAddNewAccountOption
          setAccountTypeToAdd={(
            accountTypeToAdd: WalletClientType | typeof EVM_WALLET_TYPE,
          ) => {
            setModalStage(MultichainEditAccountModalStage.EditAccounts);
          }}
        />
      )}
      {/* {modalStage === MultichainEditAccountModalStage.EditAccounts && (
        <EditAccountAddAccountForm
          onBack={() =>
            setModalStage(MultichainEditAccountModalStage.AddNewAccount)
          }
          onClose={() =>
            setModalStage(MultichainEditAccountModalStage.AccountList)
          }
          onActionComplete={handleAddAccount}
          accountType={accountType}
        />
      )} */}
    </Modal>
  );
};
