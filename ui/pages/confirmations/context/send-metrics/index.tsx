import React, {
  ReactElement,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { isAddress as isEvmAddress } from 'ethers/lib/utils';
import { useSelector } from 'react-redux';

import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';
import {
  getAccountTypeForKeyring,
  getInternalAccounts,
} from '../../../../selectors';
import { useSendContext } from '../send';

export const AssetFilterMethod = {
  None: 'none',
  Search: 'search',
  Network: 'network',
};

export const AmountInputType = {
  Token: 'token',
  Fiat: 'fiat',
};

export const AmountInputMethod = {
  Manual: 'manual',
  Pasted: 'pasted',
  PressedMax: 'pressed_max',
};

export const RecipientInputMethod = {
  Manual: 'manual',
  Pasted: 'pasted',
  SelectAccount: 'select_account',
  SelectContact: 'select_contact',
};

export type SendMetricsContextType = {
  accountType?: string;
  assetListSize: string;
  amountInputMethod: string;
  amountInputType: string;
  assetFilterMethod: string[];
  recipientInputMethod: string;
  setAmountInputMethod: (value: string) => void;
  setAmountInputType: (value: string) => void;
  setAssetFilterMethod: (value: string[]) => void;
  setAssetListSize: (value: string) => void;
  setRecipientInputMethod: (value: string) => void;
};

export const SendMetricsContext = createContext<SendMetricsContextType>({
  accountType: undefined,
  assetListSize: '',
  amountInputMethod: AmountInputMethod.Manual,
  amountInputType: AmountInputType.Token,
  assetFilterMethod: [AssetFilterMethod.None],
  recipientInputMethod: RecipientInputMethod.Manual,
  setAmountInputMethod: () => undefined,
  setAmountInputType: () => undefined,
  setAssetFilterMethod: () => undefined,
  setAssetListSize: () => undefined,
  setRecipientInputMethod: () => undefined,
});

export const SendMetricsContextProvider: React.FC<{
  children: ReactElement[] | ReactElement;
}> = ({ children }) => {
  const { from } = useSendContext();
  const internalAccounts = useSelector(getInternalAccounts);
  const [assetFilterMethod, setAssetFilterMethod] = useState([
    AssetFilterMethod.None,
  ]);
  const [assetListSize, setAssetListSize] = useState('');
  const [amountInputMethod, setAmountInputMethod] = useState(
    AmountInputMethod.Manual,
  );
  const [amountInputType, setAmountInputType] = useState(AmountInputType.Token);
  const [recipientInputMethod, setRecipientInputMethod] = useState(
    RecipientInputMethod.Manual,
  );
  const accountType = useMemo(() => {
    if (!internalAccounts?.length || !from || !isEvmAddress(from as string)) {
      return undefined;
    }
    // todo: account can be used from send context if we add it
    const fromAccount = Object.values(internalAccounts).find((account) =>
      isEqualCaseInsensitive(account.address, from),
    );
    return getAccountTypeForKeyring(fromAccount?.metadata?.keyring);
  }, [from, internalAccounts]);

  return (
    <SendMetricsContext.Provider
      value={{
        accountType,
        assetListSize,
        amountInputMethod,
        amountInputType,
        assetFilterMethod,
        recipientInputMethod,
        setAssetListSize,
        setAmountInputMethod,
        setAmountInputType,
        setAssetFilterMethod,
        setRecipientInputMethod,
      }}
    >
      {children}
    </SendMetricsContext.Provider>
  );
};

export const useSendMetricsContext = () => {
  const context = useContext(SendMetricsContext);
  if (!context) {
    throw new Error(
      'useSendMetricsContext must be used within an SendMetricsContextProvider',
    );
  }
  return context;
};
