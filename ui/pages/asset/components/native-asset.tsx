import React, { useContext } from 'react';
import { Token } from '@metamask/assets-controllers';
import { useSelector } from 'react-redux';
import { getAccountLink } from '@metamask/etherscan-link';
import { Hex } from '@metamask/utils';
import {
  getRpcPrefsForCurrentProvider,
  getSelectedInternalAccount,
  getNativeCurrencyForChain,
  getSelectedAccount,
} from '../../../selectors';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import { AssetType } from '../../../../shared/constants/transaction';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getURLHostName } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getMultichainAccountUrl } from '../../../helpers/utils/multichain/blockExplorer';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import {
  getMultichainNetwork,
  getMultichainIsEvm,
} from '../../../selectors/multichain';
import AssetOptions from './asset-options';

import AssetPage from './asset-page';

const NativeAsset = ({ token, chainId }: { token: Token; chainId: Hex }) => {
  const { symbol } = token;
  const image = getNativeCurrencyForChain(chainId);
  const { type } = useSelector(getProviderConfig) ?? {};
  const { address } = useSelector(getSelectedInternalAccount);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);

  const selectedAccount = useSelector(getSelectedAccount);
  const multichainNetworkForSelectedAccount = useMultichainSelector(
    getMultichainNetwork,
    selectedAccount,
  );
  const isEvm = useSelector(getMultichainIsEvm);
  const addressLink = getMultichainAccountUrl(
    selectedAccount.address,
    multichainNetworkForSelectedAccount,
  );

  const accountLink = isEvm
    ? getAccountLink(address, chainId, rpcPrefs)
    : addressLink;
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
        isOriginalNativeSymbol: isOriginalNativeSymbol === true,
      }}
      optionsButton={
        <AssetOptions
          isNativeAsset={true}
          onClickBlockExplorer={() => {
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
