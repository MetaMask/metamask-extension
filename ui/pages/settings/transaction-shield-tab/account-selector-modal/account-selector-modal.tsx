import React from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import { useSelector } from 'react-redux';
import { getWalletsWithAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import {
  AvatarAccountSize,
  Box,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { AccountWalletId } from '@metamask/account-api';
import { useAccountAddressSeedIconMap } from '../../../confirmations/hooks/send/useAccountAddressSeedIconMap';
import { PreferredAvatar } from '../../../../components/app/preferred-avatar';
import { AccountSelectorAccount, AccountSelectorWallet } from '../types';

const AccountSelectorModal = ({
  onClose,
  onAccountSelect,
}: {
  onClose: () => void;
  onAccountSelect: (account: AccountSelectorAccount) => void;
}) => {
  const wallets = useSelector(getWalletsWithAccounts);
  const { accountAddressSeedIconMap } = useAccountAddressSeedIconMap();

  // Group recipients by wallet name
  const groupedByWallet = Object.values(wallets).reduce(
    (acc, wallet) => {
      const walletName = wallet.metadata.name;
      if (!acc[walletName]) {
        acc[walletName] = {
          id: wallet.id,
          name: wallet.metadata.name,
          accounts: [],
        };
      }
      Object.values(wallet.groups).forEach((group) => {
        acc[walletName].accounts.push({
          id: group.id,
          name: group.metadata.name,
          seedIcon: accountAddressSeedIconMap.get(
            group.accounts[0].address.toLowerCase(),
          ),
          chainAccounts: group.accounts.map((account) => {
            return {
              id: account.id,
              address: account.address,
              type: account.type,
            };
          }),
        });
      });
      return acc;
    },
    {} as Record<string, AccountSelectorWallet>,
  );

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
          {Object.entries(groupedByWallet).map(([walletName, wallet]) => (
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
                  onClick={() => onAccountSelect(account)}
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
