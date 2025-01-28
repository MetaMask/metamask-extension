import React, { useContext, useEffect, useState } from 'react';
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
  BlockSize,
} from '../../../helpers/constants/design-system';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';

type EditAccountsModalProps = {
  accounts: MergedInternalAccount[];
  defaultSelectedAccountAddresses: string[];
  onClose: () => void;
  onSubmit: (addresses: string[]) => void;
};

export const EditAccountsModal: React.FC<EditAccountsModalProps> = ({
  accounts,
  defaultSelectedAccountAddresses,
  onClose,
  onSubmit,
}) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);

  const [showAddNewAccounts, setShowAddNewAccounts] = useState(false);
  const [selectedAccountAddresses, setSelectedAccountAddresses] = useState(
    defaultSelectedAccountAddresses,
  );

  useEffect(() => {
    setSelectedAccountAddresses(defaultSelectedAccountAddresses);
  }, [
    // TODO: Fix the source of this prop value to be the same array instance each render
    JSON.stringify(defaultSelectedAccountAddresses),
  ]);

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

  const allAreSelected = () =>
    accounts.length === selectedAccountAddresses.length;
  const checked = allAreSelected();
  const isIndeterminate = !checked && selectedAccountAddresses.length > 0;

  const defaultSet = new Set(defaultSelectedAccountAddresses);
  const selectedSet = new Set(selectedAccountAddresses);

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
                  isPinned={Boolean(account.pinned)}
                  startAccessory={
                    <Checkbox
                      isChecked={selectedAccountAddresses.some(
                        (selectedAccountAddress) =>
                          isEqualCaseInsensitive(
                            selectedAccountAddress,
                            account.address,
                          ),
                      )}
                    />
                  }
                  selected={false}
                />
              ))}
            </>
          )}
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
                const removedAccounts = defaultSelectedAccountAddresses.filter(
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
    </Modal>
  );
};
