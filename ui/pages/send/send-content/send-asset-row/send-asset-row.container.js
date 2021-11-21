import { connect } from 'react-redux';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import {
  getMetaMaskAccounts,
  getNativeCurrencyImage,
} from '../../../../selectors';
import { updateSendAsset, getSendAssetAddress } from '../../../../ducks/send';
import SendAssetRow from './send-asset-row.component';

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    sendAssetAddress: getSendAssetAddress(state),
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: getNativeCurrency(state),
    nativeCurrencyImage: getNativeCurrencyImage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: ({ type, details }) =>
      dispatch(updateSendAsset({ type, details })),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);
