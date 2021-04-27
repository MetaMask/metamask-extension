import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import TransactionList from '../../../components/app/transaction-list';
import { EthOverview } from '../../../components/app/wallet-overview';
import {
  getSelectedIdentity,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSelectedAddress,
} from '../../../selectors/selectors';
import { showModal } from '../../../store/actions';
import getAccountLink from '../../../../lib/account-link';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
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

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={nativeCurrency}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <AssetOptions
            isNativeAsset
            onViewEtherscan={() => {
              global.platform.openTab({
                url: getAccountLink(address, chainId, rpcPrefs),
              });
            }}
            onViewAccountDetails={() => {
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
            }}
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
