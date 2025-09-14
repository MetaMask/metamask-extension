import React, {
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { isHexString } from 'ethereumjs-util';
import { isSolanaChainId } from '@metamask/bridge-controller';
import { toHex } from '@metamask/controller-utils';
import { useSelector } from 'react-redux';

import {
  getSelectedAccountGroup,
  getAccountGroupWithInternalAccounts,
} from '../../../../selectors/multichain-accounts/account-tree';
import { getSelectedAccount } from '../../../../selectors';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';

export type SendContextType = {
  asset?: Asset;
  chainId?: string;
  currentPage?: SendPages;
  fromAccount?: InternalAccount;
  from: string;
  maxValueMode?: boolean;
  to?: string;
  updateAsset: (asset: Asset) => void;
  updateCurrentPage: (page: SendPages) => void;
  updateTo: (to: string) => void;
  updateValue: (value: string, maxValueMode?: boolean) => void;
  value?: string;
};

export const SendContext = createContext<SendContextType>({
  asset: undefined,
  chainId: undefined,
  currentPage: undefined,
  fromAccount: {} as InternalAccount,
  from: '',
  maxValueMode: undefined,
  to: undefined,
  updateAsset: () => undefined,
  updateCurrentPage: () => undefined,
  updateTo: () => undefined,
  updateValue: () => undefined,
  value: undefined,
});

export const SendContextProvider: React.FC<{
  children: ReactElement[] | ReactElement;
}> = ({ children }) => {
  const [asset, setAsset] = useState<Asset>();
  const from = useSelector(getSelectedAccount);
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const accountGroupWithInternalAccounts = useSelector(
    getAccountGroupWithInternalAccounts,
  );
  const [fromAccount, updateFromAccount] = useState<InternalAccount>();
  const [maxValueMode, updateMaxValueMode] = useState<boolean>();
  const [to, updateTo] = useState<string>();
  const [value, setValue] = useState<string>();
  const [currentPage, updateCurrentPage] = useState<SendPages>();

  const updateValue = useCallback(
    (val: string, maxMode?: boolean) => {
      updateMaxValueMode(maxMode ?? false);
      setValue(val);
    },
    [setValue, updateMaxValueMode],
  );

  const updateAsset = useCallback(
    (newAsset: Asset) => {
      updateValue('', false);
      setAsset(newAsset);
    },
    [setAsset, updateValue],
  );

  const chainId =
    asset?.address &&
    isEvmAddress(asset?.address) &&
    asset.chainId &&
    !isSolanaChainId(asset.chainId?.toString()) &&
    !isHexString(asset.chainId.toString())
      ? toHex(asset.chainId)
      : asset?.chainId?.toString();

  useEffect(() => {
    if (asset?.accountId) {
      const selectedAccountGroupWithInternalAccounts =
        accountGroupWithInternalAccounts.find(
          (accountGroup) => accountGroup.id === selectedAccountGroupId,
        )?.accounts;

      const selectedAccount = selectedAccountGroupWithInternalAccounts?.find(
        (account) => account.id === asset?.accountId,
      );
      updateFromAccount(selectedAccount as InternalAccount);
    }
  }, [
    asset?.accountId,
    selectedAccountGroupId,
    accountGroupWithInternalAccounts,
  ]);

  return (
    <SendContext.Provider
      value={{
        asset,
        chainId,
        currentPage,
        fromAccount,
        from: from?.address as string,
        maxValueMode,
        to,
        updateAsset,
        updateCurrentPage,
        updateTo,
        updateValue,
        value,
      }}
    >
      {children}
    </SendContext.Provider>
  );
};

export const useSendContext = () => {
  const context = useContext(SendContext);
  if (!context) {
    throw new Error(
      'useSendContext must be used within an SendContextProvider',
    );
  }
  return context;
};
