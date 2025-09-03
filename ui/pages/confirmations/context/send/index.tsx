import React, {
  ReactElement,
  createContext,
  useContext,
  useState,
} from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { toHex } from '@metamask/controller-utils';
import { useSelector } from 'react-redux';

import { getSelectedAccount } from '../../../../selectors';
import { Asset } from '../../types/send';
import { SendPages } from '../../constants/send';

export type SendContextType = {
  asset?: Asset;
  chainId?: string;
  currentPage?: SendPages;
  fromAccount: InternalAccount;
  from: string;
  to?: string;
  updateAsset: (asset: Asset) => void;
  updateCurrentPage: (page: SendPages) => void;
  updateTo: (to: string) => void;
  updateValue: (value: string) => void;
  value?: string;
};

export const SendContext = createContext<SendContextType>({
  asset: undefined,
  chainId: undefined,
  currentPage: undefined,
  fromAccount: {} as InternalAccount,
  from: '',
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
  const [asset, updateAsset] = useState<Asset>();
  const from = useSelector(getSelectedAccount);
  const [to, updateTo] = useState<string>();
  const [value, updateValue] = useState<string>();
  const [currentPage, updateCurrentPage] = useState<SendPages>();

  const chainId =
    asset?.address && isEvmAddress(asset?.address) && asset.chainId
      ? toHex(asset.chainId)
      : asset?.chainId?.toString();

  return (
    <SendContext.Provider
      value={{
        asset,
        chainId,
        currentPage,
        fromAccount: from as InternalAccount,
        from: from?.address as string,
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
