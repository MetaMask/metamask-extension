import React from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  EthMethod,
  BtcMethod,
  SolMethod,
  TrxAccountType,
} from '@metamask/keyring-api';
import {
  getSelectedInternalAccount,
  getIsDefiPositionsEnabled,
  isBalanceCached,
  getIsSwapsChain,
  getIsBridgeChain,
} from '../../../selectors';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import {
  getMultichainSelectedAccountCachedBalance,
  getMultichainIsEvm,
} from '../../../selectors/multichain';
import { getSelectedMultichainNetworkConfiguration } from '../../../selectors/multichain/networks';
import { CoinOverview } from '../../app/wallet-overview/coin-overview';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AccountOverview(props: AccountOverviewProps) {
  // Get account and network info
  const account = useSelector(getSelectedInternalAccount, isEqual);
  const { chainId } = useSelector(getSelectedMultichainNetworkConfiguration);
  const isEvm = useSelector(getMultichainIsEvm);

  // Get balance info
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const balanceIsCachedForEvm = useSelector(isBalanceCached);
  const balanceIsCached = isEvm ? balanceIsCachedForEvm : false;

  // Get chain capabilities
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));
  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, chainId),
  );

  // Check signing capability across all account types
  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation) ||
    account.methods.includes(SolMethod.SignTransaction) ||
    account.methods.includes(BtcMethod.SignPsbt) ||
    account.type === TrxAccountType.Eoa;

  // Get tab visibility
  const defiPositionsEnabled = useSelector(getIsDefiPositionsEnabled);

  return (
    <AccountOverviewLayout
      showTokens={true}
      showNfts={true}
      showDefi={defiPositionsEnabled}
      showActivity={true}
      {...props}
    >
      <CoinOverview
        account={account}
        balance={balance}
        balanceIsCached={balanceIsCached}
        chainId={chainId}
        classPrefix="eth" // TODO: Update for multichain accounts.
        isSigningEnabled={isSigningEnabled}
        isSwapsChain={isSwapsChain}
        isBridgeChain={isBridgeChain}
        isBuyableChain={isBuyableChain}
      />
    </AccountOverviewLayout>
  );
}
