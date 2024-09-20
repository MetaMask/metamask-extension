import React, { useEffect, useState } from 'react';
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
import { AccountListItem, CreateEthAccount } from '..';

import {
  JustifyContent,
  Display,
  TextVariant,
  TextColor,
  IconColor,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { getURLHost } from '../../../helpers/utils/util';
import { AccountType } from '../connect-accounts-modal/connect-account-modal.types';

type EditAccountsModalProps = {
  activeTabOrigin: string;
  accounts: AccountType[];
  defaultSelectedAccountAddresses: string[];
  onClose: () => void;
  onSubmit: (addresses: string[]) => void;
};

export const EditAccountsModal: React.FC<EditAccountsModalProps> = ({
  activeTabOrigin,
  accounts,
  defaultSelectedAccountAddresses,
  onClose,
  onSubmit,
}) => {
  const t = useI18nContext();
  const [showAddNewAccounts, setShowAddNewAccounts] = useState(false);

  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState(
    defaultSelectedAccountAddresses,
  );

  useEffect(() => {
    setSelectedAccountAddresses(defaultSelectedAccountAddresses);
  }, [defaultSelectedAccountAddresses]);

  const selectAll = () => {
    const allNetworksAccountAddresses = accounts.map(({ address }) => address);
    setSelectedAccountAddresses(allNetworksAccountAddresses);
  };

  const deselectAll = () => {
    setSelectedAccountAddresses([]);
  };

  const handleAccountClick = (address: string) => {
    if (selectedAccountAddresses.includes(address)) {
      setSelectedAccountAddresses(
        selectedAccountAddresses.filter((_address) => _address !== address),
      );
    } else {
      setSelectedAccountAddresses([...selectedAccountAddresses, address]);
    }
  };

  const allAreSelected = () => {
    return accounts.length === selectedAccountAddresses.length;
  };

  const checked = allAreSelected();
  const isIndeterminate = !checked && selectedAccountAddresses.length > 0;

  const hostName = getURLHost(activeTabOrigin);

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        data-testid="edit-accounts-modal"
        className="edit-accounts-modal"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader onClose={onClose}>{t('editAccounts')}</ModalHeader>
          <ModalBody paddingLeft={0} paddingRight={0}>
            {showAddNewAccounts ? (
              <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
                <CreateEthAccount
                  onActionComplete={() => setShowAddNewAccounts(false)}
                />
              </Box>
            ) : (
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
                  <ButtonLink onClick={() => setShowAddNewAccounts(true)}>
                    {t('newAccount')}
                  </ButtonLink>
                </Box>
                {accounts.map((account) => (
                  <AccountListItem
                    onClick={() => handleAccountClick(account.address)}
                    account={account}
                    key={account.address}
                    // isPinned={Boolean(account.pinned)} // TODO: figure this out
                    startAccessory={
                      <Checkbox
                        isChecked={selectedAccountAddresses.includes(
                          account.address,
                        )}
                      />
                    }
                    selected={false}
                  />
                ))}

                <ModalFooter>
                  {selectedAccountAddresses.length === 0 ? (
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      gap={4}
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
                          {t('disconnectMessage', [hostName])}
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
                        onSubmit(selectedAccountAddresses);
                        onClose();
                      }}
                      size={ButtonPrimarySize.Lg}
                      block
                    >
                      {t('update')}
                    </ButtonPrimary>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
