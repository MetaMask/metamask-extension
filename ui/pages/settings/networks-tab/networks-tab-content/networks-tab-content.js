import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import NetworksForm from '../networks-form';
import NetworksList from '../networks-list';
import { getProviderConfig } from '../../../../ducks/metamask/metamask';

import {
  DEFAULT_ROUTE,
  NETWORKS_ROUTE,
} from '../../../../helpers/constants/routes';

const NetworksTabContent = ({
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  selectedNetwork,
  shouldRenderNetworkForm,
}) => {
  const providerConfig = useSelector(getProviderConfig);
  const history = useHistory();

  return (
    <>
      <NetworksList
        networkDefaultedToProvider={networkDefaultedToProvider}
        networkIsSelected={networkIsSelected}
        networksToRender={networksToRender}
        selectedNetworkConfigurationId={selectedNetwork.networkConfigurationId}
      />
      {shouldRenderNetworkForm ? (
        <NetworksForm
          isCurrentRpcTarget={providerConfig.rpcUrl === selectedNetwork.rpcUrl}
          networksToRender={networksToRender}
          selectedNetwork={selectedNetwork}
          submitCallback={() => history.push(DEFAULT_ROUTE)}
          cancelCallback={() => history.push(NETWORKS_ROUTE)}
        />
      ) : null}
    </>
  );
};
NetworksTabContent.propTypes = {
  networkDefaultedToProvider: PropTypes.bool,
  networkIsSelected: PropTypes.bool,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNetwork: PropTypes.object,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
};

export default NetworksTabContent;
