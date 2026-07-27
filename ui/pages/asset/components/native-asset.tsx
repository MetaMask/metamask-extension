import React from 'react';
import { Token } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';
import { Hex, isCaipChainId } from '@metamask/utils';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Navigate } from 'react-router-dom';
import {
  getRpcPrefsForCurrentProvider,
  getNativeCurrencyForChain,
} from '../../../selectors';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getProviderConfig } from '../../../../shared/lib/selectors/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import AssetOptions from './asset-options';
import AssetPage from './asset-page';

const NativeAsset = ({ token, chainId }: { token: Token; chainId: Hex }) => {
  const { symbol } = token;
  const image = getNativeCurrencyForChain(chainId);
  const { type } = useSelector(getProviderConfig) ?? {};
  const { address } = useSelector(getSelectedInternalAccount);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const caipChainId = isCaipChainId(chainId)
    ? chainId
    : formatChainIdToCaip(chainId);
  // TODO BIP44: The new selector returns the accountId, when BIP44 is fully enabled we can fetch the asset higher up and ensure it's passed here
  // Null when the selected account group has no account for this chain
  // (e.g. non-EVM asset deeplink while an EVM-only imported account is selected).
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  ) as InternalAccount | null;
  const multichainNetworkForSelectedAccount = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );
  const isEvm = isEvmChainId(chainId);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    symbol,
    type,
  );

  // No matching account for this chain — redirect home (e.g. EVM-only + Solana asset).
  if (!selectedAccount) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const addressLink = getMultichainAccountUrl(
    selectedAccount.address,
    multichainNetworkForSelectedAccount,
  );

  const accountLink = isEvm
    ? getAccountLink(address, chainId, rpcPrefs)
    : addressLink;

  return (
    <AssetPage
      asset={{
        chainId,
        type: AssetType.native,
        symbol,
        image,
        decimals: token.decimals,
        isOriginalNativeSymbol: isOriginalNativeSymbol === true,
      }}
      optionsButton={
        <AssetOptions
          isNativeAsset={true}
          onClickBlockExplorer={() => {
            trackEvent(
              createEventBuilder('Clicked Block Explorer Link')
                .addCategory(MetaMetricsEventCategory.Navigation)
                .addProperties({
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  link_type: 'Account Tracker',
                  action: 'Asset Options',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  block_explorer_domain: getURLHostName(accountLink),
                })
                .build(),
            );
            global.platform.openTab({
              url: accountLink,
            });
          }}
        />
      }
    />
  );
};

export default NativeAsset;
