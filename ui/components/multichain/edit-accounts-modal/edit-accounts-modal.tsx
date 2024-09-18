import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  EthAccountType,
  InternalAccount,
  isEvmAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccounts,
  getOrderedConnectedAccountsForConnectedDapp,
  getUpdatedAndSortedAccounts,
} from '../../../selectors';
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
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../account-list-menu/account-list-menu';

import {
  addMorePermittedAccounts,
  removePermittedAccount,
  setSelectedAccountsForDappConnection,
} from '../../../store/actions';
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
import { NewAccountModal } from './new-accounts-modal';

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

type EditAccountsModalProps = {
  onClose: () => void;
  onClick: () => void;
  onDisconnectClick: () => void;
  allowedAccountTypes?: KeyringAccountType[];
  approvedAccounts: string[];
  activeTabOrigin: string;
  currentTabHasNoAccounts: boolean;
};

export const EditAccountsModal: React.FC<EditAccountsModalProps> = ({
  onClose,
  onClick,
  onDisconnectClick,
  allowedAccountTypes = defaultAllowedAccountTypes,
  approvedAccounts,
  activeTabOrigin,
  currentTabHasNoAccounts,
}) => {
  const t = useI18nContext();
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const dispatch = useDispatch();
  const hostName = getURLHost(activeTabOrigin);
  const [showAddNewAccountsModal, setShowAddNewAccountsModal] = useState(false);

  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) =>
        allowedAccountTypes.includes(account.type as KeyringAccountType),
    );
  }, [accounts, internalAccounts, allowedAccountTypes]);
  const connectedAccounts = useSelector((state) =>
    getOrderedConnectedAccountsForConnectedDapp(state, activeTabOrigin).filter(
      (account: InternalAccount) => isEvmAccountType(account.type),
    ),
  );

  const connectedAccountsAddresses = connectedAccounts.map(
    (account: InternalAccount) => account.address,
  );

  const defaultAccountsAddresses =
    connectedAccountsAddresses.length > 0
      ? connectedAccountsAddresses
      : approvedAccounts;

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    defaultAccountsAddresses,
  );

  const handleAccountClick = (address: string) => {
    setSelectedAccounts((prevSelectedAccounts) =>
      prevSelectedAccounts.includes(address)
        ? prevSelectedAccounts.filter((acc) => acc !== address)
        : [...prevSelectedAccounts, address],
    );
  };

  const managePermittedAccounts = (
    selectedAcc: string[],
    accountsAddresses: string[],
  ) => {
    const removedAccounts = accountsAddresses.filter(
      (acc) => !selectedAcc.includes(acc),
    );
    removedAccounts.forEach((account) => {
      dispatch(removePermittedAccount(activeTabOrigin, account));
    });

    const newAccounts = selectedAcc.filter(
      (acc) => !accountsAddresses.includes(acc),
    );
    if (newAccounts.length > 0) {
      dispatch(addMorePermittedAccounts(activeTabOrigin, newAccounts));
    }
  };

  const selectAll = () => {
    const newSelectedAccounts = accounts.map(
      (account: { address: string }) => account.address,
    );
    setSelectedAccounts(newSelectedAccounts);
  };

  const deselectAll = () => {
    setSelectedAccounts([]);
  };

  const allAreSelected = () => {
    return accounts.length === selectedAccounts.length;
  };

  let checked = false;
  let isIndeterminate = false;
  if (allAreSelected()) {
    checked = true;
  } else if (selectedAccounts.length > 0 && !allAreSelected()) {
    isIndeterminate = true;
  }

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
            <Box
              padding={4}
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
            >
              <Checkbox
                label={t('selectAll')}
                isChecked={checked}
                gap={4}
                onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
                isIndeterminate={isIndeterminate}
              />
              <ButtonLink onClick={() => setShowAddNewAccountsModal(true)}>
                {t('newAccount')}
              </ButtonLink>
            </Box>
            {mergedAccounts.map((account) => (
              <AccountListItem
                onClick={() => handleAccountClick(account.address)}
                account={account}
                key={account.address}
                isPinned={Boolean(account.pinned)}
                startAccessory={
                  <Checkbox
                    isChecked={selectedAccounts.includes(account.address)}
                  />
                }
                selected={false}
              />
            ))}

            <ModalFooter>
              {selectedAccounts.length === 0 ? (
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
                    data-testid="disconnect-chains-button"
                    onClick={() => {
                      onDisconnectClick();
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
                  data-testid="confirm-selection-button"
                  onClick={() => {
                    onClick();
                    if (currentTabHasNoAccounts) {
                      dispatch(
                        setSelectedAccountsForDappConnection(selectedAccounts),
                      );
                    } else {
                      managePermittedAccounts(
                        selectedAccounts,
                        connectedAccountsAddresses,
                      );
                    }
                    onClose();
                  }}
                  size={ButtonPrimarySize.Lg}
                  block
                >
                  {t('update')}
                </ButtonPrimary>
              )}
            </ModalFooter>
          </ModalBody>
        </ModalContent>
      </Modal>

      {showAddNewAccountsModal && (
        <NewAccountModal onClose={() => setShowAddNewAccountsModal(false)} />
      )}
    </>
  );
};
