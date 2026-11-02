import React, {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';
import type { AccountGroupId } from '@metamask/account-api';

export const accountListDialogId = 'account-list-dialog';

type AccountDialogScreen =
  | { name: 'list' }
  | { name: 'details'; accountGroupId: AccountGroupId }
  | { name: 'addresses'; accountGroupId: AccountGroupId };

const listScreen: AccountDialogScreen = { name: 'list' };

type DialogScreens = {
  accountList: ComponentType<{
    onClose?: () => void;
    onShowDetails?: (accountGroupId: AccountGroupId) => void;
    onShowAddresses?: (accountGroupId: AccountGroupId) => void;
  }>;
  multichainAccountDetailsPage: ComponentType<{
    accountGroupId?: AccountGroupId;
    onBack?: () => void;
    onShowAddresses?: (accountGroupId: AccountGroupId) => void;
  }>;
  multichainAccountAddressListPage: ComponentType<{
    accountGroupId?: AccountGroupId;
    onBack?: () => void;
  }>;
};

export function AccountListDialog({
  dialogRef,
}: {
  dialogRef: RefObject<HTMLDialogElement>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [stack, setStack] = useState<AccountDialogScreen[]>([listScreen]);
  const [screens, setScreens] = useState<DialogScreens | null>(null);
  const screen = stack[stack.length - 1] ?? listScreen;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const handleToggle = () => {
      const nextOpen = dialog.open;
      setIsOpen(nextOpen);
      if (!nextOpen) {
        setStack([listScreen]);
      }
    };

    dialog.addEventListener('toggle', handleToggle);
    return () => dialog.removeEventListener('toggle', handleToggle);
  }, [dialogRef]);

  useEffect(() => {
    if (!isOpen || screens) {
      return;
    }

    let cancelled = false;
    Promise.all([
      import('../../../pages/multichain-accounts/account-list'),
      import('../../../pages/multichain-accounts/multichain-account-details-page'),
      import('../../../pages/multichain-accounts/multichain-account-address-list-page'),
    ]).then(([accountListModule, detailsModule, addressModule]) => {
      if (cancelled) {
        return;
      }
      setScreens({
        accountList: accountListModule.AccountList,
        multichainAccountDetailsPage:
          detailsModule.MultichainAccountDetailsPage,
        multichainAccountAddressListPage:
          addressModule.MultichainAccountAddressListPage,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, screens]);

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, [dialogRef]);

  const pop = useCallback(() => {
    if (stack.length > 1) {
      setStack((current) => current.slice(0, -1));
      return;
    }
    dialogRef.current?.close();
  }, [dialogRef, stack.length]);

  const showDetails = useCallback((accountGroupId: AccountGroupId) => {
    setStack((current) => [...current, { name: 'details', accountGroupId }]);
  }, []);

  const showAddresses = useCallback((accountGroupId: AccountGroupId) => {
    setStack((current) => [...current, { name: 'addresses', accountGroupId }]);
  }, []);

  const AccountListScreen = screens?.accountList;
  const DetailsScreen = screens?.multichainAccountDetailsPage;
  const AddressesScreen = screens?.multichainAccountAddressListPage;

  return (
    <dialog
      id={accountListDialogId}
      ref={dialogRef}
      className="dialog-modal w-full h-dvh max-h-dvh mx-auto p-0 border-0 bg-background-default text-default"
    >
      {isOpen && screen.name === 'list' && AccountListScreen ? (
        <AccountListScreen
          onClose={close}
          onShowDetails={showDetails}
          onShowAddresses={showAddresses}
        />
      ) : null}
      {isOpen && screen.name === 'details' && DetailsScreen ? (
        <DetailsScreen
          accountGroupId={screen.accountGroupId}
          onBack={pop}
          onShowAddresses={showAddresses}
        />
      ) : null}
      {isOpen && screen.name === 'addresses' && AddressesScreen ? (
        <AddressesScreen accountGroupId={screen.accountGroupId} onBack={pop} />
      ) : null}
    </dialog>
  );
}
