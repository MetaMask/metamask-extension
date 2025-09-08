import { Token } from '@metamask/assets-controllers';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  CaipAssetType,
  Hex,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';
import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getURLHostName,
  roundToDecimalPlacesRemovingExtraZeroes,
} from '../../../helpers/utils/util';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { getTokenList, selectERC20TokensByChain } from '../../../selectors';
import { showModal } from '../../../store/actions';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import AssetOptions from './asset-options';
import AssetPage from './asset-page';

const TokenAsset = ({ token, chainId }: { token: Token; chainId: Hex }) => {
  const { address, symbol, isERC721, image } = token;

  const tokenList = useSelector(getTokenList);
  const allNetworks: {
    [key: `0x${string}`]: NetworkConfiguration;
  } = useSelector(getNetworkConfigurationsByChainId);
  // get the correct rpc url for the current token
  const defaultIdx = allNetworks[chainId]?.defaultBlockExplorerUrlIndex;
  const currentTokenBlockExplorer =
    defaultIdx === undefined
      ? null
      : allNetworks[chainId]?.blockExplorerUrls[defaultIdx];

  const caipChainId = isCaipChainId(chainId)
    ? chainId
    : formatChainIdToCaip(chainId);
  const selectedAccount = useSelector((state) =>
    getInternalAccountBySelectedAccountGroupAndCaip(state, caipChainId),
  ) as InternalAccount;

  const { address: walletAddress } = selectedAccount;

  const erc20TokensByChain = useSelector(selectERC20TokensByChain);

  const multichainNetwork = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );
  const isEvm = isEvmChainId(chainId);

  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  // Fetch token data from tokenList
  const tokenData = Object.values(tokenList).find(
    (t) =>
      isEqualCaseInsensitive(t.symbol, symbol) &&
      isEqualCaseInsensitive(t.address, address),
  );

  // If not found in tokenList, try erc20TokensByChain
  const tokenDataFromChain =
    erc20TokensByChain?.[chainId]?.data?.[address.toLowerCase()];

  const name = tokenData?.name || tokenDataFromChain?.name || symbol;
  const iconUrl =
    tokenData?.iconUrl || tokenDataFromChain?.iconUrl || image || '';

  const aggregators = tokenData?.aggregators;

  const {
    tokensWithBalances,
  }: { tokensWithBalances: { string: string; balance: string }[] } =
    useTokenTracker({ tokens: [token], address: undefined });

  const balance = tokensWithBalances?.[0];
  const fiat = useTokenFiatAmount(address, balance?.string, symbol, {}, false);

  const tokenTrackerLink = getTokenTrackerLink(
    token.address,
    chainId,
    '',
    walletAddress,
    { blockExplorerUrl: currentTokenBlockExplorer ?? '' },
  );

  const blockExplorerLink = isEvm
    ? tokenTrackerLink
    : getMultichainAccountUrl(
        parseCaipAssetType(address as CaipAssetType).assetReference,
        multichainNetwork,
      );

  return (
    <AssetPage
      asset={{
        chainId,
        type: AssetType.token,
        address,
        symbol,
        name,
        decimals: token.decimals,
        image: iconUrl,
        aggregators,
        balance: {
          value: balance?.balance,
          display: `${roundToDecimalPlacesRemovingExtraZeroes(
            balance?.string,
            5,
          )}`,
          fiat,
        },
        isERC721,
      }}
      optionsButton={
        <AssetOptions
          isNativeAsset={false}
          onRemove={() =>
            dispatch(
              showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token, history }),
            )
          }
          onClickBlockExplorer={() => {
            trackEvent({
              event: 'Clicked Block Explorer Link',
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                link_type: 'Token Tracker',
                action: 'Token Options',
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                block_explorer_domain: getURLHostName(tokenTrackerLink),
              },
            });
            global.platform.openTab({ url: blockExplorerLink });
          }}
          tokenSymbol={token.symbol}
        />
      }
    />
  );
};

export default TokenAsset;
