import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import TransactionList from '../../../components/app/transaction-list';
import { TokenOverview } from '../../../components/app/wallet-overview';
import {
  getCurrentChainId,
  getSelectedInternalAccount,
  getRpcPrefsForCurrentProvider,
  getIsCustomNetwork,
} from '../../../selectors/selectors';
import {
  DEFAULT_ROUTE,
  TOKEN_DETAILS,
} from '../../../helpers/constants/routes';
import { getURLHostName } from '../../../helpers/utils/util';
import { showModal } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import AssetNavigation from './asset-navigation';
import AssetOptions from './asset-options';

export default function TokenAsset({ token }) {
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAccountName = selectedAccount.metadata.name;
  const selectedAddress = selectedAccount.address;
  const history = useHistory();
  const tokenTrackerLink = getTokenTrackerLink(
    token.address,
    chainId,
    null,
    selectedAddress,
    rpcPrefs,
  );
  const trackEvent = useContext(MetaMetricsContext);

  const isCustomNetwork = useSelector(getIsCustomNetwork);

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={token.symbol}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <AssetOptions
            onRemove={() =>
              dispatch(
                showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token, history }),
              )
            }
            isCustomNetwork={isCustomNetwork}
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
            onViewTokenDetails={() => {
              history.push(`${TOKEN_DETAILS}/${token.address}`);
            }}
            tokenSymbol={token.symbol}
          />
        }
      />
      <TokenOverview className="asset__overview" token={token} />
      <TransactionList tokenAddress={token.address} />
    </>
  );
}

TokenAsset.propTypes = {
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
};
