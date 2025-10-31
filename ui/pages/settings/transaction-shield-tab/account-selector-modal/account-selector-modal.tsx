import React from 'react';
import {
  AvatarAccountSize,
  Box,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
import { AccountSelectorWallet } from '../types';

const AccountSelectorModal = ({
  wallets,
  onAccountSelect,
  onClose,
}: {
  wallets: Record<string, AccountSelectorWallet>;
  onAccountSelect: (address: string) => void;
  onClose: () => void;
}) => {
  return (
    <Modal
      isClosedOnEscapeKey={true}
      isClosedOnOutsideClick={true}
      isOpen
      onClose={onClose}
      className="account-selector-modal"
      data-testid="account-selector-modal"
    >
      <ModalOverlay />
      <ModalContent size={ModalContentSize.Sm}>
        <ModalHeader>Account Selector</ModalHeader>
        <ModalBody paddingRight={0} paddingLeft={0}>
          {Object.entries(wallets).map(([walletName, wallet]) => (
            <Box key={walletName}>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextAlternative}
                className="px-4 py-2"
              >
                {walletName}
              </Text>

              {wallet.accounts.map((account) => (
                <Box
                  asChild
                  key={account.id}
                  className="account-selector-modal__account w-full flex items-center gap-4 px-4 py-3"
                  onClick={() => onAccountSelect(account.address)}
                >
                  <button>
                    <PreferredAvatar
                      address={account.seedIcon ?? ''}
                      size={AvatarAccountSize.Lg}
                    />
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {account.name}
                    </Text>
                  </button>
                </Box>
              ))}
            </Box>
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AccountSelectorModal;
