import { connect } from 'react-redux';
import {
  getSendAmount,
  getSendAsset,
  sendAmountIsInError,
  updateSendAmount,
} from '../../../ducks/send';
import AssetPickerAmount from './asset-picker-amount';

export default connect(mapStateToProps, mapDispatchToProps)(AssetPickerAmount);

function mapStateToProps(state) {
  return {
    asset: getSendAsset(state),
    amount: getSendAmount(state),
    inError: sendAmountIsInError(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAmount: (newAmount) => dispatch(updateSendAmount(newAmount)),
  };
}
