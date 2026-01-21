import React from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';
import {
  EthMethod,
  BtcMethod,
  SolMethod,
  TrxAccountType,
  TrxMethod,
} from '@metamask/keyring-api';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '@metamask/bridge-controller';
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
import {
  getInternalAccountsFromSelectedAccountGroup,
  getSelectedAccountGroup,
} from '../../../selectors/multichain-accounts/account-tree';
import { AccountOverviewLayout } from './account-overview-layout';
import { AccountOverviewCommonProps } from './common';

export type AccountOverviewProps = AccountOverviewCommonProps & {
  useExternalServices: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function AccountOverview(props: AccountOverviewProps) {
  // Get account and network info
  const accounts = useSelector(getInternalAccountsFromSelectedAccountGroup);
  const { chainId } = useSelector(getSelectedMultichainNetworkConfiguration);

  // Get balance info
  const balance = useSelector(getMultichainSelectedAccountCachedBalance);
  // Only valid for EVM accounts, but all account groups have at least one EVM account.
  const balanceIsCached = useSelector(isBalanceCached);

  // Get chain capabilities
  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const isSwapsOrBridgeChain = (
    ALLOWED_BRIDGE_CHAIN_IDS as readonly string[]
  ).includes(chainId);

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

  return (
    <AccountOverviewLayout
      showTokens={true}
      showNfts={true}
      showDefi={defiPositionsEnabled}
      showActivity={true}
      {...props}
    >
      <CoinOverview
        account={accounts[0]}
        balance={balance}
        balanceIsCached={balanceIsCached}
        chainId={chainId}
        isSigningEnabled={isSigningEnabled}
        isSwapsChain={isSwapsOrBridgeChain}
        isBridgeChain={isSwapsOrBridgeChain}
        isBuyableChain={isBuyableChain}
      />
    </AccountOverviewLayout>
  );
}
