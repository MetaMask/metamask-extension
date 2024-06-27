import React, { useContext } from 'react';
import { Token } from '@metamask/assets-controllers';
import { useSelector, useDispatch } from 'react-redux';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { useHistory } from 'react-router-dom';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSelectedInternalAccount,
  getTokenList,
} from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../../shared/modules/string-utils';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { AssetType } from '../../../../shared/constants/transaction';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import {
  getURLHostName,
  roundToDecimalPlacesRemovingExtraZeroes,
} from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { showModal } from '../../../store/actions';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import AssetOptions from './asset-options';
import AssetPage from './asset-page';

const TokenAsset = ({ token }: { token: Token }) => {
  const { address, symbol, isERC721 } = token;

  const tokenList = useSelector(getTokenList);
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const { address: walletAddress } = useSelector(getSelectedInternalAccount);

  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const { name, iconUrl, aggregators } =
    Object.values(tokenList).find(
      (t) =>
        isEqualCaseInsensitive(t.symbol, symbol) &&
        isEqualCaseInsensitive(t.address, address),
    ) ?? {};

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
    rpcPrefs,
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
                link_type: 'Token Tracker',
                action: 'Token Options',
                block_explorer_domain: getURLHostName(tokenTrackerLink),
              },
            });
            global.platform.openTab({ url: tokenTrackerLink });
          }}
          tokenSymbol={token.symbol}
        />
      }
    />
  );
};

export default TokenAsset;
