import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getAccountLink } from '@metamask/etherscan-link';
import TransactionList from '../../../components/app/transaction-list';
import { EthOverview } from '../../../components/app/wallet-overview';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getIsCustomNetwork,
  getSelectedInternalAccount,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getURLHostName } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import AssetNavigation from './asset-navigation';
import AssetOptions from './asset-options';

export default function NativeAsset({ nativeCurrency }) {
  const { name: selectedAccountName, address } = useSelector(
    getSelectedInternalAccount,
  );

  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const history = useHistory();
  const accountLink = getAccountLink(address, chainId, rpcPrefs);
  const trackEvent = useContext(MetaMetricsContext);
  const isCustomNetwork = useSelector(getIsCustomNetwork);

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={nativeCurrency}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <AssetOptions
            isNativeAsset
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
            isCustomNetwork={isCustomNetwork}
          />
        }
      />
      <EthOverview className="asset__overview" showAddress={false} />
      <TransactionList hideTokenTransactions />
    </>
  );
}

NativeAsset.propTypes = {
  nativeCurrency: PropTypes.string.isRequired,
};
