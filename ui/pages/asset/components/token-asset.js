import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import TransactionList from '../../../components/app/transaction-list';
import { TokenOverview } from '../../../components/app/wallet-overview';
import {
  getCurrentChainId,
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
} from '../../../selectors/selectors';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { showModal } from '../../../store/actions';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';

import AssetNavigation from './asset-navigation';
import AssetOptions from './asset-options';

export default function TokenAsset({ token }) {
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const selectedIdentity = useSelector(getSelectedIdentity);
  const selectedAccountName = selectedIdentity.name;
  const selectedAddress = selectedIdentity.address;
  const history = useHistory();
  const tokenTrackerLink = getTokenTrackerLink(
    token.address,
    chainId,
    null,
    selectedAddress,
    rpcPrefs,
  );

  const blockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Navigation',
    event: 'Clicked Block Explorer Link',
    properties: {
      link_type: 'Token Tracker',
      action: 'Token Options',
      block_explorer_domain: tokenTrackerLink
        ? new URL(tokenTrackerLink)?.hostname
        : '',
    },
  });

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={token.symbol}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={
          <AssetOptions
            onRemove={() =>
              dispatch(showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))
            }
            isEthNetwork={!rpcPrefs.blockExplorerUrl}
            onClickBlockExplorer={() => {
              blockExplorerLinkClickedEvent();
              global.platform.openTab({ url: tokenTrackerLink });
            }}
            onViewAccountDetails={() => {
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
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
