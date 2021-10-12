import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import {
  updateAndSetCustomRpc,
  setNewNetworkAdded,
} from '../../../../store/actions';
import { NETWORK_TYPE_RPC } from '../../../../../shared/constants/network';
import { defaultNetworksData } from '../networks-tab.constants';
import AddNetworkForm from './add-network-form.component';

const mapStateToProps = (state) => {
  const { frequentRpcListDetail } = state.metamask;

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
    ...defaultNetworksData,
    ...frequentRpcNetworkListDetails,
  ];

  return {
    networksToRender,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setRpcTarget: (newRpc, chainId, ticker, nickname, rpcPrefs) => {
      return dispatch(
        updateAndSetCustomRpc(newRpc, chainId, ticker, nickname, rpcPrefs),
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
)(AddNetworkForm);
