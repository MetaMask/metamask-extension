import React from 'react';
import { useSelector } from 'react-redux';
import {
  EthMethod,
  BtcMethod,
  SolMethod,
  TrxMethod,
  isEvmAccountType,
} from '@metamask/keyring-api';
import {
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
import { getInternalAccountsFromSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AccountOverview(props: AccountOverviewProps) {
  // Get accounts
  const accounts = useSelector(getInternalAccountsFromSelectedAccountGroup);

  // Get network info
  const { chainId } = useSelector(getSelectedMultichainNetworkConfiguration);
  const isEvm = useSelector(getMultichainIsEvm);

  // Get balance info
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  const balanceIsCachedForEvm = useSelector(isBalanceCached);
  // Only valid for EVM accounts, but all account groups have at least one EVM account.
  const balanceIsCached = isEvm ? balanceIsCachedForEvm : false;

  // Get chain capabilities
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));
  const isBridgeChain = useSelector((state) =>
    getIsBridgeChain(state, chainId),
  );

  // Check signing capability across all account types
  const isSigningEnabled = accounts.some(
    (account) =>
      account.methods.includes(EthMethod.SignTransaction) ||
      account.methods.includes(EthMethod.SignUserOperation) ||
      account.methods.includes(SolMethod.SignTransaction) ||
      account.methods.includes(BtcMethod.SignPsbt) ||
      account.methods.includes(TrxMethod.SignTransaction),
  );

  // Get tab visibility
  const defiPositionsEnabled = useSelector(getIsDefiPositionsEnabled);

  // Get main account of that group
  // NOTE: This is still widely used accross all our components.
  // TODO: This needs to be refactored in the future to support multiple
  // accounts properly (with account groups).
  const account =
    accounts.find(({ type }) => isEvmAccountType(type)) ?? accounts[0];

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
        isSigningEnabled={isSigningEnabled}
        isSwapsChain={isSwapsChain}
        isBridgeChain={isBridgeChain}
        isBuyableChain={isBuyableChain}
      />
    </AccountOverviewLayout>
  );
}
