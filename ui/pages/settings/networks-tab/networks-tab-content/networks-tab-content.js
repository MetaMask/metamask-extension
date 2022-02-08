import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import NetworksForm from '../networks-form';
import NetworksList from '../networks-list';
import ActionableMessage from '../../../../components/ui/actionable-message';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getProvider } from '../../../../selectors';

const NetworksTabContent = ({
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  selectedNetwork,
  shouldRenderNetworkForm,
}) => {
  const t = useI18nContext();
  const provider = useSelector(getProvider);

  return (
    <>
      <NetworksList
        networkDefaultedToProvider={networkDefaultedToProvider}
        networkIsSelected={networkIsSelected}
        networksToRender={networksToRender}
        selectedRpcUrl={selectedNetwork.rpcUrl}
      />
      {shouldRenderNetworkForm ? (
        <NetworksForm
          isCurrentRpcTarget={provider.rpcUrl === selectedNetwork.rpcUrl}
          networksToRender={networksToRender}
          selectedNetwork={selectedNetwork}
        />
      ) : (
        <ActionableMessage
          type="warning"
          className="networks-tab__content__actionable-message"
          message={t('onlyAddTrustedNetworks')}
          withRightButton
        />
      )}
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
