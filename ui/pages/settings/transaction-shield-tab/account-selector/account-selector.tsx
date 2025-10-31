import React, { useMemo, useState } from 'react';
import {
  AvatarAccountSize,
  Box,
  BoxBorderColor,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
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
import { getWalletsWithAccounts } from '../../../../selectors/multichain-accounts/account-tree';
import { useAccountAddressSeedIconMap } from '../../../confirmations/hooks/send/useAccountAddressSeedIconMap';

const AccountSelector = ({
  label,
  modalTitle,
  onAccountSelect,
  impactedWalletAddress,
}: {
  label: string;
  modalTitle: string;
  onAccountSelect: (address: string) => void;
  impactedWalletAddress: string;
}) => {
  const [showAccountListMenu, setShowAccountListMenu] = useState(false);

  // Account list
  const wallets = useSelector(getWalletsWithAccounts);
  const { accountAddressSeedIconMap } = useAccountAddressSeedIconMap();

  // Group recipients by wallet name
  const accountsGroupedByWallet: Record<string, AccountSelectorWallet> =
    useMemo(() => {
      return Object.values(wallets).reduce(
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
            // get evm account from group
            const evmAccount = group.accounts.find((account) =>
              account.type.startsWith('eip155:'),
            );
            if (evmAccount) {
              acc[walletName].accounts.push({
                id: group.id,
                name: group.metadata.name,
                address: evmAccount.address,
                seedIcon: accountAddressSeedIconMap.get(
                  evmAccount.address.toLowerCase(),
                ),
                type: evmAccount.type,
              });
            }
          });
          return acc;
        },
        {} as Record<string, AccountSelectorWallet>,
      );
    }, [wallets, accountAddressSeedIconMap]);

  const selectedAccountInfo = useMemo(() => {
    const selectedWallet = Object.values(accountsGroupedByWallet).find(
      (wallet) =>
        wallet.accounts.some(
          (account) => account.address === impactedWalletAddress,
        ),
    );

    if (selectedWallet) {
      return (
        selectedWallet.accounts.find(
          (account) => account.address === impactedWalletAddress,
        ) ?? null
      );
    }
    return null;
  }, [accountsGroupedByWallet, impactedWalletAddress]);

  return (
    <Box>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        className="mb-2"
      >
        {label}
      </Text>
      <Box
        asChild
        borderColor={BoxBorderColor.BorderDefault}
        className="w-full flex items-center gap-2 px-4 h-12 border rounded-lg"
        onClick={() => setShowAccountListMenu(true)}
        aria-label={modalTitle}
      >
        <button>
          {selectedAccountInfo ? (
            <>
              <PreferredAvatar
                address={selectedAccountInfo?.seedIcon ?? ''}
                size={AvatarAccountSize.Sm}
              />
              <Text>{selectedAccountInfo?.name}</Text>
            </>
          ) : (
            <Text color={TextColor.TextAlternative}>{modalTitle}</Text>
          )}

          <Icon
            className="ml-auto"
            size={IconSize.Sm}
            color={IconColor.IconDefault}
            name={IconName.ArrowDown}
          />
        </button>
      </Box>

      <Modal
        isOpen={showAccountListMenu}
        isClosedOnEscapeKey={true}
        isClosedOnOutsideClick={true}
        onClose={() => setShowAccountListMenu(false)}
        className="account-selector-modal"
        data-testid="account-selector-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={() => setShowAccountListMenu(false)}>
            {modalTitle}
          </ModalHeader>
          <ModalBody paddingRight={0} paddingLeft={0}>
            {Object.entries(accountsGroupedByWallet).map(
              ([walletName, wallet]) => (
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
                      className={classnames(
                        'account-selector-modal__account w-full flex items-center gap-4 px-4 py-3',
                        {
                          'account-selector-modal__account--selected':
                            account.address === selectedAccountInfo?.address,
                        },
                      )}
                      onClick={() => {
                        onAccountSelect(account.address);
                        setShowAccountListMenu(false);
                      }}
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
              ),
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AccountSelector;
