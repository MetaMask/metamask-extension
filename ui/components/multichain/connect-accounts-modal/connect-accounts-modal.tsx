import React from 'react';
import {
  ButtonPrimary,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AccountListItem } from '../index';
import { mergeAccounts } from '../account-list-menu/account-list-menu';
import { getInternalAccounts, getMetaMaskAccountsOrdered } from '../../../selectors/selectors';
import { useSelector } from 'react-redux';

// Maps to localizations for title and text
export enum ConnectAccountsType {
  Account = 'disconnectAllAccountsText',
  Snap = 'disconnectAllSnapsText',
}

export const ConnectAccountsModal = ({
  type,
  onClick,
  onClose,
}: {
  type: ConnectAccountsType;
  onClick: () => void;
  onClose: () => void;
}) => {
  const t = useI18nContext();
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const internalAccounts = useSelector(getInternalAccounts);
  const mergedAccounts = mergeAccounts(accounts, internalAccounts);

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>Connect more accounts</ModalHeader>
        <ModalBody>
          <Checkbox isChecked={true} label={t('selectAll')} />
          {/* <AccountListItem
            onClick={() => {
              onClick()
            }}
            identity={account}
            key={account.address}
            closeMenu={onClose}
            connectedAvatar={connectedSite?.iconUrl}
            connectedAvatarName={connectedSite?.name}
            showOptions
            isPinned={Boolean(account.pinned)}
            isHidden={Boolean(account.hidden)}
            currentTabOrigin={currentTabOrigin}
            isActive={Boolean(account.active)}
          /> */}
        </ModalBody>
        <ModalFooter>
          <ButtonPrimary onClick={onClick} block>
            {t('confirm')}
          </ButtonPrimary>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
