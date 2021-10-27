import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network';
import { SIZES } from '../../../../helpers/constants/design-system';
import ColorIndicator from '../../../../components/ui/color-indicator';
import LockIcon from '../../../../components/ui/lock-icon';
import NetworkForm from '../network-form';
import {
  NETWORKS_FORM_ROUTE,
  NETWORKS_ROUTE,
} from '../../../../helpers/constants/routes';

const NetworkListItem = ({
  network,
  selectRpcUrl,
  setSelectedSettingsRpcUrl,
  networkIsSelected,
  providerUrl,
  providerType,
  isFullScreen,
}) => {
  const t = useI18nContext();
  const history = useHistory;
  const {
    label,
    labelKey,
    rpcUrl,
    providerType: currentProviderType,
  } = network;

  const listItemNetworkIsSelected = selectRpcUrl && selectRpcUrl === rpcUrl;
  const listItemUrlIsProviderUrl = rpcUrl === providerUrl;
  const listItemTypeIsProviderNonRpcType =
    providerType !== NETWORK_TYPE_RPC && currentProviderType === providerType;
  const listItemNetworkIsCurrentProvider =
    !networkIsSelected &&
    (listItemUrlIsProviderUrl || listItemTypeIsProviderNonRpcType);
  const displayNetworkListItemAsSelected =
    listItemNetworkIsSelected || listItemNetworkIsCurrentProvider;
  return (
    <div
      key={`settings-network-list-item:${rpcUrl}`}
      className="networks-tab__networks-list-item"
      onClick={() => {
        setSelectedSettingsRpcUrl(rpcUrl);
        if (!isFullScreen) {
          history.push(NETWORKS_FORM_ROUTE);
        }
      }}
    >
      <ColorIndicator
        color={labelKey}
        type={ColorIndicator.TYPES.FILLED}
        size={SIZES.LG}
      />
      <div
        className={classnames('networks-tab__networks-list-name', {
          'networks-tab__networks-list-name--selected': displayNetworkListItemAsSelected,
          'networks-tab__networks-list-name--disabled':
            currentProviderType !== NETWORK_TYPE_RPC &&
            !displayNetworkListItemAsSelected,
        })}
      >
        {label || t(labelKey)}
        {currentProviderType !== NETWORK_TYPE_RPC && (
          <LockIcon width="14px" height="17px" fill="#cdcdcd" />
        )}
      </div>
      <div className="networks-tab__networks-list-arrow" />
    </div>
  );
};

NetworkListItem.propTypes = {
  network: PropTypes.object.isRequired,
  selectRpcUrl: PropTypes.string,
  setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
  networkIsSelected: PropTypes.bool,
  providerUrl: PropTypes.string,
  providerType: PropTypes.string,
  isFullScreen: PropTypes.bool.isRequired,
};

const NetworkList = ({
  networksToRender,
  selectedNetwork,
  setSelectedSettingsRpcUrl,
  networkIsSelected,
  networkDefaultedToProvider,
  providerUrl,
  providerType,
  isFullScreen,
}) => {
  return (
    <div
      className={classnames('networks-tab__networks-list', {
        'networks-tab__networks-list--selection':
          networkIsSelected && !networkDefaultedToProvider,
      })}
    >
      {networksToRender.map((network) => (
        <NetworkListItem
          key={`settings-network-list:${network.rpcUrl}`}
          network={network}
          selectedNetwork={selectedNetwork}
          selectRpcUrl={selectedNetwork.rpcUrl}
          setSelectedSettingsRpcUrl={setSelectedSettingsRpcUrl}
          networkIsSelected={networkIsSelected}
          providerUrl={providerUrl}
          providerType={providerType}
          isFullScreen={isFullScreen}
        />
      ))}
    </div>
  );
};
NetworkList.propTypes = {
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedNetwork: PropTypes.object,
  setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
  networkIsSelected: PropTypes.bool,
  networkDefaultedToProvider: PropTypes.bool,
  providerUrl: PropTypes.string,
  providerType: PropTypes.string,
  isFullScreen: PropTypes.bool.isRequired,
};

const NetworkTabContent = ({
  setRpcTarget,
  showConfirmDeleteNetworkModal,
  setSelectedSettingsRpcUrl,
  selectedNetwork,
  editRpc,
  providerUrl,
  providerType,
  networkDefaultedToProvider,
  networkIsSelected,
  networksToRender,
  isFullScreen,
  shouldRenderNetworkForm,
}) => {
  const history = useHistory();
  const t = useI18nContext();
  const {
    labelKey,
    label,
    rpcUrl,
    chainId,
    ticker,
    viewOnly,
    rpcPrefs,
    blockExplorerUrl,
  } = selectedNetwork;
  return (
    <>
      <NetworkList
        networksToRender={networksToRender}
        selectedNetwork={selectedNetwork}
        setSelectedSettingsRpcUrl={setSelectedSettingsRpcUrl}
        networkIsSelected={networkIsSelected}
        networkDefaultedToProvider={networkDefaultedToProvider}
        providerType={providerType}
        providerUrl={providerUrl}
        isFullScreen={isFullScreen}
      />
      {shouldRenderNetworkForm ? (
        <NetworkForm
          setRpcTarget={setRpcTarget}
          editRpc={editRpc}
          networkName={label || (labelKey && t(labelKey)) || ''}
          rpcUrl={rpcUrl}
          chainId={chainId}
          networksToRender={networksToRender}
          ticker={ticker}
          onClear={(shouldUpdateHistory = true) => {
            setSelectedSettingsRpcUrl('');
            if (shouldUpdateHistory) {
              history.push(NETWORKS_ROUTE);
            }
          }}
          showConfirmDeleteNetworkModal={showConfirmDeleteNetworkModal}
          viewOnly={viewOnly}
          isCurrentRpcTarget={providerUrl === rpcUrl}
          rpcPrefs={rpcPrefs}
          blockExplorerUrl={blockExplorerUrl}
          isFullScreen={isFullScreen}
          history={history}
        />
      ) : null}
    </>
  );
};
NetworkTabContent.propTypes = {
  setRpcTarget: PropTypes.func.isRequired,
  showConfirmDeleteNetworkModal: PropTypes.func.isRequired,
  setSelectedSettingsRpcUrl: PropTypes.func.isRequired,
  selectedNetwork: PropTypes.object,
  editRpc: PropTypes.func.isRequired,
  providerUrl: PropTypes.string,
  providerType: PropTypes.string,
  networksToRender: PropTypes.arrayOf(PropTypes.object).isRequired,
  isFullScreen: PropTypes.bool.isRequired,
  shouldRenderNetworkForm: PropTypes.bool.isRequired,
  networkIsSelected: PropTypes.bool,
  networkDefaultedToProvider: PropTypes.bool,
};
export default NetworkTabContent;
