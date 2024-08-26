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
  getOriginOfCurrentTab,
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
} from '../../component-library';
import { AccountListItem } from '..';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../account-list-menu/account-list-menu';
import {
  addMorePermittedAccounts,
  removePermissionsFor,
  removePermittedAccount,
} from '../../../store/actions';
import { NonEmptyArray } from '@metamask/utils';
import { SubjectsType } from '../pages/connections/components/connections.types';

const defaultAllowedAccountTypes = [EthAccountType.Eoa, EthAccountType.Erc4337];

interface EditAccountsModalProps {
  onClose: () => void;
  onClick: () => void;
  allowedAccountTypes?: KeyringAccountType[];
}

export const EditAccountsModal: React.FC<EditAccountsModalProps> = ({
  onClose,
  onClick,
  allowedAccountTypes = defaultAllowedAccountTypes,
}) => {
  const t = useI18nContext();
  const accounts = useSelector(getUpdatedAndSortedAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const dispatch = useDispatch();

  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => allowedAccountTypes.includes(account.type),
    );
  }, [accounts, internalAccounts, allowedAccountTypes]);

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const subjects = useSelector(getPermissionSubjects);
  const connectedAccounts = useSelector((state: any) =>
    getOrderedConnectedAccountsForConnectedDapp(state, activeTabOrigin).filter(
      (account: InternalAccount) => isEvmAccountType(account.type),
    ),
  );

  const connectedAccountsAddresses = connectedAccounts.map(
    (account: InternalAccount) => account.address,
  );

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(
    connectedAccountsAddresses,
  );

  const handleAccountClick = (address: string) => {
    const index = selectedAccounts.indexOf(address);
    let newSelectedAccounts: string[];

    if (index === -1) {
      newSelectedAccounts = [...selectedAccounts, address];
    } else {
      newSelectedAccounts = selectedAccounts.filter(
        (account) => account !== address,
      );
    }
    setSelectedAccounts(newSelectedAccounts);
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
    activeTabOrigin: string,
  ) => {
    const removedElements = connectedAccountsAddresses.filter(
      (account) => !selectedAccounts.includes(account),
    );

    if (removedElements.length > 0) {
      removedElements.forEach((account) => {
        dispatch(removePermittedAccount(activeTabOrigin, account));
      });
    }

    const newElements = selectedAccounts.filter(
      (account) => !connectedAccountsAddresses.includes(account),
    );

    if (newElements.length > 0) {
      dispatch(addMorePermittedAccounts(activeTabOrigin, newElements));
    }
  };

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
        <Box padding={4}>
          <Checkbox label={t('selectAll')} isChecked gap={4} />
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
              data-testid="connect-more-accounts-button"
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
              data-testid="connect-more-accounts-button"
              onClick={() => {
                onClick();
                managePermittedAccounts(
                  selectedAccounts,
                  connectedAccountsAddresses,
                  activeTabOrigin,
                );
                onClose();
              }}
              size={ButtonPrimarySize.Lg}
              block
            >
              {t('confirm')}
            </ButtonPrimary>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
