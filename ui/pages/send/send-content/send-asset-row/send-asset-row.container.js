import { connect } from 'react-redux';
import {
  getMetaMaskAccounts,
  getNativeCurrencyImage,
  getAssetImages,
} from '../../../../selectors';
import { updateSendAsset, getSendTokenAddress } from '../../../../ducks/send';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import SendAssetRow from './send-asset-row.component';

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    sendTokenAddress: getSendTokenAddress(state),
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: getNativeCurrency(state),
    nativeCurrencyImage: getNativeCurrencyImage(state),
    assetImages: getAssetImages(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: ({ type, details }) =>
      dispatch(updateSendAsset({ type, details })),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);
