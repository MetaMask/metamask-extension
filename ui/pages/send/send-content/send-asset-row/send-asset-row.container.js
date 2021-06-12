import { connect } from 'react-redux';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import {
  getMetaMaskAccounts,
  getNativeCurrencyImage,
  getSendTokenAddress,
  getAssetImages,
} from '../../../../selectors';
import { updateSendToken } from '../../../../ducks/send/send.duck';
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
    setSendToken: (token) => dispatch(updateSendToken(token)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);
