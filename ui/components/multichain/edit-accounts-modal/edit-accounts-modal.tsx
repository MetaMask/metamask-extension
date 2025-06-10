import React, { useCallback, useContext, useEffect, useState } from 'react';
import { CaipAccountId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
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
import { MergedInternalAccountWithCaipAccountId } from '../../../selectors/selectors.types';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { WalletClientType } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { EditAccountAddAccountForm } from './add-account';
import { EditAccountModalAddNewAccountOption } from './add-new-account-option';

type EditAccountsModalProps = {
  accounts: MergedInternalAccountWithCaipAccountId[];
  defaultSelectedAccountAddresses: CaipAccountId[];
  onClose: () => void;
  onSubmit: (addresses: CaipAccountId[]) => void;
};

enum EditAccountModalStage {
  AccountList = 'account-list',
  AddNewAccount = 'add-new-account',
  EditAccounts = 'edit-accounts',
}

export const EditAccountsModal: React.FC<EditAccountsModalProps> = ({
  accounts,
  defaultSelectedAccountAddresses,
  onClose,
  onSubmit,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const [modalStage, setModalStage] = useState<EditAccountModalStage>(
    EditAccountModalStage.AccountList,
  );
  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState(
    defaultSelectedAccountAddresses,
  );
  const [accountType, setAccountType] = useState<WalletClientType | 'EVM'>(
    'EVM',
  );
  useEffect(() => {
    setSelectedAccountAddresses(defaultSelectedAccountAddresses);
  }, [
    // TODO: Fix the source of this prop value to be the same array instance each render
    JSON.stringify(defaultSelectedAccountAddresses),
  ]);

  const selectAll = () => {
    const allNetworksAccountAddresses = accounts.map(
      ({ caipAccountId }) => caipAccountId,
    );
    setSelectedAccountAddresses(allNetworksAccountAddresses);
  };

  const deselectAll = () => {
    setSelectedAccountAddresses([]);
  };

  const handleAccountClick = (caipAccountId: CaipAccountId) => {
    const updatedSelectedAccountAddresses = selectedAccountAddresses.filter(
      (selectedAccountId) => {
        return !isEqualCaseInsensitive(selectedAccountId, caipAccountId);
      },
    );

    if (
      updatedSelectedAccountAddresses.length === selectedAccountAddresses.length
    ) {
      setSelectedAccountAddresses([...selectedAccountAddresses, caipAccountId]);
    } else {
      setSelectedAccountAddresses(updatedSelectedAccountAddresses);
    }
  };

  const allAreSelected = () =>
    accounts.length === selectedAccountAddresses.length;
  const checked = allAreSelected();
  const isIndeterminate = !checked && selectedAccountAddresses.length > 0;

  const defaultSet = new Set(defaultSelectedAccountAddresses);
  const selectedSet = new Set(selectedAccountAddresses);

  const handleAddAccount = useCallback(
    async (completed: boolean, newAccount?: InternalAccount) => {
      if (completed && newAccount) {
        const [scope] = newAccount.scopes;
        if (!scope) {
          // Should never happen since `scopes` is declared as a non-empty array on the
          // account type.
          throw new Error('Account has no scope');
        }
        // NOTE: For now we only rely on 1 single CAIP-10. The CAIP namespace is
        // used under the hood and we assume all account's scope use the same
        // namespace.
        // TODO: Maybe use multiple CAIP-10 for each scopes instead?
        const newAccountCaipAccountId: CaipAccountId = `${scope}:${newAccount.address}`;
        onSubmit([...selectedAccountAddresses, newAccountCaipAccountId]);
        onClose();
      }
    },
    [selectedAccountAddresses, onSubmit, onClose],
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="edit-accounts-modal"
      className="edit-accounts-modal"
    >
      <ModalOverlay />
      {modalStage === EditAccountModalStage.AccountList && (
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
                    setModalStage(EditAccountModalStage.AddNewAccount)
                  }
                  data-testid="add-new-account-button"
                >
                  {t('newAccount')}
                </ButtonLink>
              </Box>

              {accounts.map((account) => (
                <AccountListItem
                  onClick={() => handleAccountClick(account.caipAccountId)}
                  account={account}
                  key={account.caipAccountId}
                  isPinned={Boolean(account.pinned)}
                  showConnectedStatus={false}
                  startAccessory={
                    <Checkbox
                      isChecked={selectedAccountAddresses.some(
                        (selectedAccountAddress) =>
                          isEqualCaseInsensitive(
                            selectedAccountAddress,
                            account.caipAccountId,
                          ),
                      )}
                    />
                  }
                  selected={false}
                />
              ))}
            </>
          </ModalBody>
          <ModalFooter>
            {selectedAccountAddresses.length === 0 ? (
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
                  const addedAccounts = selectedAccountAddresses.filter(
                    (address) => !defaultSet.has(address),
                  );
                  const removedAccounts =
                    defaultSelectedAccountAddresses.filter(
                      (address) => !selectedSet.has(address),
                    );

                  onSubmit(selectedAccountAddresses);
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
      {modalStage === EditAccountModalStage.AddNewAccount && (
        <EditAccountModalAddNewAccountOption
          setAccountTypeToAdd={(accountTypeToAdd: WalletClientType | 'EVM') => {
            setAccountType(accountTypeToAdd);
            setModalStage(EditAccountModalStage.EditAccounts);
          }}
        />
      )}
      {modalStage === EditAccountModalStage.EditAccounts && (
        <EditAccountAddAccountForm
          onBack={() => setModalStage(EditAccountModalStage.AddNewAccount)}
          onClose={() => setModalStage(EditAccountModalStage.AccountList)}
          onActionComplete={handleAddAccount}
          accountType={accountType}
        />
      )}
    </Modal>
  );
};
