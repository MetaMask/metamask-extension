import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  setSelectedSettingsRpcUrl,
  updateAndSetCustomRpc,
  displayWarning,
  editRpc,
  showModal,
  setNewNetworkAdded,
} from '../../../store/actions';
import {
  ADD_NETWORK_ROUTE,
  NETWORKS_FORM_ROUTE,
} from '../../../helpers/constants/routes';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
import { NETWORK_TYPE_RPC } from '../../../../shared/constants/network';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import NetworksTab from './networks-tab.component';
import { defaultNetworksData } from './networks-tab.constants';

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const mapStateToProps = (state, ownProps) => {
  const {
    location: { pathname },
  } = ownProps;

  const environmentType = getEnvironmentType();
  const isFullScreen = environmentType === ENVIRONMENT_TYPE_FULLSCREEN;
  const shouldRenderNetworkForm =
    isFullScreen || Boolean(pathname.match(NETWORKS_FORM_ROUTE));
  const addNewNetwork = Boolean(pathname.match(ADD_NETWORK_ROUTE));

  const { frequentRpcListDetail, provider } = state.metamask;
  const { networksTabSelectedRpcUrl } = state.appState;
  const frequentRpcNetworkListDetails = frequentRpcListDetail.map((rpc) => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: NETWORK_TYPE_RPC,
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      ticker: rpc.ticker,
      blockExplorerUrl: rpc.rpcPrefs?.blockExplorerUrl || '',
    };
  });

  const networksToRender = [
    ...defaultNetworks,
    ...frequentRpcNetworkListDetails,
  ];
  let selectedNetwork =
    networksToRender.find(
      (network) => network.rpcUrl === networksTabSelectedRpcUrl,
    ) || {};
  const networkIsSelected = Boolean(selectedNetwork.rpcUrl);

  let networkDefaultedToProvider = false;
  if (!networkIsSelected) {
    selectedNetwork =
      networksToRender.find((network) => {
        return (
          network.rpcUrl === provider.rpcUrl ||
          (network.providerType !== NETWORK_TYPE_RPC &&
            network.providerType === provider.type)
        );
      }) || {};
    networkDefaultedToProvider = true;
  }

  return {
    selectedNetwork,
    networksToRender,
    networkIsSelected,
    providerType: provider.type,
    providerUrl: provider.rpcUrl,
    networkDefaultedToProvider,
    isFullScreen,
    shouldRenderNetworkForm,
    addNewNetwork,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setSelectedSettingsRpcUrl: (newRpcUrl) =>
      dispatch(setSelectedSettingsRpcUrl(newRpcUrl)),
    setRpcTarget: (newRpc, chainId, ticker, nickname, rpcPrefs) => {
      return dispatch(
        updateAndSetCustomRpc(newRpc, chainId, ticker, nickname, rpcPrefs),
      );
    },
    showConfirmDeleteNetworkModal: ({ target, onConfirm }) => {
      return dispatch(
        showModal({ name: 'CONFIRM_DELETE_NETWORK', target, onConfirm }),
      );
    },
    displayWarning: (warning) => dispatch(displayWarning(warning)),
    editRpc: (oldRpc, newRpc, chainId, ticker, nickname, rpcPrefs) => {
      return dispatch(
        editRpc(oldRpc, newRpc, chainId, ticker, nickname, rpcPrefs),
      );
    },
    setNewNetworkAdded: (newNetwork) => {
      dispatch(setNewNetworkAdded(newNetwork));
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(NetworksTab);
