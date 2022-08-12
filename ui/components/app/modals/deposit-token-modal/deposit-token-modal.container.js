import { connect } from 'react-redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import {
  getCurrentChainId,
  getIsBuyableCoinbasePayChain,
  getIsMainnet,
  getIsTestnet,
  getSelectedAddress,
  getIsBuyableTransakChain,
  getIsBuyableCoinbasePayToken,
  getIsBuyableTransakToken,
} from '../../../../selectors/selectors';
import {
  buyToken,
  hideModal,
  hideWarning,
  showModal,
} from '../../../../store/actions';
import DepositTokenModal from './deposit-token-modal.component';

function mapStateToProps(state) {
  const { symbol } = state.appState.modal.modalState.props.token;
  return {
    chainId: getCurrentChainId(state),
    isTestnet: getIsTestnet(state),
    isMainnet: getIsMainnet(state),
    address: getSelectedAddress(state),
    isBuyableCoinbasePayChain: getIsBuyableCoinbasePayChain(state),
    isBuyableTransakChain: getIsBuyableTransakChain(state),
    isTokenBuyableCoinbasePay: getIsBuyableCoinbasePayToken(state, symbol),
    isTokenBuyableTransak: getIsBuyableTransakToken(state, symbol),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toCoinbasePay: (address, chainId, symbol) => {
      dispatch(buyToken({ service: 'coinbase', address, chainId, symbol }));
    },
    toTransak: (address, chainId, symbol) => {
      dispatch(buyToken({ service: 'transak', address, chainId, symbol }));
    },
    hideModal: () => {
      dispatch(hideModal());
    },
    hideWarning: () => {
      dispatch(hideWarning());
    },
    showAccountDetailModal: () => {
      dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
    },
    toFaucet: (chainId) => dispatch(buyToken({ chainId })),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withModalProps(DepositTokenModal));
