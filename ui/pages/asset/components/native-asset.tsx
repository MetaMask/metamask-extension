import type { Token } from '@metamask/assets-controllers';
import { getAccountLink } from '@metamask/etherscan-link';
import type { Hex } from '@metamask/utils';
import React, { useContext } from 'react';
import { useSelector } from 'react-redux';

import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import {
  getRpcPrefsForCurrentProvider,
  getSelectedInternalAccount,
  getNativeCurrencyForChain,
} from '../../../selectors';
import AssetOptions from './asset-options';
import AssetPage from './asset-page';

const NativeAsset = ({ token, chainId }: { token: Token; chainId: Hex }) => {
  const { symbol } = token;
  const image = getNativeCurrencyForChain(chainId);
  const { type } = useSelector(getProviderConfig) ?? {};
  const { address } = useSelector(getSelectedInternalAccount);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const accountLink = getAccountLink(address, chainId, rpcPrefs);
  const trackEvent = useContext(MetaMetricsContext);
  const isOriginalNativeSymbol = useIsOriginalNativeTokenSymbol(
    chainId,
    symbol,
    type,
  );

  return (
    <AssetPage
      asset={{
        chainId,
        type: AssetType.native,
        symbol,
        image,
        decimals: token.decimals,
        isOriginalNativeSymbol: isOriginalNativeSymbol,
      }}
      optionsButton={
        <AssetOptions
          isNativeAsset={true}
          onClickBlockExplorer={() => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
            trackEvent({
              event: 'Clicked Block Explorer Link',
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                link_type: 'Account Tracker',
                action: 'Asset Options',
                block_explorer_domain: getURLHostName(accountLink),
              },
            });
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
