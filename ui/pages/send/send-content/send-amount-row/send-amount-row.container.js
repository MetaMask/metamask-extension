import { connect } from 'react-redux';
import {
  updateSendAmount,
  getSendAmount,
  sendAmountIsInError,
  getSendAsset,
} from '../../../../ducks/send';
import {
  getMetaMaskAccounts,
} from '../../../../selectors';
import SendAmountRow from './send-amount-row.component';
export default connect(mapStateToProps, mapDispatchToProps)(SendAmountRow);

function mapStateToProps(state) {
  const { metamask: { nativeCurrency } } = state;
  const { metamask } = state;
  return {
    metamask,
    nativeCurrency,
    accounts: getMetaMaskAccounts(state),
    selectedAddress: state.metamask.selectedAddress,
    amount: getSendAmount(state),
    inError: sendAmountIsInError(state),
    asset: getSendAsset(state),

  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAmount: (newAmount) => dispatch(updateSendAmount(newAmount)),
  };
}
