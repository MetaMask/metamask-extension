import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  EthAccountType,
  InternalAccount,
  isEvmAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
import { NonEmptyArray } from '@metamask/utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccounts,
  getOrderedConnectedAccountsForConnectedDapp,
  getPermissionSubjects,
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
} from '../../component-library';
import { AccountListItem } from '..';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../account-list-menu/account-list-menu';
import {
  addMorePermittedAccounts,
  removePermissionsFor,
  removePermittedAccount,
  setSelectedAccountsForDappConnection,
} from '../../../store/actions';
import { SubjectsType } from '../pages/connections/components/connections.types';
import {
  JustifyContent,
  Display,
} from '../../../helpers/constants/design-system';
import { NewAccountModal } from './new-accounts-modal';

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

type EditAccountsModalProps = {
  onClose: () => void;
  onClick: () => void;
  allowedAccountTypes?: KeyringAccountType[];
  approvedAccounts: string[];
  activeTabOrigin: string;
  currentTabHasNoAccounts: boolean;
};

export const EditAccountsModal: React.FC<EditAccountsModalProps> = ({
  onClose,
  onClick,
  allowedAccountTypes = defaultAllowedAccountTypes,
  approvedAccounts,
  activeTabOrigin,
  currentTabHasNoAccounts,
}) => {
  const t = useI18nContext();
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const dispatch = useDispatch();
  const [showAddNewAccountsModal, setShowAddNewAccountsModal] = useState(false);

  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => allowedAccountTypes.includes(account.type),
    );
  }, [accounts, internalAccounts, allowedAccountTypes]);

  const subjects = useSelector(getPermissionSubjects);
  const connectedAccounts = useSelector((state: any) =>
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

  const disconnectAllAccounts = () => {
    const subject = (subjects as SubjectsType)[activeTabOrigin];
    if (subject) {
      const permissionMethodNames = Object.values(subject.permissions).map(
        ({ parentCapability }: { parentCapability: string }) =>
          parentCapability,
      ) as string[];
      if (permissionMethodNames.length > 0) {
        const permissionsRecord: Record<string, string[]> = {
          [activeTabOrigin]: permissionMethodNames,
        };

        dispatch(
          removePermissionsFor(
            permissionsRecord as Record<string, NonEmptyArray<string>>,
          ),
        );
      }
    }
  };

  const managePermittedAccounts = (
    selectedAccounts: string[],
    connectedAccountsAddresses: string[],
  ) => {
    const removedAccounts = connectedAccountsAddresses.filter(
      (acc) => !selectedAccounts.includes(acc),
    );
    removedAccounts.forEach((account) => {
      dispatch(removePermittedAccount(activeTabOrigin, account));
    });

    const newAccounts = selectedAccounts.filter(
      (acc) => !connectedAccountsAddresses.includes(acc),
    );
    if (newAccounts.length > 0) {
      dispatch(addMorePermittedAccounts(activeTabOrigin, newAccounts));
    }
  };

  return (
    <>
      <Modal
        isOpen
        onClose={() => console.log('bb')}
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
              <Checkbox label={t('selectAll')} isChecked gap={4} />
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
                <ButtonPrimary
                  data-testid="disconnect-all-accounts-button"
                  onClick={() => {
                    disconnectAllAccounts();
                    onClose();
                  }}
                  size={ButtonPrimarySize.Lg}
                  block
                  danger
                >
                  {t('disconnect')}
                </ButtonPrimary>
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
                  {t('confirm')}
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
