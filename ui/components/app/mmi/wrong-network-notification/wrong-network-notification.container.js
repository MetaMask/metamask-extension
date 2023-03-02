import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getProvider,
  getIsCustodianSupportedChain,
  getSelectedAccountCachedBalance,
} from '../../../../selectors';
import WrongNetworkNotification from './wrong-network-notification.component';

const mapStateToProps = (state) => {
  return {
    provider: getProvider(state),
    balance: getSelectedAccountCachedBalance(state),
    isCustodianSupportedChain: getIsCustodianSupportedChain(state),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(WrongNetworkNotification);
