import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
<<<<<<< HEAD
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
=======
import { TextVariant } from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getInternalAccounts,
  getNonTestNetworks,
  getOrderedConnectedAccountsForConnectedDapp,
  getOriginOfCurrentTab,
  getPermissionSubjects,
  getTestNetworks,
>>>>>>> 66a729057d (added edit accounts functionality)
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
<<<<<<< HEAD
=======
import {
  EthAccountType,
  InternalAccount,
  isEvmAccountType,
  KeyringAccountType,
} from '@metamask/keyring-api';
>>>>>>> 66a729057d (added edit accounts functionality)
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { mergeAccounts } from '../account-list-menu/account-list-menu';
import {
  addMorePermittedAccounts,
  removePermissionsFor,
  removePermittedAccount,
} from '../../../store/actions';
<<<<<<< HEAD
import { NonEmptyArray } from '@metamask/utils';
import { SubjectsType } from '../pages/connections/components/connections.types';
=======

type SendPageYourAccountsProps = {
  allowedAccountTypes?: KeyringAccountType[];
};
>>>>>>> 66a729057d (added edit accounts functionality)

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
<<<<<<< HEAD

=======
>>>>>>> 66a729057d (added edit accounts functionality)
  const mergedAccounts: MergedInternalAccount[] = useMemo(() => {
    return mergeAccounts(accounts, internalAccounts).filter(
      (account: InternalAccount) => allowedAccountTypes.includes(account.type),
    );
<<<<<<< HEAD
  }, [accounts, internalAccounts, allowedAccountTypes]);

  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const subjects = useSelector(getPermissionSubjects);
  const connectedAccounts = useSelector((state: any) =>
=======
  }, [accounts, internalAccounts]);
  const activeTabOrigin = useSelector(getOriginOfCurrentTab);
  const subjects = useSelector(getPermissionSubjects);
  const connectedAccounts = useSelector((state) =>
    // We only consider EVM accounts
    // Connections with non-EVM accounts (Bitcoin only for now) are used implicitly and handled by the Bitcoin Snap itself.
>>>>>>> 66a729057d (added edit accounts functionality)
    getOrderedConnectedAccountsForConnectedDapp(state, activeTabOrigin).filter(
      (account: InternalAccount) => isEvmAccountType(account.type),
    ),
  );
<<<<<<< HEAD

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
=======
  const connectedAccountsAddresses = connectedAccounts.map(
    (account: { address: any }) => account.address,
  );
  const [selectedAccounts, setSelectedAccounts] = useState(
    connectedAccountsAddresses,
  );
  const handleAccountClick = (address: string) => {
    const index = selectedAccounts.indexOf(address);
    let newSelectedAccounts: string[] = [];

    if (index === -1) {
      // If address is not already selected, add it to the selectedAccounts array
      newSelectedAccounts = [...selectedAccounts, address];
    } else {
      // If address is already selected, remove it from the selectedAccounts array
      newSelectedAccounts = selectedAccounts.filter(
        (_item, idx) => idx !== index,
      );
    }
    console.log(newSelectedAccounts, 'ggg');
>>>>>>> 66a729057d (added edit accounts functionality)
    setSelectedAccounts(newSelectedAccounts);
  };

  const disconnectAllAccounts = () => {
    const subject = (subjects as SubjectsType)[activeTabOrigin];
<<<<<<< HEAD
=======

>>>>>>> 66a729057d (added edit accounts functionality)
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
<<<<<<< HEAD
=======

      console.log('all disconnected');
>>>>>>> 66a729057d (added edit accounts functionality)
    }
  };

  const managePermittedAccounts = (
<<<<<<< HEAD
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

=======
    selectedAccounts,
    connectedAccountsAddresses,
    activeTabOrigin,
  ) => {
    // Check if inputs are arrays; if not, set them to empty arrays
    if (!Array.isArray(selectedAccounts)) {
      console.error('selectedAccounts is not an array:', selectedAccounts);
      selectedAccounts = [];
    }

    if (!Array.isArray(connectedAccountsAddresses)) {
      console.error(
        'connectedAccountsAddresses is not an array:',
        connectedAccountsAddresses,
      );
      connectedAccountsAddresses = [];
    }

    // Find new elements in selectedAccounts that are not in connectedAccountsAddresses
>>>>>>> 66a729057d (added edit accounts functionality)
    const newElements = selectedAccounts.filter(
      (account) => !connectedAccountsAddresses.includes(account),
    );

<<<<<<< HEAD
    if (newElements.length > 0) {
      dispatch(addMorePermittedAccounts(activeTabOrigin, newElements));
    }
  };

=======
    // Dispatch addMorePermittedAccounts for new elements
    dispatch(addMorePermittedAccounts(activeTabOrigin, newElements));

    // Find elements in connectedAccountsAddresses that are not in selectedAccounts
    const removedElements = connectedAccountsAddresses.filter(
      (account) => !selectedAccounts.includes(account),
    );

    console.log(removedElements, newElements, 'remo');

    // Dispatch removePermittedAccounts for each removed element
    removedElements.forEach((account) => {
      const selectedAccount = [account]; // Assuming selectedAccounts should be an array of one
      dispatch(removePermittedAccount(activeTabOrigin, selectedAccount));
    });
  };

  console.log(selectedAccounts, connectedAccountsAddresses);
>>>>>>> 66a729057d (added edit accounts functionality)
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
<<<<<<< HEAD
              />
            }
            selected={false}
=======
                // onClick={() => (allAreSelected() ? deselectAll() : selectAll())}
              />
            }
>>>>>>> 66a729057d (added edit accounts functionality)
          />
        ))}

        <ModalFooter>
          {selectedAccounts.length === 0 ? (
            <ButtonPrimary
              data-testid="connect-more-accounts-button"
<<<<<<< HEAD
              onClick={() => {
                disconnectAllAccounts();
                onClose();
              }}
              size={ButtonPrimarySize.Lg}
              block
              danger
=======
              onClick={() => { disconnectAllAccounts(); onClose(); }}
              size={ButtonPrimarySize.Lg}
              block
>>>>>>> 66a729057d (added edit accounts functionality)
            >
              {t('disconnect')}
            </ButtonPrimary>
          ) : (
            <ButtonPrimary
              data-testid="connect-more-accounts-button"
<<<<<<< HEAD
              onClick={() => {
                onClick();
                managePermittedAccounts(
                  selectedAccounts,
                  connectedAccountsAddresses,
                  activeTabOrigin,
                );
                onClose();
              }}
=======
                onClick={() => { managePermittedAccounts(selectedAccounts, connectedAccountsAddresses, activeTabOrigin); onClose(); }}
>>>>>>> 66a729057d (added edit accounts functionality)
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

// if unchecked and connected then remove the account from connected list
// if checked and new update the connected accounts array
