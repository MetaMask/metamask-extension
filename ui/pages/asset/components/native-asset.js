import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getAccountLink } from '@metamask/etherscan-link';
import TransactionList from '../../../components/app/transaction-list';
import { EthOverview } from '../../../components/app/wallet-overview';
import {
  getSelectedIdentity,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSelectedAddress,
  getIsCustomNetwork,
} from '../../../selectors/selectors';
import { showModal } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getURLHostName } from '../../../helpers/utils/util';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT } from '../../../../shared/constants/metametrics';
import AssetNavigation from './asset-navigation';
import AssetOptions from './asset-options';

export default function NativeAsset({ nativeCurrency }) {
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const dispatch = useDispatch();

  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const address = useSelector(getSelectedAddress);
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
                category: EVENT.CATEGORIES.NAVIGATION,
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
            onViewAccountDetails={() => {
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
            }}
            isCustomNetwork={isCustomNetwork}
          />
        }
      />
      <EthOverview className="asset__overview" />
      <TransactionList hideTokenTransactions />
    </>
  );
}

NativeAsset.propTypes = {
  nativeCurrency: PropTypes.string.isRequired,
};
