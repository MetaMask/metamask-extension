// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { useContext } from 'react';
import { Token } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';
import { Hex } from '@metamask/utils';
import {
  getRpcPrefsForCurrentProvider,
  getSelectedInternalAccount,
  getNativeCurrencyForChain,
} from '../../../selectors';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import AssetOptions from './asset-options';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
        isOriginalNativeSymbol,
      }}
      optionsButton={
        <AssetOptions
          isNativeAsset={true}
          onClickBlockExplorer={() => {
            // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            trackEvent({
              event: 'Clicked Block Explorer Link',
              category: MetaMetricsEventCategory.Navigation,
              properties: {
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                link_type: 'Account Tracker',
                action: 'Asset Options',
                // TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                block_explorer_domain: getURLHostName(accountLink),
              },
            });
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
            // eslint-disable-next-line no-restricted-globals
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
